/**
 * Circle.so Community Integration
 *
 * Firebase Cloud Functions for Circle.so SSO and community features:
 *   1. circleSSO — Generates a Circle.so SSO token from Firebase Auth
 *   2. circleGetSpaces — Lists available community spaces for the user's tier
 *   3. circleSyncMember — Syncs subscription tier changes to Circle member groups
 *
 * Architecture:
 *   - Firebase Auth → Circle SSO (JWT-based)
 *   - Subscription tier maps to Circle member groups:
 *     - Free → "Community" space only
 *     - Explorer → "Community" + "Explorer Cohort"
 *     - Pro → All spaces including "Pro Architects" and "Governance Lab"
 *     - Corporate → All spaces + "Enterprise" private channel
 *
 * Required Firebase Functions config:
 *   circle.api_token — Circle.so API token (from Settings > API)
 *   circle.community_id — Circle community ID
 *   circle.sso_key — Circle SSO signing key
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import * as crypto from 'crypto';

// ─── Config ─────────────────────────────────────────────────────────────────
const CIRCLE_API_TOKEN = defineString('CIRCLE_API_TOKEN', { default: '' });
const CIRCLE_COMMUNITY_ID = defineString('CIRCLE_COMMUNITY_ID', { default: '' });
const CIRCLE_SSO_KEY = defineString('CIRCLE_SSO_KEY', { default: '' });

// ─── Types ──────────────────────────────────────────────────────────────────

interface CircleSpace {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPrivate: boolean;
  memberCount?: number;
}

interface CircleMemberGroup {
  id: string;
  name: string;
}

// Tier → Space access mapping
const TIER_SPACE_ACCESS: Record<string, string[]> = {
  free: ['community', 'introductions'],
  explorer: ['community', 'introductions', 'explorer-cohort', 'weekly-challenges'],
  pro: ['community', 'introductions', 'explorer-cohort', 'weekly-challenges', 'pro-architects', 'governance-lab', 'office-hours'],
  corporate: ['community', 'introductions', 'explorer-cohort', 'weekly-challenges', 'pro-architects', 'governance-lab', 'office-hours', 'enterprise'],
  founding: ['community', 'introductions', 'explorer-cohort', 'weekly-challenges', 'pro-architects', 'governance-lab', 'office-hours', 'founding-members'],
};

// ─── Helper: Circle API call ────────────────────────────────────────────────

async function circleAPI(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  const token = CIRCLE_API_TOKEN.value();
  if (!token) {
    throw new HttpsError('failed-precondition', 'Circle.so is not configured. Set CIRCLE_API_TOKEN.');
  }

  const url = `https://app.circle.so/api/v1${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpsError('internal', `Circle API error: ${response.status} — ${errorText}`);
  }

  return response.json();
}

// ─── Helper: Generate Circle SSO JWT ────────────────────────────────────────

function generateCircleSSOToken(user: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  tier: string;
}): string {
  const ssoKey = CIRCLE_SSO_KEY.value();
  if (!ssoKey) {
    throw new HttpsError('failed-precondition', 'Circle SSO key not configured.');
  }

  // Circle uses HMAC-based SSO tokens
  const payload = {
    user_id: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    avatar_url: user.photoURL || '',
    // Circle member group based on tier
    member_tag: getTierGroupName(user.tier),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ssoKey)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

function getTierGroupName(tier: string): string {
  switch (tier) {
    case 'corporate': return 'Enterprise';
    case 'pro': return 'Pro Architects';
    case 'explorer': return 'Explorer Cohort';
    case 'founding': return 'Founding Members';
    default: return 'Community';
  }
}

// ─── 1. circleSSO — Generate SSO token for seamless login ───────────────────

export const circleSSO = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to access the community.');
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data() || {};

    const tier = userData.subscriptionTier || userData.tier || 'free';
    const communityId = CIRCLE_COMMUNITY_ID.value();

    const ssoToken = generateCircleSSOToken({
      uid: request.auth.uid,
      email: request.auth.token.email || '',
      displayName: request.auth.token.name || '',
      photoURL: request.auth.token.picture || '',
      tier,
    });

    // Determine which spaces the user can access
    const accessibleSpaces = TIER_SPACE_ACCESS[tier] || TIER_SPACE_ACCESS['free'];

    return {
      ssoToken,
      communityUrl: `https://community.aiintegrationcourse.com/sso?token=${ssoToken}`,
      communityId,
      tier,
      accessibleSpaces,
      memberGroup: getTierGroupName(tier),
    };
  }
);

// ─── 2. circleGetSpaces — List available community spaces ───────────────────

export const circleGetSpaces = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to view community spaces.');
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data() || {};
    const tier = userData.subscriptionTier || userData.tier || 'free';

    const accessibleSlugs = TIER_SPACE_ACCESS[tier] || TIER_SPACE_ACCESS['free'];

    // Define available spaces (these would normally come from Circle API)
    const allSpaces: CircleSpace[] = [
      { id: 'sp_community', name: 'Community', slug: 'community', description: 'General discussion for all members', isPrivate: false },
      { id: 'sp_intros', name: 'Introductions', slug: 'introductions', description: 'Introduce yourself to the community', isPrivate: false },
      { id: 'sp_explorer', name: 'Explorer Cohort', slug: 'explorer-cohort', description: 'Weekly challenges and peer learning for Explorer tier', isPrivate: true },
      { id: 'sp_challenges', name: 'Weekly Challenges', slug: 'weekly-challenges', description: 'Hands-on AI integration challenges with peer review', isPrivate: true },
      { id: 'sp_pro', name: 'Pro Architects', slug: 'pro-architects', description: 'Advanced discussions on agent architecture and governance', isPrivate: true },
      { id: 'sp_governance', name: 'Governance Lab', slug: 'governance-lab', description: 'ProofGuard attestation discussions and governance best practices', isPrivate: true },
      { id: 'sp_office', name: 'Office Hours', slug: 'office-hours', description: 'Live Q&A sessions with instructors', isPrivate: true },
      { id: 'sp_enterprise', name: 'Enterprise', slug: 'enterprise', description: 'Enterprise deployment strategies and compliance discussions', isPrivate: true },
      { id: 'sp_founding', name: 'Founding Members', slug: 'founding-members', description: 'Exclusive space for founding members — roadmap input and early access', isPrivate: true },
    ];

    const spaces = allSpaces.map((space) => ({
      ...space,
      accessible: accessibleSlugs.includes(space.slug),
      requiresTier: getMinimumTierForSpace(space.slug),
    }));

    return {
      spaces,
      currentTier: tier,
      accessibleCount: spaces.filter((s) => s.accessible).length,
      totalCount: spaces.length,
    };
  }
);

function getMinimumTierForSpace(slug: string): string {
  if (['community', 'introductions'].includes(slug)) return 'free';
  if (['explorer-cohort', 'weekly-challenges'].includes(slug)) return 'explorer';
  if (['pro-architects', 'governance-lab', 'office-hours'].includes(slug)) return 'pro';
  if (slug === 'enterprise') return 'corporate';
  if (slug === 'founding-members') return 'founding';
  return 'free';
}

// ─── 3. circleSyncMember — Sync tier changes to Circle groups ───────────────

export const circleSyncMember = onDocumentUpdated(
  'users/{uid}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;

    const oldTier = before.subscriptionTier || before.tier || 'free';
    const newTier = after.subscriptionTier || after.tier || 'free';

    // Only sync if tier changed
    if (oldTier === newTier) return;

    const token = CIRCLE_API_TOKEN.value();
    if (!token) return; // Circle not configured, skip silently

    const communityId = CIRCLE_COMMUNITY_ID.value();
    const email = after.email;

    if (!email || !communityId) return;

    try {
      // Update member's group in Circle
      await circleAPI(`/community_members?community_id=${communityId}&email=${encodeURIComponent(email)}`, 'GET')
        .then(async (response: any) => {
          const members = Array.isArray(response) ? response : response?.records || [];
          if (members.length === 0) return;

          const memberId = members[0].id;
          const newGroupName = getTierGroupName(newTier);

          // Update member tag/group
          await circleAPI(`/community_members/${memberId}`, 'PUT', {
            community_id: communityId,
            member_tag: newGroupName,
          });
        });

      // Log the sync
      const db = getFirestore();
      await db.collection('users').doc(event.params.uid).collection('activityLog').add({
        type: 'circle_sync',
        oldTier,
        newTier,
        newGroup: getTierGroupName(newTier),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`Circle sync failed for user ${event.params.uid}:`, err.message);
      // Non-fatal — don't throw, just log
    }
  }
);
