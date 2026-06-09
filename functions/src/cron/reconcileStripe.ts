/**
 * Fix 4: The "Safety Net" Reconciliation Cron
 * 
 * Problem: Even with the best webhook logic, network failures happen.
 * Users who paid can fall through the cracks.
 * 
 * Solution: A scheduled Cloud Function that runs every 6 hours to:
 * 1. Query Stripe for recently paid sessions (last 7 hours for overlap)
 * 2. Check if they exist and are marked "provisioned" in Firestore
 * 3. Automatically apply the fix if there's a discrepancy
 * 
 * This is the ultimate safety net — it catches:
 * - Webhook delivery failures
 * - Partial transaction failures that somehow bypassed atomicity
 * - Edge cases where the user's browser crashed mid-flow
 * - Stripe retries that arrived out of order
 */

import admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const db = admin.firestore();

// ─── Plan Configuration ──────────────────────────────────────────────────────

const PLAN_CONFIGS: Record<string, { tier: string; name: string }> = {
  explorer: { tier: 'explorer', name: 'Explorer' },
  pro: { tier: 'pro', name: 'Pro' },
  pro_trial: { tier: 'pro', name: 'Pro (Trial)' },
  corporate: { tier: 'corporate', name: 'Corporate' },
};

function isPremiumStatus(status: string): boolean {
  return ['active', 'trialing', 'complete', 'paid'].includes(status);
}

// ─── The Reconciliation Cron ─────────────────────────────────────────────────
// Runs every 6 hours. Checks the last 7 hours of Stripe sessions for overlap.

export const reconcileStripePayments = onSchedule(
  {
    schedule: 'every 6 hours',
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
    timeoutSeconds: 300,
    memory: '512MiB',
    retryCount: 3,
  },
  async () => {
    const stripeKey = STRIPE_SECRET.value();
    if (!stripeKey) {
      console.error('[Reconciler] STRIPE_SECRET not configured. Skipping.');
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

    // Look back 7 hours (1 hour overlap with the 6-hour schedule for safety)
    const lookbackSeconds = 7 * 60 * 60;
    const since = Math.floor(Date.now() / 1000) - lookbackSeconds;

    console.log(`[Reconciler] Starting reconciliation. Looking back to ${new Date(since * 1000).toISOString()}`);

    const stats = {
      stripeSessionsChecked: 0,
      alreadyProvisioned: 0,
      missingInFirestore: 0,
      fixedUnattached: 0,
      fixedPremiumMissing: 0,
      errors: 0,
    };

    try {
      // ─── Step 1: Get all completed checkout sessions from Stripe ─────────
      const sessions: Stripe.Checkout.Session[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const page = await stripe.checkout.sessions.list({
          limit: 100,
          created: { gte: since },
          status: 'complete',
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });

        sessions.push(...page.data);
        hasMore = page.has_more;
        if (page.data.length > 0) {
          startingAfter = page.data[page.data.length - 1].id;
        }
      }

      stats.stripeSessionsChecked = sessions.length;
      console.log(`[Reconciler] Found ${sessions.length} completed Stripe sessions in the lookback window.`);

      // ─── Step 2: Check each session against Firestore ────────────────────
      for (const stripeSession of sessions) {
        try {
          const sessionId = stripeSession.id;
          const customerEmail = stripeSession.customer_details?.email || stripeSession.customer_email || '';
          const customerId = typeof stripeSession.customer === 'string'
            ? stripeSession.customer
            : (stripeSession.customer as any)?.id || null;
          const subscriptionId = typeof stripeSession.subscription === 'string'
            ? stripeSession.subscription
            : (stripeSession.subscription as any)?.id || null;

          // Check if this session exists in Firestore
          const firestoreSession = await db.collection('checkout_sessions').doc(sessionId).get();

          if (!firestoreSession.exists) {
            // Session exists in Stripe but not in Firestore — webhook never arrived
            stats.missingInFirestore++;
            console.warn(`[Reconciler] Session ${sessionId} missing from Firestore! Creating...`);

            // Determine plan from metadata
            const planKey = stripeSession.metadata?.planKey || 'explorer';
            const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.explorer;

            await db.collection('checkout_sessions').doc(sessionId).set({
              sessionId,
              email: customerEmail.toLowerCase(),
              planKey,
              planName: planConfig.name,
              tier: planConfig.tier,
              status: 'active',
              premiumUnlocked: true,
              customerId,
              subscriptionId,
              attachedUid: null,
              seatCount: parseInt(stripeSession.metadata?.seatCount || '1', 10),
              billingInterval: stripeSession.metadata?.billingInterval || 'month',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
              source: 'stripe_reconciler',
            });

            // Try to find the user by email and link
            await tryLinkSessionToUser(sessionId, customerEmail, customerId, planKey, planConfig);
            stats.fixedUnattached++;
            continue;
          }

          const firestoreData = firestoreSession.data()!;

          // If session is attached, verify the user actually has premium
          if (firestoreData.attachedUid) {
            const userDoc = await db.collection('users').doc(firestoreData.attachedUid).get();

            if (userDoc.exists) {
              const userData = userDoc.data()!;

              // Check for the "attached but not premium" bug
              if (
                firestoreData.premiumUnlocked &&
                userData.premium !== true
              ) {
                stats.fixedPremiumMissing++;
                console.warn(
                  `[Reconciler] User ${firestoreData.attachedUid} has attached session ${sessionId} ` +
                  `but premium=false! Fixing...`
                );

                await db.runTransaction(async (transaction) => {
                  const userRef = db.collection('users').doc(firestoreData.attachedUid);
                  transaction.set(
                    userRef,
                    {
                      premium: true,
                      subscriptionStatus: firestoreData.status || 'active',
                      subscriptionTier: firestoreData.tier || 'explorer',
                      planKey: firestoreData.planKey || 'explorer',
                      reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                  );
                });
              } else {
                stats.alreadyProvisioned++;
              }
            }
          } else {
            // Session exists but is unattached — try to link
            if (firestoreData.premiumUnlocked || isPremiumStatus(firestoreData.status)) {
              const planKey = firestoreData.planKey || 'explorer';
              const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.explorer;
              const linked = await tryLinkSessionToUser(
                sessionId,
                firestoreData.email || customerEmail,
                firestoreData.customerId || customerId,
                planKey,
                planConfig
              );
              if (linked) {
                stats.fixedUnattached++;
              }
            }
          }
        } catch (sessionError) {
          stats.errors++;
          console.error(`[Reconciler] Error processing session:`, sessionError);
        }
      }

      // ─── Step 3: Also check for active subscriptions not in Firestore ────
      // This catches subscription renewals where the webhook failed
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        created: { gte: since },
        limit: 50,
      });

      for (const sub of subscriptions.data) {
        const uid = sub.metadata?.firebaseUID || sub.metadata?.firebase_uid;
        if (!uid) continue;

        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data()?.premium !== true) {
          stats.fixedPremiumMissing++;
          console.warn(`[Reconciler] Active subscription ${sub.id} for user ${uid} but premium=false! Fixing...`);

          await db.collection('users').doc(uid).set(
            {
              premium: true,
              subscriptionStatus: 'active',
              reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    } catch (error) {
      console.error('[Reconciler] Fatal error during reconciliation:', error);
      stats.errors++;
    }

    // ─── Step 4: Log results ───────────────────────────────────────────────
    console.log('[Reconciler] Reconciliation complete:', JSON.stringify(stats, null, 2));

    // Store the run result for monitoring
    await db.collection('system_logs').add({
      type: 'stripe_reconciliation',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stats,
      lookbackSince: new Date(since * 1000).toISOString(),
    });
  }
);

// ─── Helper: Try to link an unattached session to a user ─────────────────────

async function tryLinkSessionToUser(
  sessionId: string,
  email: string,
  customerId: string | null,
  planKey: string,
  planConfig: { tier: string; name: string }
): Promise<boolean> {
  if (!email && !customerId) return false;

  let userDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  // Try by email first
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const byEmail = await db
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!byEmail.empty) {
      userDoc = byEmail.docs[0];
    }
  }

  // Try by stripeCustomerId
  if (!userDoc && customerId) {
    const byCustomer = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!byCustomer.empty) {
      userDoc = byCustomer.docs[0];
    }
  }

  if (!userDoc) return false;

  const uid = userDoc.id;

  // Atomic link
  await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('checkout_sessions').doc(sessionId);
    const userRef = db.collection('users').doc(uid);

    transaction.update(sessionRef, {
      attachedUid: uid,
      attachedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: 'reconciler',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(
      userRef,
      {
        premium: true,
        subscriptionStatus: 'active',
        subscriptionTier: planConfig.tier,
        planKey,
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  console.log(`[Reconciler] Linked session ${sessionId} to user ${uid} via reconciliation.`);
  return true;
}
