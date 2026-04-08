import admin from 'firebase-admin';
import crypto from 'crypto';
import Stripe from 'stripe';
import type { CloudEvent } from 'firebase-functions/v2/core';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onCustomEventPublished } from 'firebase-functions/v2/eventarc';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_PRICE_EXPLORER_MONTHLY = defineSecret('STRIPE_PRICE_EXPLORER_MONTHLY');
const STRIPE_PRICE_PRO_ANNUAL = defineSecret('STRIPE_PRICE_PRO_ANNUAL');
const STRIPE_PRICE_CORPORATE_MONTHLY = defineSecret('STRIPE_PRICE_CORPORATE_MONTHLY');
const PLAYBOOK_DOWNLOAD_URL = 'https://aiintegrationcourse.com/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';
const PLAYBOOK_FALLBACK_URL = 'https://ai-integra-course-v2.web.app/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';
let stripe: Stripe | null = null;

type CheckoutPlanKey = 'explorer' | 'pro' | 'corporate';

type CheckoutPlanDefinition = {
  /** Stripe Price ID — MUST come from env, never from client */
  stripePriceId: string;
  tier: CheckoutPlanKey;
  billingInterval: 'month' | 'year';
  trialDays: number;
  seatCount: number;
  /** Amount charged per billing interval (cents-friendly: use dollars here) */
  displayPrice: number;
  /** For annual plans shown as monthly equivalent */
  displayMonthlyEquivalent?: number;
  /** Strikethrough anchor price for marketing */
  anchorMonthlyPrice?: number;
  name: string;
  /** Analytics value — always the per-interval charge in USD */
  analyticsValue: number;
};

const getStripePriceId = (
  envName: 'STRIPE_PRICE_EXPLORER_MONTHLY' | 'STRIPE_PRICE_PRO_ANNUAL' | 'STRIPE_PRICE_CORPORATE_MONTHLY'
): string => {
  const envValue = process.env[envName];
  if (envValue) {
    return envValue;
  }

  switch (envName) {
    case 'STRIPE_PRICE_EXPLORER_MONTHLY':
      return STRIPE_PRICE_EXPLORER_MONTHLY.value() || '';
    case 'STRIPE_PRICE_PRO_ANNUAL':
      return STRIPE_PRICE_PRO_ANNUAL.value() || '';
    case 'STRIPE_PRICE_CORPORATE_MONTHLY':
      return STRIPE_PRICE_CORPORATE_MONTHLY.value() || '';
    default:
      return '';
  }
};

const getPlanConfig = (planKey: CheckoutPlanKey): CheckoutPlanDefinition => {
  const planConfig: Record<CheckoutPlanKey, CheckoutPlanDefinition> = {
    explorer: {
      stripePriceId: getStripePriceId('STRIPE_PRICE_EXPLORER_MONTHLY'),
      tier: 'explorer',
      billingInterval: 'month',
      trialDays: 7,
      seatCount: 1,
      displayPrice: 29.99,
      name: 'Explorer',
      analyticsValue: 29.99,
    },
    pro: {
      stripePriceId: getStripePriceId('STRIPE_PRICE_PRO_ANNUAL'),
      tier: 'pro',
      billingInterval: 'year',
      trialDays: 7,
      seatCount: 1,
      displayPrice: 239.88,
      displayMonthlyEquivalent: 19.99,
      anchorMonthlyPrice: 39.99,
      name: 'Pro AI Architect',
      analyticsValue: 239.88,
    },
    corporate: {
      stripePriceId: getStripePriceId('STRIPE_PRICE_CORPORATE_MONTHLY'),
      tier: 'corporate',
      billingInterval: 'month',
      trialDays: 0,
      seatCount: 5,
      displayPrice: 149.00,
      name: 'Team AI Standard',
      analyticsValue: 149.00,
    },
  };

  const config = planConfig[planKey];
  if (!config) {
    throw new HttpsError('invalid-argument', `Invalid plan key: ${planKey}`);
  }
  if (!config.stripePriceId) {
    throw new HttpsError('failed-precondition', `Stripe price not configured for plan: ${planKey}`);
  }
  return config;
};

/**
 * Server resolves plan from a trusted key only.
 * Never accept a raw Stripe price ID from the client.
 */
const resolvePlanKey = (payload: Record<string, any> | undefined): CheckoutPlanKey => {
  const requested = payload?.planKey;
  if (requested === 'explorer' || requested === 'pro' || requested === 'corporate') {
    return requested;
  }
  throw new HttpsError('invalid-argument', 'A valid plan selection is required to start checkout.');
};

const isActiveSubscriptionStatus = (status: unknown): boolean =>
  status === 'active' || status === 'trialing';

/** Check if a plan key maps to the explorer trial tier */
const _isTrialPlan = (planKey: string | null | undefined): boolean => planKey === 'explorer';

/** Check if a plan key is corporate (multi-seat) */
const _isCorporatePlan = (planKey: string | null | undefined): boolean => planKey === 'corporate';

// Export for future use in entitlement checks
export { _isTrialPlan as isTrialPlan, _isCorporatePlan as isCorporatePlan };

function getStripe() {
  const secret = process.env.STRIPE_SECRET || STRIPE_SECRET.value();
  if (!stripe) {
    stripe = new Stripe(secret || '', { apiVersion: '2024-06-20' });
  }
  return { stripe, secret };
}

function generateUserApiKey(): string {
  return `ak_${crypto.randomBytes(24).toString('hex')}`;
}

async function ensureStrictMapping(uid: string, email?: string): Promise<string> {
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();
  let customerId = userSnap.get('stripeCustomerId') as string | undefined;
  const { stripe } = getStripe();

  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        customerId = undefined;
      } else {
        if (!customer.metadata?.firebaseUID) {
          await stripe.customers.update(customerId, {
            metadata: { firebaseUID: uid, firebase_uid: uid },
          });
        }
        return customerId;
      }
    } catch {
      customerId = undefined;
    }
  }

  const customer = await stripe.customers.create({
    email: email || userSnap.get('email'),
    metadata: { firebaseUID: uid, firebase_uid: uid },
  });
  customerId = customer.id;

  await userRef.set(
    {
      stripeCustomerId: customerId,
      stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customerId;
}

async function findUidByStripeCustomerId(customerId: string): Promise<string | null> {
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    return usersSnapshot.docs[0].id;
  }
  return null;
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  let uid = invoice.subscription_details?.metadata?.firebaseUID ||
    invoice.subscription_details?.metadata?.firebase_uid;

  if (!uid && invoice.customer) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
    const foundUid = await findUidByStripeCustomerId(customerId);
    if (foundUid) uid = foundUid;

    if (!uid) {
      const { stripe } = getStripe();
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
      }
    }
  }

  if (!uid) {
    console.error('Could not find Firebase UID for invoice', invoice.id);
    return;
  }

  let periodEnd: Date | null = null;
  let planKey = (invoice.subscription_details?.metadata?.planKey as string | undefined) || 'explorer';
  let tier = (invoice.subscription_details?.metadata?.tier as string | undefined) || planKey;
  let seatCount = 1;
  if (invoice.subscription) {
    const { stripe } = getStripe();
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subId);
    periodEnd = new Date(subscription.current_period_end * 1000);
    planKey = subscription.metadata?.planKey || planKey;
    tier = subscription.metadata?.tier || planKey;
    seatCount = parseInt(subscription.metadata?.seatCount || '1', 10);
  }

  await admin.firestore().doc(`users/${uid}`).set(
    {
      premium: true,
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      seatCount,
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
    {
      status: 'active',
      plan: planKey,
      tier,
      seatCount,
      period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Premium renewed for user ${uid}`);
}

async function queuePlaybookDeliveryEmail(uid: string): Promise<void> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);
  let queued = false;

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      return;
    }

    const alreadyQueued = Boolean(userSnap.get('playbookEmailQueuedAt'));
    if (alreadyQueued) {
      return;
    }

    const email = (userSnap.get('email') || '').toString().trim();
    if (!email) {
      return;
    }

    const displayName = (userSnap.get('displayName') || '').toString().trim();
    const firstName = displayName ? displayName.split(' ')[0] : 'there';
    const subject = 'Your AI Prompt Engineering Automation Playbook (PDF)';
    const body = `Hi ${firstName},

Welcome to AI Integration Course.

Here is your playbook download:
${PLAYBOOK_DOWNLOAD_URL}

Backup link:
${PLAYBOOK_FALLBACK_URL}

Keep this PDF handy as you go through the modules. It pairs directly with your practical lessons.

If you need help, reply to this email and we will support you.

The AI Integration Course Team`;

    const queueRef = db.collection('email_queue').doc();
    tx.set(queueRef, {
      to: email,
      subject,
      body,
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      type: 'playbook_delivery',
      playbookUrl: PLAYBOOK_DOWNLOAD_URL,
      playbookFallbackUrl: PLAYBOOK_FALLBACK_URL,
    });

    tx.set(userRef, {
      playbookEmailQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
      playbookEmailStatus: 'queued',
      playbookEmailType: 'playbook_delivery',
    }, { merge: true });

    queued = true;
  });

  if (queued) {
    console.log(`Queued playbook delivery email for user ${uid}`);
  } else {
    console.log(`Skipped playbook email queue for user ${uid} (already queued or missing email/user)`);
  }
}

export const onUserCreateV2 = onCustomEventPublished(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
    eventType: 'google.firebase.auth.user.v1.created',
  },
  async (event: CloudEvent<any>) => {
    const user = (event.data as any) || {};
    const uid = user.uid || user.userId || user.user_id;
    if (!uid) {
      console.error('Auth create event missing uid', event);
      return;
    }

    const userRef = admin.firestore().doc(`users/${uid}`);
    const existingUser = await userRef.get();
    const apiKey = existingUser.get('apiKey') || generateUserApiKey();

    const { stripe, secret } = getStripe();
    if (!secret) {
      console.error('Stripe not configured, skipping customer creation');
      await userRef.set(
        {
          email: user.email || user.emailAddress || null,
          displayName: user.displayName || user.name || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          premium: false,
          subscriptionStatus: 'none',
          apiKey,
          stripeError: 'Stripe not configured',
        },
        { merge: true }
      );
      return;
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email || user.emailAddress || undefined,
        metadata: {
          firebaseUID: uid,
          firebase_uid: uid,
        },
        name: user.displayName || user.name || undefined,
      });

      await userRef.set(
        {
          email: user.email || user.emailAddress || null,
          displayName: user.displayName || user.name || null,
          stripeCustomerId: customer.id,
          stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          premium: false,
          subscriptionStatus: 'none',
          apiKey,
        },
        { merge: true }
      );

      console.log(`Created Stripe customer ${customer.id} for Firebase user ${uid}`);
    } catch (err: any) {
      console.error(`Failed to create Stripe customer for user ${uid}:`, err.message);
      await userRef.set(
        {
          email: user.email || user.emailAddress || null,
          displayName: user.displayName || user.name || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          premium: false,
          subscriptionStatus: 'none',
          apiKey,
          stripeError: err.message,
        },
        { merge: true }
      );
    }
  }
);

export const createCheckoutSessionV2 = onCall(
  {
    region: 'us-central1',
    secrets: [
      STRIPE_SECRET,
      STRIPE_PRICE_EXPLORER_MONTHLY,
      STRIPE_PRICE_PRO_ANNUAL,
      STRIPE_PRICE_CORPORATE_MONTHLY,
    ],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const { stripe, secret } = getStripe();
    if (!secret) {
      throw new HttpsError('failed-precondition', 'Stripe not configured');
    }

    const uid = request.auth.uid;
    const email = request.auth.token?.email as string | undefined;

    // Server-side plan resolution — client sends planKey only, never a price ID
    const planKey = resolvePlanKey(request.data || {});
    const plan = getPlanConfig(planKey);

    const customerId = await ensureStrictMapping(uid, email);

    const baseUrl = 'https://aiintegrationcourse.com';
    const successUrl = request.data?.successUrl || `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`;
    const cancelUrl = request.data?.cancelUrl || `${baseUrl}/pricing`;

    // Build subscription_data with metadata and optional trial
    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: {
        firebaseUID: uid,
        firebase_uid: uid,
        planKey,
        tier: plan.tier,
        billingInterval: plan.billingInterval,
        seatCount: String(plan.seatCount),
      },
    };

    // Apply trial for Explorer and Pro — cancel subscription if no payment method collected
    if (plan.trialDays > 0) {
      subscriptionData.trial_period_days = plan.trialDays;
      subscriptionData.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: uid,
      mode: 'subscription',
      payment_method_collection: 'always',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: uid,
        firebase_uid: uid,
        planKey,
        tier: plan.tier,
        billingInterval: plan.billingInterval,
        seatCount: String(plan.seatCount),
        analyticsValue: String(plan.analyticsValue),
      },
      subscription_data: subscriptionData,
      // Allow promo codes on checkout
      allow_promotion_codes: true,
    });

    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.set(
      {
        pendingCheckoutPlanKey: planKey,
        pendingCheckoutTier: plan.tier,
        checkoutStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { id: session.id, planKey, url: session.url };
  }
);

export const stripeWebhookV2 = onRequest(
  { region: 'us-central1', secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET.value();
    if (!endpointSecret) {
      res.status(500).send('Webhook not configured');
      return;
    }

    const { stripe, secret } = getStripe();
    if (!secret) {
      res.status(500).send('Stripe not configured');
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          let uid = session.metadata?.firebaseUID ||
            session.metadata?.firebase_uid ||
            session.client_reference_id || undefined;

          if (!uid && session.customer) {
            const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
            const foundUid = await findUidByStripeCustomerId(customerId);
            if (foundUid) uid = foundUid;

            if (!uid) {
              const customer = await stripe.customers.retrieve(customerId);
              if (!customer.deleted) {
                uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
              }
            }
          }

          if (uid) {
            let periodEnd: Date | null = null;
            let planKey = (session.metadata?.planKey as string | undefined) || 'explorer';
            let subStatus: string = 'active';
            if (session.subscription) {
              const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
              const subscription = await stripe.subscriptions.retrieve(subId);
              periodEnd = new Date(subscription.current_period_end * 1000);
              planKey = subscription.metadata?.planKey || planKey;
              subStatus = subscription.status; // 'active' or 'trialing'
            }

            const tier = session.metadata?.tier || planKey;
            const seatCount = parseInt(session.metadata?.seatCount || '1', 10);
            const billingInterval = session.metadata?.billingInterval || 'month';
            const isTrialing = subStatus === 'trialing';

            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: true,
                subscriptionStatus: subStatus,
                subscriptionTier: tier,
                billingInterval,
                seatCount,
                lastPaymentAt: isTrialing ? null : admin.firestore.FieldValue.serverTimestamp(),
                trialStartedAt: isTrialing ? admin.firestore.FieldValue.serverTimestamp() : null,
                trialEndsAt: isTrialing && periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
                pendingCheckoutPlanKey: admin.firestore.FieldValue.delete(),
                pendingCheckoutTier: admin.firestore.FieldValue.delete(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: subStatus,
                plan: planKey,
                tier,
                billingInterval,
                seatCount,
                period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer,
                checkoutSessionId: session.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            try {
              await queuePlaybookDeliveryEmail(uid);
            } catch (emailQueueErr) {
              console.error(`Failed to queue playbook email for user ${uid}:`, emailQueueErr);
            }

            console.log(`Premium activated for user ${uid} with plan ${planKey}, tier: ${tier}`);
          } else {
            console.error('Could not find Firebase UID for checkout session', session.id);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          let uid: string | undefined = subscription.metadata?.firebaseUID ||
            subscription.metadata?.firebase_uid;

          if (!uid && subscription.customer) {
            const customerId = typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;
            const foundUid = await findUidByStripeCustomerId(customerId);
            if (foundUid) {
              uid = foundUid;
            } else {
              const customer = await stripe.customers.retrieve(customerId);
              if (!customer.deleted) {
                uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
              }
            }
          }

          if (uid) {
            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: false,
                subscriptionStatus: 'cancelled',
                subscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: 'cancelled',
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            console.log(`Subscription cancelled for user ${uid}`);
          } else {
            console.error('Could not find Firebase UID for subscription', subscription.id);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          let uid: string | undefined = subscription.metadata?.firebaseUID ||
            subscription.metadata?.firebase_uid;

          if (!uid && subscription.customer) {
            const customerId = typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;
            const foundUid = await findUidByStripeCustomerId(customerId);
            if (foundUid) {
              uid = foundUid;
            } else {
              const customer = await stripe.customers.retrieve(customerId);
              if (!customer.deleted) {
                uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
              }
            }
          }

          if (uid) {
            const isActive = isActiveSubscriptionStatus(subscription.status);
            const periodEnd = new Date(subscription.current_period_end * 1000);
            const planKey = subscription.metadata?.planKey || 'explorer';
            const tier = subscription.metadata?.tier || planKey;
            const seatCount = parseInt(subscription.metadata?.seatCount || '1', 10);

            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: isActive,
                subscriptionStatus: subscription.status,
                subscriptionTier: tier,
                seatCount,
                subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: subscription.status,
                plan: planKey,
                tier,
                seatCount,
                period_end: admin.firestore.Timestamp.fromDate(periodEnd),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            console.log(`Subscription updated for user ${uid}: ${subscription.status}, tier: ${tier}`);
          } else {
            console.error('Could not find Firebase UID for subscription update', subscription.id);
          }
          break;
        }
      }
    } catch (err: any) {
      console.error('Error processing webhook event:', err);
      res.status(500).send(`Webhook processing error: ${err.message}`);
      return;
    }

    res.json({ received: true });
  }
);

export const validateIdMappingV2 = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const uid = request.data?.uid || request.auth.uid;
    const userRef = admin.firestore().doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const stripeCustomerId = userSnap.get('stripeCustomerId') as string | undefined;
    const { stripe } = getStripe();
    const results: any = {
      uid,
      hasStripeCustomerId: !!stripeCustomerId,
      mappingValid: false,
    };

    if (stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (!customer.deleted) {
          results.stripeCustomerId = stripeCustomerId;
          results.stripeMetadataUID = customer.metadata?.firebaseUID;
          results.mappingValid = customer.metadata?.firebaseUID === uid;
        } else {
          results.error = 'Stripe customer was deleted';
        }
      } catch (err: any) {
        results.error = err.message;
      }
    }

    const subSnap = await admin.firestore().doc(`users/${uid}/subscriptions/current`).get();
    if (subSnap.exists) {
      results.subscription = subSnap.data();
    }

    return results;
  }
);

export const backfillStripeCustomersV2 = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET], timeoutSeconds: 540 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const { stripe, secret } = getStripe();
    if (!secret) {
      throw new HttpsError('failed-precondition', 'Stripe not configured');
    }

    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', null)
      .limit(100)
      .get();

    const results: any[] = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;

      try {
        const customer = await stripe.customers.create({
          email: userData.email || undefined,
          metadata: {
            firebaseUID: uid,
            firebase_uid: uid,
          },
          name: userData.displayName || undefined,
        });

        await admin.firestore().doc(`users/${uid}`).set(
          {
            stripeCustomerId: customer.id,
            stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        results.push({ uid, status: 'created', customerId: customer.id });
      } catch (err: any) {
        results.push({ uid, status: 'error', error: err.message });
      }
    }

    return { processed: results.length, results };
  }
);
