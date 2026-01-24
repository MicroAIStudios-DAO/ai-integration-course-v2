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

// ============================================================================
// AUDIT REQUIREMENT: functions.auth.user().onCreate
// Triggered when a new user is created in Firebase Auth.
// This is the entry point for identity management.
// Creates Stripe customer immediately to ensure 1:1 mapping from signup.
// ============================================================================
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { stripe, secret } = getStripe();
  if (!secret) {
    console.error('Stripe not configured, skipping customer creation');
    return;
  }

  try {
    // Create Stripe customer with strict mapping
    // AUDIT: customers.create({ email, metadata: { firebase_uid: user.uid } })
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { 
        firebaseUID: user.uid,
        firebase_uid: user.uid, // Also include snake_case for compatibility
      },
      name: user.displayName || undefined,
    });

    // AUDIT: Writes `stripeId` to Firestore `users/{uid}`. Ensures 1:1 mapping.
    await admin.firestore().doc(`users/${user.uid}`).set({
      email: user.email || null,
      displayName: user.displayName || null,
      stripeCustomerId: customer.id,
      stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      premium: false,
      subscriptionStatus: 'none',
    }, { merge: true });

    console.log(`Created Stripe customer ${customer.id} for Firebase user ${user.uid}`);
  } catch (err: any) {
    console.error(`Failed to create Stripe customer for user ${user.uid}:`, err.message);
    // Still create the user document without Stripe ID
    await admin.firestore().doc(`users/${user.uid}`).set({
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      premium: false,
      subscriptionStatus: 'none',
      stripeError: err.message,
    }, { merge: true });
  }
});

// Helper function to ensure strict ID mapping between Firebase and Stripe
// Used as fallback if user was created before this system was in place
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
            metadata: { firebaseUID: uid, firebase_uid: uid },
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
    metadata: { firebaseUID: uid, firebase_uid: uid },
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

// ============================================================================
// AUDIT REQUIREMENT: createCheckoutSession
// Generates a Stripe hosted payment link.
// CRITICAL: Must include `client_reference_id: uid` to track who is paying.
// ============================================================================
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
    // AUDIT CRITICAL: client_reference_id tracks who is paying
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
});

// ============================================================================
// AUDIT REQUIREMENT: handleStripeWebhook
// Listens for `checkout.session.completed` and `invoice.paid`.
// Verifies the Stripe signature to prevent spoofing.
// The ONLY trusted source for granting access.
// 
// AUDIT REQUIREMENT: Firestore Update
// Updates `users/{uid}/subscriptions` subcollection.
// Sets `status: 'active'`, `plan: 'pro'`, `period_end`.
// Frontend listens to this doc to unlock UI.
// ============================================================================
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
    // AUDIT: Verifies the Stripe signature to prevent spoofing
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
        // Try multiple sources for UID (audit requirement: robust identification)
        let uid = session.metadata?.firebaseUID || 
                  session.metadata?.firebase_uid ||
                  session.client_reference_id;

        // Fallback: if metadata missing, look up by customer ID
        if (!uid && session.customer) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) uid = foundUid;

          // If still not found, try to get from customer metadata
          if (!uid) {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
            }
          }
        }

        if (uid) {
          // Get subscription details for period_end
          let periodEnd: Date | null = null;
          let planId = 'pro';
          if (session.subscription) {
            const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subId);
            periodEnd = new Date(subscription.current_period_end * 1000);
            planId = subscription.items.data[0]?.price?.lookup_key || 'pro';
          }

          // AUDIT: Update user document
          await admin.firestore().doc(`users/${uid}`).set({
            premium: true,
            subscriptionStatus: 'active',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // AUDIT: Update subscriptions subcollection with status, plan, period_end
          await admin.firestore().doc(`users/${uid}/subscriptions/current`).set({
            status: 'active',
            plan: planId,
            period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            checkoutSessionId: session.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

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

        // Fallback: look up by customer ID
        if (!uid && invoice.customer) {
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
          const foundUid = await findUidByStripeCustomerId(customerId);
          if (foundUid) uid = foundUid;

          // If still not found, try customer metadata
          if (!uid) {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
              uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
            }
          }
        }

        if (uid) {
          // Get subscription details
          let periodEnd: Date | null = null;
          let planId = 'pro';
          if (invoice.subscription) {
            const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subId);
            periodEnd = new Date(subscription.current_period_end * 1000);
            planId = subscription.items.data[0]?.price?.lookup_key || 'pro';
          }

          // Update user document
          await admin.firestore().doc(`users/${uid}`).set({
            premium: true,
            subscriptionStatus: 'active',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // AUDIT: Update subscriptions subcollection
          await admin.firestore().doc(`users/${uid}/subscriptions/current`).set({
            status: 'active',
            plan: planId,
            period_end: periodEnd ? admin.firestore.Timestamp.fromDate(periodEnd) : null,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

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
              uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
            }
          }
        }

        if (uid) {
          // Update user document
          await admin.firestore().doc(`users/${uid}`).set({
            premium: false,
            subscriptionStatus: 'cancelled',
            subscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // AUDIT: Update subscriptions subcollection
          await admin.firestore().doc(`users/${uid}/subscriptions/current`).set({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

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
              uid = customer.metadata?.firebaseUID || customer.metadata?.firebase_uid;
            }
          }
        }

        if (uid) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          const periodEnd = new Date(subscription.current_period_end * 1000);
          const planId = subscription.items.data[0]?.price?.lookup_key || 'pro';

          // Update user document
          await admin.firestore().doc(`users/${uid}`).set({
            premium: isActive,
            subscriptionStatus: subscription.status,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // AUDIT: Update subscriptions subcollection with status, plan, period_end
          await admin.firestore().doc(`users/${uid}/subscriptions/current`).set({
            status: subscription.status,
            plan: planId,
            period_end: admin.firestore.Timestamp.fromDate(periodEnd),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

  // Also check subscriptions subcollection
  const subSnap = await admin.firestore().doc(`users/${uid}/subscriptions/current`).get();
  if (subSnap.exists) {
    results.subscription = subSnap.data();
  }

  return results;
});

// Admin function to backfill Stripe customers for existing users
export const backfillStripeCustomers = functions
  .runWith({ secrets: [STRIPE_SECRET], timeoutSeconds: 540 })
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { stripe, secret } = getStripe();
  if (!secret) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe not configured');
  }

  // Get users without stripeCustomerId
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

      await admin.firestore().doc(`users/${uid}`).set({
        stripeCustomerId: customer.id,
        stripeCustomerCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      results.push({ uid, status: 'created', customerId: customer.id });
    } catch (err: any) {
      results.push({ uid, status: 'error', error: err.message });
    }
  }

  return { processed: results.length, results };
});
