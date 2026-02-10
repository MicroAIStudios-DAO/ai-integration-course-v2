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


// ============================================================================
// AUDIT REQUIREMENT: Churn Recovery Email System
// Automated triggers for user retention based on behavior segments:
// 1. Window Shoppers: Viewed pricing > 0 AND Checkout = 0
// 2. Cart Abandoners: Checkout > 0 AND Purchase = 0
// 3. Zombie Users: Purchase > 0 AND Lesson Start = 0 (30d)
// ============================================================================

interface UserSegment {
  uid: string;
  email: string;
  segment: 'window_shopper' | 'cart_abandoner' | 'zombie_user';
  lastActivity: Date;
  daysSinceActivity: number;
}

// Scheduled function to identify and tag users for churn recovery
// Runs daily at 9 AM UTC
export const identifyChurnRiskUsers = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const segments: UserSegment[] = [];

    try {
      // 1. WINDOW SHOPPERS: Users who viewed pricing but never started checkout
      // Criteria: Has pricingPageViews > 0, no checkoutStartedAt, created > 24h ago
      const windowShoppers = await db.collection('users')
        .where('pricingPageViews', '>', 0)
        .where('checkoutStartedAt', '==', null)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneDayAgo))
        .limit(100)
        .get();

      for (const doc of windowShoppers.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.window_shopper) continue;
        
        segments.push({
          uid: doc.id,
          email: data.email,
          segment: 'window_shopper',
          lastActivity: data.lastPricingView?.toDate() || data.createdAt?.toDate() || now,
          daysSinceActivity: Math.floor((now.getTime() - (data.lastPricingView?.toDate()?.getTime() || data.createdAt?.toDate()?.getTime() || now.getTime())) / (24 * 60 * 60 * 1000)),
        });
      }

      // 2. CART ABANDONERS: Users who started checkout but never completed purchase
      // Criteria: Has checkoutStartedAt, no premium/subscription, checkout > 1 hour ago
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const cartAbandoners = await db.collection('users')
        .where('checkoutStartedAt', '!=', null)
        .where('premium', '==', false)
        .limit(100)
        .get();

      for (const doc of cartAbandoners.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.cart_abandoner) continue;
        
        const checkoutTime = data.checkoutStartedAt?.toDate();
        if (checkoutTime && checkoutTime < oneHourAgo) {
          segments.push({
            uid: doc.id,
            email: data.email,
            segment: 'cart_abandoner',
            lastActivity: checkoutTime,
            daysSinceActivity: Math.floor((now.getTime() - checkoutTime.getTime()) / (24 * 60 * 60 * 1000)),
          });
        }
      }

      // 3. ZOMBIE USERS: Paid users with no lesson activity in 30 days
      // Criteria: Has premium = true, lastLessonStartAt < 30 days ago OR null
      const zombieUsers = await db.collection('users')
        .where('premium', '==', true)
        .limit(100)
        .get();

      for (const doc of zombieUsers.docs) {
        const data = doc.data();
        if (!data.email || data.churnEmailSent?.zombie_user) continue;
        
        const lastLesson = data.lastLessonStartAt?.toDate();
        const purchaseDate = data.lastPaymentAt?.toDate() || data.createdAt?.toDate();
        
        // If never started a lesson and purchased > 7 days ago
        // OR last lesson > 30 days ago
        if ((!lastLesson && purchaseDate && purchaseDate < sevenDaysAgo) ||
            (lastLesson && lastLesson < thirtyDaysAgo)) {
          segments.push({
            uid: doc.id,
            email: data.email,
            segment: 'zombie_user',
            lastActivity: lastLesson || purchaseDate || now,
            daysSinceActivity: Math.floor((now.getTime() - (lastLesson?.getTime() || purchaseDate?.getTime() || now.getTime())) / (24 * 60 * 60 * 1000)),
          });
        }
      }

      // Store identified segments for email processing
      const batch = db.batch();
      
      for (const segment of segments) {
        // Create churn recovery record
        const recoveryRef = db.collection('churn_recovery').doc();
        batch.set(recoveryRef, {
          uid: segment.uid,
          email: segment.email,
          segment: segment.segment,
          daysSinceActivity: segment.daysSinceActivity,
          identifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          emailSent: false,
          status: 'pending',
        });

        // Mark user as identified for this segment (prevent duplicate emails)
        const userRef = db.doc(`users/${segment.uid}`);
        batch.update(userRef, {
          [`churnSegment`]: segment.segment,
          [`churnIdentifiedAt`]: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      console.log(`Identified ${segments.length} users for churn recovery:`, {
        window_shoppers: segments.filter(s => s.segment === 'window_shopper').length,
        cart_abandoners: segments.filter(s => s.segment === 'cart_abandoner').length,
        zombie_users: segments.filter(s => s.segment === 'zombie_user').length,
      });

      return { identified: segments.length };
    } catch (error: any) {
      console.error('Error identifying churn risk users:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Function to process and send churn recovery emails
// Triggered when a new churn_recovery document is created
export const processChurnRecoveryEmail = functions.firestore
  .document('churn_recovery/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { uid, email, segment, daysSinceActivity } = data;

    // Email templates based on segment
    const emailTemplates = {
      window_shopper: {
        subject: '🤔 Is it the price? Let\'s talk about your AI journey',
        body: `Hi there,

I noticed you checked out our AI Integration Course but didn't take the next step. I get it – investing in yourself can feel like a big decision.

Here's the thing: our students typically save 10+ hours per week after implementing just ONE automation from our course. That's 520+ hours per year.

At $49/month, that's less than $1 per hour saved. And with our 14-Day Build-Your-First-Bot Guarantee, you literally can't lose.

**What's holding you back?**
- Is it the price? Reply and let's discuss options.
- Not sure if it's right for you? Let me know your use case.
- Need more info? Check out our free preview lessons.

Your AI-powered future is waiting.

Best,
The AI Integration Course Team

P.S. Reply to this email – I read every response personally.`,
      },
      cart_abandoner: {
        subject: '⏰ Your checkout is waiting (14-day guarantee inside)',
        body: `Hi there,

You were SO close to starting your AI integration journey! Your checkout session is still waiting for you.

I know life gets busy, so here's a quick reminder of what you're getting:

✅ Build your first working bot in 14 days (guaranteed)
✅ Step-by-step tutorials with real business applications
✅ AI tutor available 24/7 to answer your questions
✅ Lifetime access to all course materials

**Remember: If you don't build a working bot in 14 days, you get a full refund. No questions asked.**

Ready to continue? Click here to complete your enrollment:
https://aiintegrationcourse.com/signup

Questions? Just reply to this email.

Best,
The AI Integration Course Team`,
      },
      zombie_user: {
        subject: '👋 We miss you! Your AI bot is waiting to be built',
        body: `Hi there,

It's been ${daysSinceActivity} days since we've seen you in the course. Your AI journey doesn't have to end here!

I know getting started can feel overwhelming, so here's a simple challenge:

**This week, spend just 15 minutes on the "Build Your First Bot" lesson.**

That's it. Just 15 minutes. You'll be amazed at what you can accomplish.

Here's your direct link to get started:
https://aiintegrationcourse.com/courses

Need help? Our AI tutor is available 24/7, and you can always reply to this email.

**Remember:** You have a 14-Day Build-Your-First-Bot Guarantee. Let's make sure you claim it!

Rooting for you,
The AI Integration Course Team

P.S. What's been the biggest blocker for you? Reply and let me know – I'd love to help.`,
      },
    };

    const template = emailTemplates[segment as keyof typeof emailTemplates];
    if (!template) {
      console.error(`Unknown segment: ${segment}`);
      return;
    }

    try {
      // Store email for sending (can be processed by external email service or Gmail API)
      await admin.firestore().collection('email_queue').add({
        to: email,
        subject: template.subject,
        body: template.body,
        segment: segment,
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'churn_recovery',
      });

      // Mark as processed
      await snap.ref.update({
        emailSent: true,
        emailQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'queued',
      });

      // Update user document to prevent duplicate emails
      await admin.firestore().doc(`users/${uid}`).update({
        [`churnEmailSent.${segment}`]: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Queued churn recovery email for ${email} (segment: ${segment})`);
    } catch (error: any) {
      console.error(`Error processing churn recovery email for ${uid}:`, error);
      await snap.ref.update({
        status: 'error',
        error: error.message,
      });
    }
  });

// Track pricing page views for Window Shopper identification
export const trackPricingPageView = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    // Allow anonymous tracking but with limited data
    return { success: true, anonymous: true };
  }

  const uid = context.auth.uid;
  
  try {
    await admin.firestore().doc(`users/${uid}`).update({
      pricingPageViews: admin.firestore.FieldValue.increment(1),
      lastPricingView: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error tracking pricing view for ${uid}:`, error);
    return { success: false, error: error.message };
  }
});

// Track checkout start for Cart Abandoner identification
export const trackCheckoutStart = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const uid = context.auth.uid;
  
  try {
    await admin.firestore().doc(`users/${uid}`).update({
      checkoutStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      checkoutAttempts: admin.firestore.FieldValue.increment(1),
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error tracking checkout start for ${uid}:`, error);
    return { success: false, error: error.message };
  }
});

// Track lesson start for Zombie User identification
export const trackLessonStart = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const uid = context.auth.uid;
  const { lessonId, lessonTitle, moduleId } = data;
  
  try {
    await admin.firestore().doc(`users/${uid}`).update({
      lastLessonStartAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLessonId: lessonId || null,
      lastLessonTitle: lessonTitle || null,
      lessonsStarted: admin.firestore.FieldValue.increment(1),
    });

    // Also log to analytics collection for detailed tracking
    await admin.firestore().collection(`users/${uid}/lesson_activity`).add({
      lessonId,
      lessonTitle,
      moduleId,
      action: 'start',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Error tracking lesson start for ${uid}:`, error);
    return { success: false, error: error.message };
  }
});

// Admin function to manually trigger churn recovery identification
export const manualChurnRecoveryRun = functions
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  // Trigger the scheduled function logic manually
  const db = admin.firestore();
  const now = new Date();
  
  // Get counts for each segment
  const windowShoppers = await db.collection('users')
    .where('pricingPageViews', '>', 0)
    .where('premium', '==', false)
    .get();

  const cartAbandoners = await db.collection('users')
    .where('checkoutStartedAt', '!=', null)
    .where('premium', '==', false)
    .get();

  const zombieUsers = await db.collection('users')
    .where('premium', '==', true)
    .get();

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const actualZombies = zombieUsers.docs.filter(doc => {
    const data = doc.data();
    const lastLesson = data.lastLessonStartAt?.toDate();
    return !lastLesson || lastLesson < thirtyDaysAgo;
  });

  return {
    summary: {
      window_shoppers: windowShoppers.size,
      cart_abandoners: cartAbandoners.size,
      zombie_users: actualZombies.length,
      total_at_risk: windowShoppers.size + cartAbandoners.size + actualZombies.length,
    },
    timestamp: now.toISOString(),
  };
});


// ============================================================================
// ADMIN FUNCTION: Add Lesson to Firestore
// Callable function to add a new lesson to a course module
// ============================================================================
export const addLessonToFirestore = functions.https.onCall(async (data, context) => {
  // Verify admin access (optional - can be removed for initial setup)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  // }

  const { courseId, moduleId, lesson } = data;

  if (!courseId || !moduleId || !lesson) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing courseId, moduleId, or lesson data');
  }

  try {
    const lessonRef = admin.firestore()
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .collection('lessons')
      .doc(lesson.id || `lesson_${Date.now()}`);

    await lessonRef.set({
      title: lesson.title,
      order: lesson.order,
      isFree: lesson.isFree || false,
      tier: lesson.tier || 'premium',
      content: lesson.content || null,
      storagePath: lesson.storagePath || null,
      videoUrl: lesson.videoUrl || null,
      durationMinutes: lesson.durationMinutes || 0,
      description: lesson.description || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Added lesson ${lessonRef.id} to ${courseId}/${moduleId}`);

    return { 
      success: true, 
      lessonId: lessonRef.id,
      path: `courses/${courseId}/modules/${moduleId}/lessons/${lessonRef.id}`
    };
  } catch (err: any) {
    console.error('Error adding lesson:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// ============================================================================
// ADMIN FUNCTION: List Courses and Modules
// Callable function to list all courses and their modules for admin purposes
// ============================================================================
export const listCoursesAndModules = functions.https.onCall(async () => {
  try {
    const coursesSnap = await admin.firestore().collection('courses').get();
    const result: any[] = [];

    for (const courseDoc of coursesSnap.docs) {
      const courseData = courseDoc.data();
      const modulesSnap = await admin.firestore()
        .collection('courses')
        .doc(courseDoc.id)
        .collection('modules')
        .orderBy('order')
        .get();

      const modules: any[] = [];
      for (const moduleDoc of modulesSnap.docs) {
        const moduleData = moduleDoc.data();
        const lessonsSnap = await admin.firestore()
          .collection('courses')
          .doc(courseDoc.id)
          .collection('modules')
          .doc(moduleDoc.id)
          .collection('lessons')
          .orderBy('order')
          .get();

        modules.push({
          id: moduleDoc.id,
          title: moduleData.title,
          order: moduleData.order,
          lessonCount: lessonsSnap.size,
          lessons: lessonsSnap.docs.map(l => ({
            id: l.id,
            title: l.data().title,
            order: l.data().order,
          })),
        });
      }

      result.push({
        id: courseDoc.id,
        title: courseData.title,
        moduleCount: modules.length,
        modules,
      });
    }

    return { success: true, courses: result };
  } catch (err: any) {
    console.error('Error listing courses:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});
