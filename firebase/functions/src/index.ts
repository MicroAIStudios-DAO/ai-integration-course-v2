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
  const priceId = data?.priceId as string;
  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing priceId');
  }

  // Ensure Stripe customer associated with user
  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();
  let customerId = userSnap.get('stripeCustomerId') as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { firebaseUID: uid },
    });
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: data?.successUrl || 'https://example.com/success',
    cancel_url: data?.cancelUrl || 'https://example.com/cancel',
    metadata: { uid },
  });

  return { id: session.id, url: session.url };
});

// Stripe webhook to set premium flag
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

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded': {
      const object: any = (event as any).data.object;
      const uid = object?.metadata?.uid;
      if (uid) {
        await admin.firestore().doc(`users/${uid}`).set({ premium: true }, { merge: true });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = (subscription.metadata as any)?.uid;
      if (uid) {
        await admin.firestore().doc(`users/${uid}`).set({ premium: false }, { merge: true });
      }
      break;
    }
  }

  res.json({ received: true });
});
