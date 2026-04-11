import admin from 'firebase-admin';
import crypto from 'crypto';
import Stripe from 'stripe';
import type { CloudEvent } from 'firebase-functions/v2/core';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onCustomEventPublished } from 'firebase-functions/v2/eventarc';
import { defineSecret } from 'firebase-functions/params';
import {
  queuePaidWelcomeEmail,
  queuePlaybookDelivery,
  queueTrialStartedEmail,
} from './emailLifecycle';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const STRIPE_PRICE_EXPLORER_MONTHLY = defineSecret('STRIPE_PRICE_EXPLORER_MONTHLY');
const STRIPE_PRICE_PRO_ANNUAL = defineSecret('STRIPE_PRICE_PRO_ANNUAL');
const STRIPE_PRICE_CORPORATE_MONTHLY = defineSecret('STRIPE_PRICE_CORPORATE_MONTHLY');
const CHECKOUT_SESSIONS_COLLECTION = 'checkout_sessions';

let stripe: Stripe | null = null;

type CheckoutPlanKey = 'explorer' | 'pro' | 'corporate';

type CheckoutPlanDefinition = {
  stripePriceId: string;
  tier: CheckoutPlanKey;
  billingInterval: 'month' | 'year';
  trialDays: number;
  seatCount: number;
  displayPrice: number;
  displayMonthlyEquivalent?: number;
  anchorMonthlyPrice?: number;
  name: string;
  analyticsValue: number;
};

type CheckoutSessionSnapshot = {
  sessionId: string;
  email: string;
  displayName: string | null;
  planKey: CheckoutPlanKey;
  planName: string;
  status: string;
  tier: string;
  billingInterval: 'month' | 'year';
  seatCount: number;
  analyticsValue: number;
  customerId: string | null;
  subscriptionId: string | null;
  attachedUid: string | null;
  premiumUnlocked: boolean;
  isTrialing: boolean;
  periodEnd: Date | null;
};

const db = admin.firestore();

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

const getPlanConfig = (
  planKey: CheckoutPlanKey,
  options?: { requireStripePrice?: boolean }
): CheckoutPlanDefinition => {
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
      displayPrice: 149.0,
      name: 'Team AI Standard',
      analyticsValue: 149.0,
    },
  };

  const config = planConfig[planKey];
  if (!config) {
    throw new HttpsError('invalid-argument', `Invalid plan key: ${planKey}`);
  }
  if (options?.requireStripePrice && !config.stripePriceId) {
    throw new HttpsError('failed-precondition', `Stripe price not configured for plan: ${planKey}`);
  }
  return config;
};

const safePlanKey = (value: unknown): CheckoutPlanKey => {
  if (value === 'explorer' || value === 'pro' || value === 'corporate') {
    return value;
  }
  return 'explorer';
};

const resolvePlanKey = (payload: Record<string, any> | undefined): CheckoutPlanKey => {
  const requested = payload?.planKey;
  if (requested === 'explorer' || requested === 'pro' || requested === 'corporate') {
    return requested;
  }
  throw new HttpsError('invalid-argument', 'A valid plan selection is required to start checkout.');
};

const isPremiumContentUnlocked = (status: unknown): boolean => status === 'active';

const _isTrialPlan = (planKey: string | null | undefined): boolean => planKey === 'explorer';
const _isCorporatePlan = (planKey: string | null | undefined): boolean => planKey === 'corporate';

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

const normalizeEmail = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const toTimestamp = (value: Date | null): FirebaseFirestore.Timestamp | null => {
  if (!value) return null;
  return admin.firestore.Timestamp.fromDate(value);
};

const deriveMetadataUid = (metadata?: Stripe.Metadata | null): string | null => {
  const uid = metadata?.firebaseUID || metadata?.firebase_uid;
  if (typeof uid !== 'string') return null;
  const cleanUid = uid.trim();
  return cleanUid || null;
};

const getStripeCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null => {
  if (!customer) return null;
  if (typeof customer === 'string') return customer;
  return customer.id || null;
};

const getStripeSubscriptionId = (subscription: string | Stripe.Subscription | null | undefined): string | null => {
  if (!subscription) return null;
  if (typeof subscription === 'string') return subscription;
  return subscription.id || null;
};

async function findUserRecordByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  try {
    return await admin.auth().getUserByEmail(normalizedEmail);
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

async function ensureStrictMapping(uid: string, email?: string): Promise<string> {
  const userRef = db.doc(`users/${uid}`);
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
    email: normalizeEmail(email) || normalizeEmail(userSnap.get('email')) || undefined,
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
  const usersSnapshot = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    return usersSnapshot.docs[0].id;
  }
  return null;
}

async function findCheckoutSessionDocByField(
  field: 'customerId' | 'subscriptionId',
  value: string | null | undefined
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  if (!value) {
    return null;
  }

  const snapshot = await db
    .collection(CHECKOUT_SESSIONS_COLLECTION)
    .where(field, '==', value)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0];
}

async function getExpandedCustomer(customerId: string | null): Promise<Stripe.Customer | null> {
  if (!customerId) {
    return null;
  }

  const { stripe } = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  return customer.deleted ? null : customer;
}

async function getExpandedSubscription(subscriptionId: string | null): Promise<Stripe.Subscription | null> {
  if (!subscriptionId) {
    return null;
  }

  const { stripe } = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

async function syncCheckoutSessionRecord(
  source: string | Stripe.Checkout.Session
): Promise<CheckoutSessionSnapshot> {
  const { stripe } = getStripe();
  const session = typeof source === 'string'
    ? await stripe.checkout.sessions.retrieve(source, { expand: ['customer', 'subscription'] })
    : source;

  const customerId = getStripeCustomerId(session.customer);
  const subscriptionId = getStripeSubscriptionId(session.subscription);
  const customer = typeof session.customer === 'string'
    ? await getExpandedCustomer(customerId)
    : session.customer && !(session.customer as Stripe.DeletedCustomer).deleted
      ? session.customer as Stripe.Customer
      : null;
  const subscription = typeof session.subscription === 'string'
    ? await getExpandedSubscription(subscriptionId)
    : session.subscription || null;

  const recordRef = db.collection(CHECKOUT_SESSIONS_COLLECTION).doc(session.id);
  const existingRecordSnap = await recordRef.get();
  const existingAttachedUid = (existingRecordSnap.get('attachedUid') as string | undefined) || null;

  const planKey = safePlanKey(subscription?.metadata?.planKey || session.metadata?.planKey);
  const plan = getPlanConfig(planKey);
  const tier = subscription?.metadata?.tier || session.metadata?.tier || plan.tier;
  const billingInterval =
    (subscription?.metadata?.billingInterval as 'month' | 'year' | undefined) ||
    (session.metadata?.billingInterval as 'month' | 'year' | undefined) ||
    plan.billingInterval;
  const seatCount = Number.parseInt(
    subscription?.metadata?.seatCount || session.metadata?.seatCount || String(plan.seatCount),
    10
  ) || plan.seatCount;
  const status = subscription?.status || session.status || 'open';
  const isTrialing = status === 'trialing';
  const premiumUnlocked = isPremiumContentUnlocked(status);
  const periodEnd = subscription ? new Date(subscription.current_period_end * 1000) : null;
  const email = normalizeEmail(session.customer_details?.email || customer?.email || existingRecordSnap.get('email'));
  const displayName =
    session.customer_details?.name || customer?.name || (existingRecordSnap.get('displayName') as string | undefined) || null;
  const attachedUid =
    existingAttachedUid ||
    deriveMetadataUid(subscription?.metadata || null) ||
    deriveMetadataUid(customer?.metadata || null) ||
    deriveMetadataUid(session.metadata || null) ||
    (customerId ? await findUidByStripeCustomerId(customerId) : null);

  const snapshot: CheckoutSessionSnapshot = {
    sessionId: session.id,
    email,
    displayName,
    planKey,
    planName: plan.name,
    status,
    tier,
    billingInterval,
    seatCount,
    analyticsValue: plan.analyticsValue,
    customerId,
    subscriptionId,
    attachedUid,
    premiumUnlocked,
    isTrialing,
    periodEnd,
  };

  await recordRef.set(
    {
      ...snapshot,
      periodEnd: toTimestamp(periodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return snapshot;
}

async function persistCheckoutStateWithoutUid(snapshot: CheckoutSessionSnapshot): Promise<void> {
  await db.collection(CHECKOUT_SESSIONS_COLLECTION).doc(snapshot.sessionId).set(
    {
      ...snapshot,
      periodEnd: toTimestamp(snapshot.periodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function persistSubscriptionForUser(
  uid: string,
  snapshot: CheckoutSessionSnapshot,
  options?: { email?: string | null; displayName?: string | null; markCancelled?: boolean }
): Promise<void> {
  const userRef = db.doc(`users/${uid}`);
  const subRef = db.doc(`users/${uid}/subscriptions/current`);
  const userPayload: Record<string, unknown> = {
    subscriptionStatus: options?.markCancelled ? 'cancelled' : snapshot.status,
    subscriptionTier: snapshot.tier,
    billingInterval: snapshot.billingInterval,
    seatCount: snapshot.seatCount,
    subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    pendingCheckoutPlanKey: admin.firestore.FieldValue.delete(),
    pendingCheckoutTier: admin.firestore.FieldValue.delete(),
  };

  if (snapshot.customerId) {
    userPayload.stripeCustomerId = snapshot.customerId;
    userPayload.stripeCustomerCreatedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (options?.email) {
    userPayload.email = normalizeEmail(options.email);
  }

  if (options?.displayName) {
    userPayload.displayName = options.displayName;
  }

  if (options?.markCancelled) {
    userPayload.premium = false;
    userPayload.trialEndsAt = null;
    userPayload.subscriptionEndsAt = null;
    userPayload.subscriptionCancelledAt = admin.firestore.FieldValue.serverTimestamp();
  } else {
    userPayload.premium = snapshot.premiumUnlocked;
    userPayload.lastPaymentAt = snapshot.isTrialing ? null : admin.firestore.FieldValue.serverTimestamp();
    userPayload.trialStartedAt = snapshot.isTrialing ? admin.firestore.FieldValue.serverTimestamp() : null;
    userPayload.trialEndsAt = snapshot.isTrialing ? toTimestamp(snapshot.periodEnd) : null;
    userPayload.subscriptionEndsAt = snapshot.isTrialing ? null : toTimestamp(snapshot.periodEnd);
  }

  await userRef.set(userPayload, { merge: true });

  const subscriptionPayload: Record<string, unknown> = {
    status: options?.markCancelled ? 'cancelled' : snapshot.status,
    plan: snapshot.planKey,
    tier: snapshot.tier,
    billingInterval: snapshot.billingInterval,
    seatCount: snapshot.seatCount,
    period_end: toTimestamp(snapshot.periodEnd),
    stripeSubscriptionId: snapshot.subscriptionId,
    stripeCustomerId: snapshot.customerId,
    checkoutSessionId: snapshot.sessionId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (options?.markCancelled) {
    subscriptionPayload.cancelledAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await subRef.set(subscriptionPayload, { merge: true });
}

async function queueLifecycleEmailsOnce(
  sessionId: string,
  uid: string,
  snapshot: CheckoutSessionSnapshot,
  email: string,
  displayName?: string | null
): Promise<void> {
  const sessionRef = db.collection(CHECKOUT_SESSIONS_COLLECTION).doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (sessionSnap.get('lifecycleEmailsQueuedAt')) {
    return;
  }

  if (snapshot.isTrialing) {
    await queueTrialStartedEmail({
      uid,
      email,
      displayName,
      subscriptionTier: snapshot.tier,
      trialStartedAt: admin.firestore.Timestamp.now(),
      trialEndsAt: toTimestamp(snapshot.periodEnd),
    });
  } else {
    await queuePaidWelcomeEmail({
      uid,
      email,
      displayName,
      subscriptionTier: snapshot.tier,
    });
  }

  await queuePlaybookDelivery({
    uid,
    email,
    displayName,
  });

  await sessionRef.set(
    {
      lifecycleEmailsQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function attachCheckoutStateToUid(
  uid: string,
  snapshot: CheckoutSessionSnapshot,
  options?: { email?: string | null; displayName?: string | null; queueEmails?: boolean }
): Promise<void> {
  const email = normalizeEmail(options?.email || snapshot.email);
  const displayName = options?.displayName || snapshot.displayName || null;

  await persistSubscriptionForUser(uid, snapshot, { email, displayName });

  await db.collection(CHECKOUT_SESSIONS_COLLECTION).doc(snapshot.sessionId).set(
    {
      ...snapshot,
      attachedUid: uid,
      attachedAt: admin.firestore.FieldValue.serverTimestamp(),
      email,
      displayName,
      periodEnd: toTimestamp(snapshot.periodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (options?.queueEmails && email) {
    await queueLifecycleEmailsOnce(snapshot.sessionId, uid, snapshot, email, displayName);
  }
}

async function updatePendingCheckoutByStripeIds(params: {
  customerId?: string | null;
  subscriptionId?: string | null;
  status: string;
  premiumUnlocked: boolean;
  periodEnd?: Date | null;
  planKey?: CheckoutPlanKey;
  tier?: string;
  billingInterval?: 'month' | 'year';
  seatCount?: number;
}): Promise<void> {
  const docSnap =
    (params.subscriptionId ? await findCheckoutSessionDocByField('subscriptionId', params.subscriptionId) : null) ||
    (params.customerId ? await findCheckoutSessionDocByField('customerId', params.customerId) : null);

  if (!docSnap) {
    return;
  }

  const existingPlanKey = safePlanKey(params.planKey || docSnap.get('planKey'));
  const plan = getPlanConfig(existingPlanKey);

  await docSnap.ref.set(
    {
      status: params.status,
      premiumUnlocked: params.premiumUnlocked,
      isTrialing: params.status === 'trialing',
      periodEnd: toTimestamp(params.periodEnd || null),
      planKey: existingPlanKey,
      planName: plan.name,
      tier: params.tier || docSnap.get('tier') || existingPlanKey,
      billingInterval: params.billingInterval || docSnap.get('billingInterval') || plan.billingInterval,
      seatCount: params.seatCount || docSnap.get('seatCount') || plan.seatCount,
      customerId: params.customerId || docSnap.get('customerId') || null,
      subscriptionId: params.subscriptionId || docSnap.get('subscriptionId') || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  let uid = deriveMetadataUid(invoice.subscription_details?.metadata || null);
  const customerId = getStripeCustomerId(invoice.customer as string | Stripe.Customer | null | undefined);

  if (!uid && customerId) {
    uid = await findUidByStripeCustomerId(customerId);

    if (!uid) {
      const customer = await getExpandedCustomer(customerId);
      uid = deriveMetadataUid(customer?.metadata || null);
    }
  }

  const subscriptionId = getStripeSubscriptionId(invoice.subscription as string | Stripe.Subscription | null | undefined);
  const subscription = subscriptionId ? await getExpandedSubscription(subscriptionId) : null;
  const planKey = safePlanKey(subscription?.metadata?.planKey || invoice.subscription_details?.metadata?.planKey);
  const plan = getPlanConfig(planKey);
  const tier = subscription?.metadata?.tier || invoice.subscription_details?.metadata?.tier || plan.tier;
  const seatCount = Number.parseInt(subscription?.metadata?.seatCount || '1', 10) || 1;
  const periodEnd = subscription ? new Date(subscription.current_period_end * 1000) : null;
  const status = subscription?.status || 'active';

  const snapshot: CheckoutSessionSnapshot = {
    sessionId: subscriptionId || invoice.id,
    email: normalizeEmail(invoice.customer_email),
    displayName: null,
    planKey,
    planName: plan.name,
    status,
    tier,
    billingInterval: plan.billingInterval,
    seatCount,
    analyticsValue: plan.analyticsValue,
    customerId,
    subscriptionId,
    attachedUid: uid,
    premiumUnlocked: true,
    isTrialing: false,
    periodEnd,
  };

  if (!uid) {
    await updatePendingCheckoutByStripeIds({
      customerId,
      subscriptionId,
      status,
      premiumUnlocked: true,
      periodEnd,
      planKey,
      tier,
      billingInterval: plan.billingInterval,
      seatCount,
    });
    console.error('Could not find Firebase UID for invoice', invoice.id);
    return;
  }

  await persistSubscriptionForUser(uid, snapshot, { email: invoice.customer_email || null, displayName: null });

  const sessionDoc =
    (subscriptionId ? await findCheckoutSessionDocByField('subscriptionId', subscriptionId) : null) ||
    (customerId ? await findCheckoutSessionDocByField('customerId', customerId) : null);

  if (sessionDoc) {
    await sessionDoc.ref.set(
      {
        attachedUid: uid,
        status,
        premiumUnlocked: true,
        isTrialing: false,
        periodEnd: toTimestamp(periodEnd),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await queueLifecycleEmailsOnce(
      sessionDoc.id,
      uid,
      { ...snapshot, sessionId: sessionDoc.id },
      normalizeEmail(invoice.customer_email),
      null
    );
  } else {
    await queuePaidWelcomeEmail({
      uid,
      email: invoice.customer_email || '',
      displayName: null,
      subscriptionTier: tier,
    });
  }

  console.log(`Premium renewed for user ${uid}`);
}

export const onUserCreateV2 = onCustomEventPublished(
  {
    region: 'us-central1',
    eventType: 'google.firebase.auth.user.v1.created',
  },
  async (event: CloudEvent<any>) => {
    const user = (event.data as any) || {};
    const uid = user.uid || user.userId || user.user_id;
    if (!uid) {
      console.error('Auth create event missing uid', event);
      return;
    }

    const userRef = db.doc(`users/${uid}`);
    const existingUser = await userRef.get();
    const apiKey = existingUser.get('apiKey') || generateUserApiKey();

    await userRef.set(
      {
        email: normalizeEmail(user.email || user.emailAddress) || null,
        displayName: user.displayName || user.name || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        premium: existingUser.get('premium') || false,
        subscriptionStatus: existingUser.get('subscriptionStatus') || 'none',
        apiKey,
      },
      { merge: true }
    );
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
    const { stripe, secret } = getStripe();
    if (!secret) {
      throw new HttpsError('failed-precondition', 'Stripe not configured');
    }

    const planKey = resolvePlanKey(request.data || {});
    const plan = getPlanConfig(planKey, { requireStripePrice: true });
    const isAuthenticatedUser = Boolean(request.auth?.uid && request.auth?.token?.email);
    const uid = isAuthenticatedUser ? request.auth!.uid : null;
    const email = isAuthenticatedUser ? normalizeEmail(request.auth?.token?.email) : '';

    const gclid = (request.data?.gclid as string | undefined) || '';
    const utmSource = (request.data?.utm_source as string | undefined) || '';
    const utmCampaign = (request.data?.utm_campaign as string | undefined) || '';
    const utmMedium = (request.data?.utm_medium as string | undefined) || '';
    const utmContent = (request.data?.utm_content as string | undefined) || '';
    const utmTerm = (request.data?.utm_term as string | undefined) || '';

    const baseUrl = 'https://aiintegrationcourse.com';
    const successUrl = request.data?.successUrl || `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`;
    const cancelUrl = request.data?.cancelUrl || `${baseUrl}/pricing`;

    const baseMetadata: Record<string, string> = {
      planKey,
      tier: plan.tier,
      billingInterval: plan.billingInterval,
      seatCount: String(plan.seatCount),
      analyticsValue: String(plan.analyticsValue),
      gclid,
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      utm_medium: utmMedium,
      utm_content: utmContent,
      utm_term: utmTerm,
    };

    if (uid) {
      baseMetadata.firebaseUID = uid;
      baseMetadata.firebase_uid = uid;
    }

    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: { ...baseMetadata },
    };

    if (plan.trialDays > 0) {
      subscriptionData.trial_period_days = plan.trialDays;
      subscriptionData.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      };
    }

    const customerId = uid ? await ensureStrictMapping(uid, email) : null;

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(uid ? { client_reference_id: uid } : {}),
      mode: 'subscription',
      payment_method_collection: 'always',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: baseMetadata,
      subscription_data: subscriptionData,
      allow_promotion_codes: true,
    });

    if (uid) {
      await db.doc(`users/${uid}`).set(
        {
          pendingCheckoutPlanKey: planKey,
          pendingCheckoutTier: plan.tier,
          checkoutStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await db.collection(CHECKOUT_SESSIONS_COLLECTION).doc(session.id).set(
      {
        sessionId: session.id,
        planKey,
        planName: plan.name,
        tier: plan.tier,
        billingInterval: plan.billingInterval,
        seatCount: plan.seatCount,
        analyticsValue: plan.analyticsValue,
        attachedUid: uid,
        customerId,
        status: 'open',
        attribution: {
          gclid,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          utm_medium: utmMedium,
          utm_content: utmContent,
          utm_term: utmTerm,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { id: session.id, planKey, url: session.url };
  }
);

export const getCheckoutSessionSummaryV2 = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
  },
  async (request) => {
    const sessionId = typeof request.data?.sessionId === 'string' ? request.data.sessionId.trim() : '';
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Checkout session ID is required.');
    }

    const snapshot = await syncCheckoutSessionRecord(sessionId);
    const existingUser = snapshot.email ? await findUserRecordByEmail(snapshot.email) : null;
    const currentUid = request.auth?.uid || null;
    const attachedUid = snapshot.attachedUid || existingUser?.uid || null;
    const requiresLogin = Boolean(existingUser && (!currentUid || existingUser.uid !== currentUid));
    const isAttachedToCurrentUser = Boolean(currentUid && attachedUid === currentUid);

    return {
      sessionId: snapshot.sessionId,
      email: snapshot.email,
      displayName: snapshot.displayName,
      planKey: snapshot.planKey,
      planName: snapshot.planName,
      status: snapshot.status,
      existingAccount: Boolean(existingUser),
      attachedUid,
      isAttachedToCurrentUser,
      requiresLogin,
    };
  }
);

export const attachCheckoutSessionToUserV2 = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const authEmail = normalizeEmail(request.auth.token?.email);
    if (!authEmail) {
      throw new HttpsError('failed-precondition', 'Your account must have an email before checkout can be attached.');
    }

    const sessionId = typeof request.data?.sessionId === 'string' ? request.data.sessionId.trim() : '';
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Checkout session ID is required.');
    }

    const requestedDisplayName = typeof request.data?.displayName === 'string'
      ? request.data.displayName.trim()
      : '';

    const snapshot = await syncCheckoutSessionRecord(sessionId);
    if (!snapshot.email) {
      throw new HttpsError('failed-precondition', 'Stripe checkout did not return an email address.');
    }

    if (normalizeEmail(snapshot.email) !== authEmail) {
      throw new HttpsError('permission-denied', 'Sign in with the same email you used in Stripe checkout.');
    }

    if (snapshot.attachedUid && snapshot.attachedUid !== request.auth.uid) {
      throw new HttpsError('already-exists', 'This checkout session is already attached to another account.');
    }

    const { stripe } = getStripe();
    if (snapshot.customerId) {
      await stripe.customers.update(snapshot.customerId, {
        email: snapshot.email,
        ...(requestedDisplayName ? { name: requestedDisplayName } : {}),
        metadata: {
          firebaseUID: request.auth.uid,
          firebase_uid: request.auth.uid,
        },
      });
    }

    if (snapshot.subscriptionId) {
      await stripe.subscriptions.update(snapshot.subscriptionId, {
        metadata: {
          firebaseUID: request.auth.uid,
          firebase_uid: request.auth.uid,
          planKey: snapshot.planKey,
          tier: snapshot.tier,
          billingInterval: snapshot.billingInterval,
          seatCount: String(snapshot.seatCount),
        },
      });
    }

    const attachedSnapshot: CheckoutSessionSnapshot = {
      ...snapshot,
      attachedUid: request.auth.uid,
      displayName: requestedDisplayName || snapshot.displayName,
    };

    await attachCheckoutStateToUid(request.auth.uid, attachedSnapshot, {
      email: snapshot.email,
      displayName: requestedDisplayName || snapshot.displayName,
      queueEmails: true,
    });

    return {
      success: true,
      attachedUid: request.auth.uid,
      planKey: snapshot.planKey,
      status: snapshot.status,
    };
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
    } catch (error: any) {
      console.error('Webhook signature verification failed', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const snapshot = await syncCheckoutSessionRecord(session);

          if (snapshot.attachedUid) {
            await attachCheckoutStateToUid(snapshot.attachedUid, snapshot, {
              email: snapshot.email,
              displayName: snapshot.displayName,
              queueEmails: true,
            });
            console.log(`Subscription recorded for user ${snapshot.attachedUid} with plan ${snapshot.planKey}, status: ${snapshot.status}`);
          } else {
            await persistCheckoutStateWithoutUid(snapshot);
            console.log(`Checkout ${snapshot.sessionId} completed without attached Firebase user yet.`);
          }
          break;
        }

        case 'invoice.payment_succeeded':
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          let uid = deriveMetadataUid(subscription.metadata || null);
          const customerId = getStripeCustomerId(subscription.customer as string | Stripe.Customer | null | undefined);

          if (!uid && customerId) {
            uid = await findUidByStripeCustomerId(customerId);
            if (!uid) {
              const customer = await getExpandedCustomer(customerId);
              uid = deriveMetadataUid(customer?.metadata || null);
            }
          }

          const planKey = safePlanKey(subscription.metadata?.planKey);
          const plan = getPlanConfig(planKey);
          const snapshot: CheckoutSessionSnapshot = {
            sessionId: subscription.id,
            email: '',
            displayName: null,
            planKey,
            planName: plan.name,
            status: 'cancelled',
            tier: subscription.metadata?.tier || plan.tier,
            billingInterval: (subscription.metadata?.billingInterval as 'month' | 'year' | undefined) || plan.billingInterval,
            seatCount: Number.parseInt(subscription.metadata?.seatCount || '1', 10) || 1,
            analyticsValue: plan.analyticsValue,
            customerId,
            subscriptionId: subscription.id,
            attachedUid: uid,
            premiumUnlocked: false,
            isTrialing: false,
            periodEnd: null,
          };

          if (uid) {
            await persistSubscriptionForUser(uid, snapshot, { markCancelled: true });
            const sessionDoc = await findCheckoutSessionDocByField('subscriptionId', subscription.id);
            if (sessionDoc) {
              await sessionDoc.ref.set(
                {
                  attachedUid: uid,
                  status: 'cancelled',
                  premiumUnlocked: false,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            }
            console.log(`Subscription cancelled for user ${uid}`);
          } else {
            await updatePendingCheckoutByStripeIds({
              customerId,
              subscriptionId: subscription.id,
              status: 'cancelled',
              premiumUnlocked: false,
              planKey,
              tier: snapshot.tier,
              billingInterval: snapshot.billingInterval,
              seatCount: snapshot.seatCount,
            });
            console.error('Could not find Firebase UID for subscription', subscription.id);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          let uid = deriveMetadataUid(subscription.metadata || null);
          const customerId = getStripeCustomerId(subscription.customer as string | Stripe.Customer | null | undefined);

          if (!uid && customerId) {
            uid = await findUidByStripeCustomerId(customerId);
            if (!uid) {
              const customer = await getExpandedCustomer(customerId);
              uid = deriveMetadataUid(customer?.metadata || null);
            }
          }

          const planKey = safePlanKey(subscription.metadata?.planKey);
          const plan = getPlanConfig(planKey);
          const periodEnd = new Date(subscription.current_period_end * 1000);
          const status = subscription.status;
          const snapshot: CheckoutSessionSnapshot = {
            sessionId: subscription.id,
            email: '',
            displayName: null,
            planKey,
            planName: plan.name,
            status,
            tier: subscription.metadata?.tier || plan.tier,
            billingInterval: (subscription.metadata?.billingInterval as 'month' | 'year' | undefined) || plan.billingInterval,
            seatCount: Number.parseInt(subscription.metadata?.seatCount || '1', 10) || 1,
            analyticsValue: plan.analyticsValue,
            customerId,
            subscriptionId: subscription.id,
            attachedUid: uid,
            premiumUnlocked: isPremiumContentUnlocked(status),
            isTrialing: status === 'trialing',
            periodEnd,
          };

          if (uid) {
            await persistSubscriptionForUser(uid, snapshot);
            const sessionDoc = await findCheckoutSessionDocByField('subscriptionId', subscription.id);
            if (sessionDoc) {
              await sessionDoc.ref.set(
                {
                  attachedUid: uid,
                  status,
                  premiumUnlocked: snapshot.premiumUnlocked,
                  isTrialing: snapshot.isTrialing,
                  periodEnd: toTimestamp(periodEnd),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            }
            console.log(`Subscription updated for user ${uid}: ${status}, tier: ${snapshot.tier}`);
          } else {
            await updatePendingCheckoutByStripeIds({
              customerId,
              subscriptionId: subscription.id,
              status,
              premiumUnlocked: snapshot.premiumUnlocked,
              periodEnd,
              planKey,
              tier: snapshot.tier,
              billingInterval: snapshot.billingInterval,
              seatCount: snapshot.seatCount,
            });
            console.error('Could not find Firebase UID for subscription update', subscription.id);
          }
          break;
        }
      }
    } catch (error: any) {
      console.error('Error processing webhook event:', error);
      res.status(500).send(`Webhook processing error: ${error.message}`);
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
    const userRef = db.doc(`users/${uid}`);
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
      } catch (error: any) {
        results.error = error.message;
      }
    }

    const subSnap = await db.doc(`users/${uid}/subscriptions/current`).get();
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

    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', null)
      .limit(100)
      .get();

    const results: any[] = [];

    for (const docSnap of usersSnapshot.docs) {
      const userData = docSnap.data();
      const uid = docSnap.id;

      try {
        const customer = await stripe.customers.create({
          email: normalizeEmail(userData.email) || undefined,
          metadata: {
            firebaseUID: uid,
            firebase_uid: uid,
          },
          name: userData.displayName || undefined,
        });

        await db.doc(`users/${uid}`).set(
          {
            stripeCustomerId: customer.id,
            stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        results.push({ uid, status: 'created', customerId: customer.id });
      } catch (error: any) {
        results.push({ uid, status: 'error', error: error.message });
      }
    }

    return { processed: results.length, results };
  }
);
