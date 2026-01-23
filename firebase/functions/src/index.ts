import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

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

// Helper function to ensure strict ID mapping between Firebase and Stripe
async function ensureStrictMapping(uid: string, email?: string): Promise<string> {
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();
  let customerId = userSnap.get('stripeCustomerId') as string | undefined;
  const { stripe } = getStripe();

  // If customer ID exists, verify it's valid in Stripe
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        // Customer was deleted, create new one
        customerId = undefined;
      } else {
        // Ensure metadata is set
        if (!customer.metadata?.firebaseUID) {
          await stripe.customers.update(customerId, {
            metadata: { firebaseUID: uid },
          });
        }
        return customerId;
      }
    } catch (err) {
      // Customer doesn't exist, create new one
      customerId = undefined;
    }
  }

  // Create new Stripe customer with strict mapping
  const customer = await stripe.customers.create({
    email: email || userSnap.get('email'),
    metadata: { firebaseUID: uid },
  });
  customerId = customer.id;

  // Store in Firebase with timestamp
  await userRef.set({
    stripeCustomerId: customerId,
    stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return customerId;
}

// Helper function to find Firebase UID from Stripe customer ID
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

// Create a Checkout session for premium upgrade
export const createCheckoutSession = functions
  .runWith({ secrets: [STRIPE_SECRET] })
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  const { stripe, secret } = getStripe();
  if (!secret) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe not configured');
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email;
  const priceId = data?.priceId as string;
  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing priceId');
  }

  // Ensure strict mapping between Firebase and Stripe
  const customerId = await ensureStrictMapping(uid, email);

  // Production URLs for success and cancel
  const baseUrl = 'https://aiintegrationcourse.com';
  const successUrl = data?.successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = data?.cancelUrl || `${baseUrl}/pricing`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      firebaseUID: uid,
    },
    subscription_data: {
      metadata: {
        firebaseUID: uid,
      },
    },
  });

  return { id: session.id, url: session.url };
});

// Stripe webhook to set premium flag with improved reliability
export const stripeWebhook = functions
  .runWith({ secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] })
  .https.onRequest(async (req, res) => {
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
        let uid = session.metadata?.firebaseUID;

        // Fallback: if metadata missing, look up by customer ID
        if (!uid && session.customer) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) uid = foundUid;

          // If still not found, try to get from customer metadata
          if (!uid) {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID;
            }
          }
        }

        if (uid) {
          await admin.firestore().doc(`users/${uid}`).set({
            premium: true,
            subscriptionStatus: 'active',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`Premium activated for user ${uid}`);
        } else {
          console.error('Could not find Firebase UID for checkout session', session.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        let uid = invoice.subscription_details?.metadata?.firebaseUID;

        // Fallback: look up by customer ID
        if (!uid && invoice.customer) {
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) uid = foundUid;

          // If still not found, try customer metadata
          if (!uid) {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID;
            }
          }
        }

        if (uid) {
          await admin.firestore().doc(`users/${uid}`).set({
            premium: true,
            subscriptionStatus: 'active',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`Premium renewed for user ${uid}`);
        } else {
          console.error('Could not find Firebase UID for invoice', invoice.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        let uid: string | undefined = subscription.metadata?.firebaseUID;

        // Fallback: look up by customer ID
        if (!uid && subscription.customer) {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) {
            uid = foundUid;
          } else {
            // If still not found, try customer metadata
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID;
            }
          }
        }

        if (uid) {
          await admin.firestore().doc(`users/${uid}`).set({
            premium: false,
            subscriptionStatus: 'cancelled',
            subscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`Premium cancelled for user ${uid}`);
        } else {
          console.error('Could not find Firebase UID for subscription', subscription.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        let uid: string | undefined = subscription.metadata?.firebaseUID;

        // Fallback: look up by customer ID
        if (!uid && subscription.customer) {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) {
            uid = foundUid;
          } else {
            // If still not found, try customer metadata
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID;
            }
          }
        }

        if (uid) {
          const status = subscription.status === 'active' || subscription.status === 'trialing';
          await admin.firestore().doc(`users/${uid}`).set({
            premium: status,
            subscriptionStatus: subscription.status,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
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
});

// Admin function to validate ID mapping integrity
export const validateIdMapping = functions
  .runWith({ secrets: [STRIPE_SECRET] })
  .https.onCall(async (data, context) => {
  // Only allow admin users to call this
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const uid = data?.uid || context.auth.uid;
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
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

  return results;
});
