import admin from 'firebase-admin';
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
let stripe: Stripe | null = null;

function getStripe() {
  const secret = process.env.STRIPE_SECRET || STRIPE_SECRET.value();
  if (!stripe) {
    stripe = new Stripe(secret || '', { apiVersion: '2024-06-20' });
  }
  return { stripe, secret };
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

    const { stripe, secret } = getStripe();
    if (!secret) {
      console.error('Stripe not configured, skipping customer creation');
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

      await admin.firestore().doc(`users/${uid}`).set(
        {
          email: user.email || user.emailAddress || null,
          displayName: user.displayName || user.name || null,
          stripeCustomerId: customer.id,
          stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          premium: false,
          subscriptionStatus: 'none',
        },
        { merge: true }
      );

      console.log(`Created Stripe customer ${customer.id} for Firebase user ${uid}`);
    } catch (err: any) {
      console.error(`Failed to create Stripe customer for user ${uid}:`, err.message);
      await admin.firestore().doc(`users/${uid}`).set(
        {
          email: user.email || user.emailAddress || null,
          displayName: user.displayName || user.name || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          premium: false,
          subscriptionStatus: 'none',
          stripeError: err.message,
        },
        { merge: true }
      );
    }
  }
);

export const createCheckoutSessionV2 = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET] },
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
    const priceId = request.data?.priceId as string;
    if (!priceId) {
      throw new HttpsError('invalid-argument', 'Missing priceId');
    }

    const customerId = await ensureStrictMapping(uid, email);

    const baseUrl = 'https://aiintegrationcourse.com';
    const successUrl = request.data?.successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = request.data?.cancelUrl || `${baseUrl}/pricing`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: uid,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: uid,
        firebase_uid: uid,
      },
      subscription_data: {
        metadata: {
          firebaseUID: uid,
          firebase_uid: uid,
        },
      },
    });

    return { id: session.id, url: session.url };
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
            let planId = 'pro';
            if (session.subscription) {
              const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
              const subscription = await stripe.subscriptions.retrieve(subId);
              periodEnd = new Date(subscription.current_period_end * 1000);
              planId = subscription.items.data[0]?.price?.lookup_key || 'pro';
            }

            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: true,
                subscriptionStatus: 'active',
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: 'active',
                plan: planId,
                period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer,
                checkoutSessionId: session.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            console.log(`Premium activated for user ${uid} with plan ${planId}`);
          } else {
            console.error('Could not find Firebase UID for checkout session', session.id);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          let uid = invoice.subscription_details?.metadata?.firebaseUID ||
            invoice.subscription_details?.metadata?.firebase_uid;

          if (!uid && invoice.customer) {
            const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
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
            let planId = 'pro';
            if (invoice.subscription) {
              const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
              const subscription = await stripe.subscriptions.retrieve(subId);
              periodEnd = new Date(subscription.current_period_end * 1000);
              planId = subscription.items.data[0]?.price?.lookup_key || 'pro';
            }

            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: true,
                subscriptionStatus: 'active',
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: 'active',
                plan: planId,
                period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            console.log(`Premium renewed for user ${uid}`);
          } else {
            console.error('Could not find Firebase UID for invoice', invoice.id);
          }
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

            console.log(`Premium cancelled for user ${uid}`);
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
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            const periodEnd = new Date(subscription.current_period_end * 1000);
            const planId = subscription.items.data[0]?.price?.lookup_key || 'pro';

            await admin.firestore().doc(`users/${uid}`).set(
              {
                premium: isActive,
                subscriptionStatus: subscription.status,
                subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            await admin.firestore().doc(`users/${uid}/subscriptions/current`).set(
              {
                status: subscription.status,
                plan: planId,
                period_end: admin.firestore.Timestamp.fromDate(periodEnd),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            console.log(`Subscription updated for user ${uid}: ${subscription.status}`);
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
