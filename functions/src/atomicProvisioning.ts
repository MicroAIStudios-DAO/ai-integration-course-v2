/**
 * Fix 3: Atomic Provisioning
 * 
 * Problem: Marking a session as "attached" and granting the user "premium" 
 * access are two separate writes. A transient database error could leave a 
 * user where their session is "attached" but their account isn't premium.
 * 
 * Solution: Wrap the attach logic in a Firestore Transaction so both writes
 * succeed or both fail — no partial states.
 * 
 * This module provides the `attachCheckoutSessionAtomicV2` callable that
 * replaces the non-atomic version. The existing `attachCheckoutSessionToUserV2`
 * in stripe.ts is preserved for backward compatibility but should be deprecated.
 */

import admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const db = admin.firestore();

// ─── Types ───────────────────────────────────────────────────────────────────

interface AttachRequest {
  sessionId: string;
  displayName?: string;
  leadId?: string; // Fix 2: localStorage fallback
}

interface AttachResponse {
  success: boolean;
  attachedUid: string;
  planKey: string;
  status: string;
  tier: string;
  wasAlreadyAttached: boolean;
}

// ─── Plan Configuration (mirrors stripe.ts) ──────────────────────────────────

const PLAN_CONFIGS: Record<string, { tier: string; name: string }> = {
  explorer: { tier: 'explorer', name: 'Explorer' },
  pro: { tier: 'pro', name: 'Pro' },
  pro_trial: { tier: 'pro', name: 'Pro (Trial)' },
  corporate: { tier: 'corporate', name: 'Corporate' },
};

function isPremiumStatus(status: string): boolean {
  return ['active', 'trialing', 'complete'].includes(status);
}

// ─── The Atomic Attach Function ──────────────────────────────────────────────

export const attachCheckoutSessionAtomicV2 = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
  },
  async (request): Promise<AttachResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in to attach a checkout session.');
    }

    const uid = request.auth.uid;
    const { sessionId, displayName, leadId } = request.data as AttachRequest;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'A valid sessionId is required.');
    }

    // ─── Execute as a single Firestore Transaction ─────────────────────────
    const result = await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection('checkout_sessions').doc(sessionId);
      const userRef = db.collection('users').doc(uid);
      const subscriptionRef = db.collection('users').doc(uid).collection('subscriptions').doc('current');

      // 1. Read the session document inside the transaction
      const sessionSnap = await transaction.get(sessionRef);

      if (!sessionSnap.exists) {
        throw new HttpsError('not-found', 'Checkout session not found.');
      }

      const sessionData = sessionSnap.data()!;

      // 2. Validate: Is this session already attached to someone else?
      if (sessionData.attachedUid && sessionData.attachedUid !== uid) {
        throw new HttpsError(
          'already-exists',
          'This checkout session is already linked to a different account. Please contact support.'
        );
      }

      // 3. If already attached to this user, return early (idempotent)
      if (sessionData.attachedUid === uid) {
        return {
          success: true,
          attachedUid: uid,
          planKey: sessionData.planKey || 'explorer',
          status: sessionData.status || 'active',
          tier: sessionData.tier || 'explorer',
          wasAlreadyAttached: true,
        };
      }

      // 4. Determine premium status
      const status = sessionData.status || 'active';
      const premiumUnlocked = isPremiumStatus(status);
      const planKey = sessionData.planKey || 'explorer';
      const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.explorer;
      const tier = sessionData.tier || planConfig.tier;
      const billingInterval = sessionData.billingInterval || 'month';
      const seatCount = sessionData.seatCount || 1;
      const customerId = sessionData.customerId || null;
      const subscriptionId = sessionData.subscriptionId || null;
      const periodEnd = sessionData.periodEnd || null;

      // 5. ATOMIC WRITE: Update session + user + subscription simultaneously
      // If any of these fail, ALL roll back. No partial state possible.

      // 5a. Mark session as attached
      transaction.update(sessionRef, {
        attachedUid: uid,
        status: premiumUnlocked ? status : 'provisioned',
        premiumUnlocked,
        attachedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        linkedBy: leadId ? 'atomic_with_lead_id' : 'atomic_attach',
      });

      // 5b. Update user document with premium access
      const userUpdate: Record<string, any> = {
        premium: premiumUnlocked,
        subscriptionStatus: status,
        subscriptionTier: tier,
        billingInterval,
        seatCount,
        planKey,
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (customerId) userUpdate.stripeCustomerId = customerId;
      if (displayName) userUpdate.displayName = displayName;
      if (subscriptionId) userUpdate.stripeSubscriptionId = subscriptionId;

      transaction.set(userRef, userUpdate, { merge: true });

      // 5c. Write subscription sub-document for detailed tracking
      transaction.set(subscriptionRef, {
        planKey,
        planName: planConfig.name,
        tier,
        status,
        billingInterval,
        seatCount,
        premiumUnlocked,
        customerId,
        subscriptionId,
        periodEnd: periodEnd || null,
        isTrialing: status === 'trialing',
        attachedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // 5d. If lead_id was provided, mark the lead as fully converted
      if (leadId) {
        const leadRef = db.collection('leads').doc(leadId);
        transaction.set(leadRef, {
          convertedUid: uid,
          convertedSessionId: sessionId,
          convertedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'converted',
        }, { merge: true });
      }

      return {
        success: true,
        attachedUid: uid,
        planKey,
        status,
        tier,
        wasAlreadyAttached: false,
      };
    });

    console.log(
      `[AtomicProvisioning] ${result.wasAlreadyAttached ? 'Already attached' : 'Newly attached'}: ` +
      `session=${sessionId}, uid=${uid}, plan=${result.planKey}, tier=${result.tier}`
    );

    return result;
  }
);

// ─── Health Check: Verify a user's provisioning state ────────────────────────
// Used by the frontend to confirm provisioning completed after the onSnapshot
// detects the premium flag.

export const verifyProvisioningState = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const uid = request.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { provisioned: false, reason: 'user_not_found' };
    }

    const data = userDoc.data()!;
    const subDoc = await db.collection('users').doc(uid).collection('subscriptions').doc('current').get();

    return {
      provisioned: data.premium === true,
      subscriptionStatus: data.subscriptionStatus || null,
      tier: data.subscriptionTier || null,
      planKey: data.planKey || null,
      hasSubscriptionDoc: subDoc.exists,
      stripeCustomerId: data.stripeCustomerId ? 'present' : null,
    };
  }
);
