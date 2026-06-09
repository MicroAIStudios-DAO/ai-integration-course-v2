/**
 * Fix 2: Guest Checkout Linker
 * 
 * Problem: If a user checks out as a guest with blaine@gmail.com but creates
 * their Firebase account with blaine.casey@gmail.com or blaine+work@gmail.com,
 * the session never gets linked.
 * 
 * Solution: Two-pronged approach:
 * 1. Auth Trigger: When a new user is created, normalize their email and
 *    proactively query checkout_sessions for unattached paid sessions.
 * 2. localStorage Fallback: The frontend stores a `lead_id` before redirecting
 *    to Stripe. On signup, this ID is passed to the server as a hard link.
 */

import admin from 'firebase-admin';
import { onCustomEventPublished } from 'firebase-functions/v2/eventarc';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const db = admin.firestore();

// ─── Email Normalization ─────────────────────────────────────────────────────
// Strips Gmail-style + tags, dots (for Gmail), and lowercases everything.
// This creates a "canonical" email that can match across variations.

function normalizeEmailStrict(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const [localPart, domain] = trimmed.split('@');
  if (!localPart || !domain) return trimmed;

  // Strip + tags (blaine+work@gmail.com → blaine@gmail.com)
  const withoutPlusTag = localPart.split('+')[0];

  // Strip dots for Gmail/Googlemail (b.laine@gmail.com → blaine@gmail.com)
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  const canonicalLocal = isGmail
    ? withoutPlusTag.replace(/\./g, '')
    : withoutPlusTag;

  return `${canonicalLocal}@${domain}`;
}

function normalizeEmailBasic(email: unknown): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

// ─── Auth Trigger: Link unattached sessions on user creation ─────────────────
// This enhances the existing onUserCreateV2 by adding checkout session discovery.

export const linkGuestCheckoutOnUserCreate = onCustomEventPublished(
  {
    region: 'us-central1',
    eventType: 'google.firebase.auth.user.v1.created',
  },
  async (event) => {
    const user = (event.data as any) || {};
    const uid = user.uid || user.userId || user.user_id;
    const rawEmail = user.email || user.emailAddress || '';

    if (!uid || !rawEmail) {
      console.log('[GuestLinker] No uid or email in auth event, skipping');
      return;
    }

    const normalizedEmail = normalizeEmailBasic(rawEmail);
    const canonicalEmail = normalizeEmailStrict(rawEmail);

    console.log(`[GuestLinker] New user ${uid}, email: ${normalizedEmail}, canonical: ${canonicalEmail}`);

    // Strategy 1: Direct email match on checkout_sessions
    let sessionDoc = await findUnattachedSession('email', normalizedEmail);

    // Strategy 2: Canonical email match (handles +tags and dots)
    if (!sessionDoc && canonicalEmail !== normalizedEmail) {
      // Query all unattached sessions and check canonical match
      const unattachedSessions = await db
        .collection('checkout_sessions')
        .where('attachedUid', '==', null)
        .where('status', 'in', ['active', 'trialing', 'complete'])
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      for (const doc of unattachedSessions.docs) {
        const sessionEmail = normalizeEmailStrict(doc.get('email') || '');
        if (sessionEmail === canonicalEmail) {
          sessionDoc = doc;
          break;
        }
      }
    }

    // Strategy 3: Check the leads collection for a lead_id match
    if (!sessionDoc) {
      const leadDoc = await db.collection('leads').doc(normalizedEmail).get();
      if (leadDoc.exists) {
        const leadData = leadDoc.data();
        if (leadData?.status === 'converted' && leadData?.convertedSessionId) {
          const convertedSession = await db
            .collection('checkout_sessions')
            .doc(leadData.convertedSessionId)
            .get();
          if (convertedSession.exists && !convertedSession.get('attachedUid')) {
            sessionDoc = convertedSession as FirebaseFirestore.QueryDocumentSnapshot;
          }
        }
      }
    }

    if (!sessionDoc) {
      console.log(`[GuestLinker] No unattached session found for ${normalizedEmail}`);
      return;
    }

    // Found a match — link it atomically (Fix 3 pattern)
    const sessionId = sessionDoc.id;
    const sessionData = sessionDoc.data();

    console.log(`[GuestLinker] Found unattached session ${sessionId} for user ${uid}. Linking...`);

    try {
      await db.runTransaction(async (transaction) => {
        const sessionRef = db.collection('checkout_sessions').doc(sessionId);
        const userRef = db.collection('users').doc(uid);

        // Re-read inside transaction to prevent race conditions
        const freshSession = await transaction.get(sessionRef);
        if (freshSession.get('attachedUid')) {
          console.log(`[GuestLinker] Session ${sessionId} already attached (race condition avoided)`);
          return;
        }

        // Atomic write: link session + grant premium simultaneously
        transaction.update(sessionRef, {
          attachedUid: uid,
          attachedAt: admin.firestore.FieldValue.serverTimestamp(),
          linkedBy: 'guest_checkout_linker',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.set(
          userRef,
          {
            premium: sessionData.premiumUnlocked || true,
            subscriptionStatus: sessionData.status || 'active',
            subscriptionTier: sessionData.tier || 'explorer',
            billingInterval: sessionData.billingInterval || 'month',
            seatCount: sessionData.seatCount || 1,
            stripeCustomerId: sessionData.customerId || null,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            linkedFromGuestCheckout: true,
            linkedSessionId: sessionId,
          },
          { merge: true }
        );
      });

      console.log(`[GuestLinker] Successfully linked session ${sessionId} to user ${uid}`);
    } catch (err) {
      console.error(`[GuestLinker] Transaction failed for session ${sessionId}:`, err);
    }
  }
);

// ─── Callable: Link by lead_id (localStorage fallback) ───────────────────────
// The frontend stores a lead_id in localStorage before redirecting to Stripe.
// On signup, it passes this lead_id to bypass email matching entirely.

export const linkCheckoutByLeadId = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const leadId = typeof request.data?.leadId === 'string' ? request.data.leadId.trim() : '';
    if (!leadId) {
      throw new HttpsError('invalid-argument', 'lead_id is required.');
    }

    const uid = request.auth.uid;

    // Find the lead record
    const leadDoc = await db.collection('leads').doc(leadId).get();
    if (!leadDoc.exists) {
      throw new HttpsError('not-found', 'Lead record not found.');
    }

    const leadData = leadDoc.data()!;
    const sessionId = leadData.convertedSessionId;

    if (!sessionId) {
      // Lead exists but hasn't converted yet — check if there's a session by email
      const sessionByEmail = await findUnattachedSession('email', leadId);
      if (!sessionByEmail) {
        throw new HttpsError('not-found', 'No paid checkout session found for this lead.');
      }
      return await atomicLink(sessionByEmail.id, sessionByEmail.data(), uid, 'lead_id_email_fallback');
    }

    const sessionDoc = await db.collection('checkout_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Checkout session not found.');
    }

    if (sessionDoc.get('attachedUid') && sessionDoc.get('attachedUid') !== uid) {
      throw new HttpsError('already-exists', 'This session is already linked to another account.');
    }

    if (sessionDoc.get('attachedUid') === uid) {
      return { success: true, alreadyLinked: true };
    }

    return await atomicLink(sessionId, sessionDoc.data()!, uid, 'lead_id_direct');
  }
);

// ─── Helper: Find unattached session by field ────────────────────────────────
async function findUnattachedSession(
  field: string,
  value: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const snapshot = await db
    .collection('checkout_sessions')
    .where(field, '==', value)
    .where('attachedUid', '==', null)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0];
}

// ─── Helper: Atomic link (shared by auth trigger and callable) ───────────────
async function atomicLink(
  sessionId: string,
  sessionData: any,
  uid: string,
  source: string
): Promise<{ success: boolean; sessionId: string }> {
  await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('checkout_sessions').doc(sessionId);
    const userRef = db.collection('users').doc(uid);

    const freshSession = await transaction.get(sessionRef);
    if (freshSession.get('attachedUid') && freshSession.get('attachedUid') !== uid) {
      throw new HttpsError('already-exists', 'Session already attached to another user.');
    }

    transaction.update(sessionRef, {
      attachedUid: uid,
      attachedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: source,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(
      userRef,
      {
        premium: sessionData.premiumUnlocked || true,
        subscriptionStatus: sessionData.status || 'active',
        subscriptionTier: sessionData.tier || 'explorer',
        billingInterval: sessionData.billingInterval || 'month',
        seatCount: sessionData.seatCount || 1,
        stripeCustomerId: sessionData.customerId || null,
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        linkedFromGuestCheckout: true,
        linkedSessionId: sessionId,
      },
      { merge: true }
    );
  });

  return { success: true, sessionId };
}
