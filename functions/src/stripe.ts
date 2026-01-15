import admin from 'firebase-admin';
import Stripe from 'stripe';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
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

export const createCheckoutSession = onCall(
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
    const priceId = request.data?.priceId as string;
    if (!priceId) {
      throw new HttpsError('invalid-argument', 'Missing priceId');
    }

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

    const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || 3);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
      },
      success_url: request.data?.successUrl || 'https://example.com/success',
      cancel_url: request.data?.cancelUrl || 'https://example.com/cancel',
      metadata: { uid },
    });

    return { id: session.id, url: session.url };
  }
);

export const stripeWebhook = onRequest(
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
  }
);
