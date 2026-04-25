/**
 * billingPortal.ts
 * Spec §14: POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session for authenticated users.
 * Allows subscribers to:
 *   - Update payment method (critical for dunning recovery)
 *   - Cancel subscription
 *   - View invoice history
 *   - Update billing address
 *
 * Called from:
 *   - /billing route in the React app
 *   - Dunning email "Update Payment Method" CTA
 *   - Profile page "Manage Subscription" button
 */

import admin from 'firebase-admin';
import Stripe from 'stripe';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const db = admin.firestore();

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET || STRIPE_SECRET.value();
  if (!stripeInstance) {
    stripeInstance = new Stripe(secret || '', { apiVersion: '2024-06-20' });
  }
  return stripeInstance;
}

export const createBillingPortalSession = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to manage your subscription.');
    }

    const uid = request.auth.uid;
    const returnUrl = (request.data?.returnUrl as string | undefined)
      || 'https://aiintegrationcourse.com/profile?tab=billing';

    // Fetch the user's Stripe customer ID from Firestore
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User account not found.');
    }

    const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined;
    if (!stripeCustomerId) {
      throw new HttpsError(
        'failed-precondition',
        'No billing account found. Please contact info@aiintegrationcourse.com.'
      );
    }

    const stripe = getStripe();

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      // Log the portal access for analytics
      await db.collection('analytics_events').add({
        eventName: 'billing_portal_accessed',
        uid,
        stripeCustomerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        url: portalSession.url,
      };
    } catch (err: any) {
      console.error('[BillingPortal] Failed to create portal session:', err.message);
      throw new HttpsError(
        'internal',
        'Could not open billing portal. Please try again or contact info@aiintegrationcourse.com.'
      );
    }
  }
);
