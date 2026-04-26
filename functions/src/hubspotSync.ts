/**
 * hubspotSync.ts
 *
 * Firebase Functions (v2) that mirror the Firestore `leads` collection to HubSpot contacts.
 * This creates a precise marketing intelligence layer — every lead, abandonment event,
 * recovery email, and conversion is reflected in HubSpot for segmentation and automation.
 *
 * Architecture:
 * - Firestore trigger on leads/{leadId} create/update → upsert HubSpot contact
 * - Firestore trigger on users/{userId} update → sync subscription status to HubSpot
 * - Stripe webhook events → update HubSpot lifecycle stage
 *
 * HubSpot Custom Properties (created via MCP):
 * - lead_source_utm: Full UTM string
 * - offer_type: pro_trial | pro_monthly | pro_annual | explorer
 * - checkout_funnel_stage: lead_captured → checkout_started → checkout_abandoned → converted → trialing → active_subscriber → churned
 * - stripe_customer_id: cus_xxx
 * - recovery_attribution: stripe_recovery_link | email_1_10min | ... | retargeting_ad
 * - subscription_mrr: Monthly Recurring Revenue in USD cents
 * - checkout_abandoned_at: ISO timestamp of abandonment
 * - last_abandoned_plan_key: planKey at time of abandonment
 * - last_abandoned_stripe_session: Stripe session ID
 */

import * as admin from 'firebase-admin';
import axios from 'axios';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

function getHubSpotToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not configured in Firebase Functions environment');
  }
  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// HUBSPOT API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  phone?: string;
  hs_lead_status?: string;
  lifecyclestage?: string;
  lead_source_utm?: string;
  offer_type?: string;
  checkout_funnel_stage?: string;
  stripe_customer_id?: string;
  recovery_attribution?: string;
  subscription_mrr?: number;
  checkout_abandoned_at?: string;
  last_abandoned_plan_key?: string;
  last_abandoned_stripe_session?: string;
  hs_marketing_email_opt_in?: boolean;
  hs_sms_opt_in?: boolean;
}

async function upsertHubSpotContact(properties: HubSpotContactProperties): Promise<string | null> {
  const token = getHubSpotToken();
  const { email, ...rest } = properties;

  try {
    // Try to create first
    const createRes = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      { properties: { email, ...rest } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[HubSpot] Created contact: ${email} → ${createRes.data.id}`);
    return createRes.data.id as string;
  } catch (createErr: unknown) {
    const err = createErr as { response?: { status?: number; data?: unknown }; message?: string };
    if (err.response?.status === 409) {
      // Contact already exists — upsert by email
      try {
        const upsertRes = await axios.patch(
          `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
          { properties: rest },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`[HubSpot] Updated contact: ${email} → ${upsertRes.data.id}`);
        return upsertRes.data.id as string;
      } catch (updateErr: unknown) {
        const ue = updateErr as { response?: { data?: unknown }; message?: string };
        console.error(`[HubSpot] Failed to update contact ${email}:`, ue.response?.data || ue.message);
        return null;
      }
    }
    console.error(`[HubSpot] Failed to create contact ${email}:`, err.response?.data || err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN KEY → MRR MAPPING
// ─────────────────────────────────────────────────────────────────────────────

function planKeyToMrr(planKey: string): number {
  const mrrMap: Record<string, number> = {
    pro_trial: 100,       // $1.00 in cents
    pro_monthly: 2999,    // $29.99 in cents
    pro_annual: 1992,     // $239/12 = $19.92/mo in cents
    explorer: 0,
  };
  return mrrMap[planKey] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 1: Firestore leads/{leadId} onCreate → Create HubSpot contact
// ─────────────────────────────────────────────────────────────────────────────

export const onLeadCreated = onDocumentCreated('leads/{leadId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const lead = snap.data();
  if (!lead?.email) {
    console.warn('[HubSpot] Lead created without email — skipping sync');
    return;
  }

  const utmString = [
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.utmContent,
    lead.utmTerm,
  ]
    .filter(Boolean)
    .join('|');

  const contactId = await upsertHubSpotContact({
    email: lead.email as string,
    firstname: (lead.displayName as string) || undefined,
    phone: (lead.phone as string) || undefined,
    lead_source_utm: utmString || undefined,
    offer_type: (lead.planKey as string) || undefined,
    checkout_funnel_stage: 'lead_captured',
    lifecyclestage: 'lead',
    hs_lead_status: 'NEW',
    hs_marketing_email_opt_in: lead.marketingConsent === true,
    hs_sms_opt_in: lead.smsConsent === true,
  });

  if (contactId) {
    await snap.ref.update({
      hubspotContactId: contactId,
      hubspotSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 2: Firestore leads/{leadId} onUpdate → Sync status changes to HubSpot
// ─────────────────────────────────────────────────────────────────────────────

export const onLeadUpdated = onDocumentUpdated('leads/{leadId}', async (event) => {
  const change = event.data;
  if (!change) return;
  const before = change.before.data();
  const after = change.after.data();

  if (!after?.email) return;
  if (before?.status === after?.status && before?.checkout_funnel_stage === after?.checkout_funnel_stage) {
    return; // No relevant change
  }

  const properties: HubSpotContactProperties = {
    email: after.email as string,
  };

  // Map status to HubSpot lifecycle stage
  if (after.status === 'checkout_abandoned') {
    properties.checkout_funnel_stage = 'checkout_abandoned';
    properties.lifecyclestage = 'salesqualifiedlead';
    properties.hs_lead_status = 'IN_PROGRESS';
    const abandonedAt = after.abandonedAt as { toDate?: () => Date } | null;
    properties.checkout_abandoned_at = abandonedAt?.toDate?.()?.toISOString() || new Date().toISOString();
    properties.last_abandoned_plan_key = after.planKey as string;
    properties.last_abandoned_stripe_session = after.stripeSessionId as string;
    properties.offer_type = after.planKey as string;
  } else if (after.status === 'converted') {
    properties.checkout_funnel_stage = 'converted';
    properties.lifecyclestage = 'customer';
    properties.hs_lead_status = 'CONNECTED';
    properties.recovery_attribution = (after.recovered_from as string) || undefined;
    properties.stripe_customer_id = (after.stripeCustomerId as string) || undefined;
    properties.subscription_mrr = planKeyToMrr((after.planKey as string) || '');
  } else if (after.status === 'checkout_started') {
    properties.checkout_funnel_stage = 'checkout_started';
    properties.lifecyclestage = 'opportunity';
  }

  await upsertHubSpotContact(properties);
});

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 3: Firestore users/{userId} onUpdate → Sync subscription status to HubSpot
// ─────────────────────────────────────────────────────────────────────────────

export const onUserSubscriptionUpdated = onDocumentUpdated('users/{userId}', async (event) => {
  const change = event.data;
  if (!change) return;
  const before = change.before.data();
  const after = change.after.data();

  if (!after?.email) return;

  // Only sync on subscription status changes
  const statusChanged = before?.subscriptionStatus !== after?.subscriptionStatus;
  const tierChanged = before?.subscriptionTier !== after?.subscriptionTier;
  const paymentFailedChanged = before?.paymentFailedAt !== after?.paymentFailedAt;

  if (!statusChanged && !tierChanged && !paymentFailedChanged) return;

  const properties: HubSpotContactProperties = {
    email: after.email as string,
  };

  const status = after.subscriptionStatus as string;
  const planKey = (after.planKey || after.subscriptionTier) as string;

  if (status === 'active') {
    properties.checkout_funnel_stage = 'active_subscriber';
    properties.lifecyclestage = 'customer';
    properties.hs_lead_status = 'CONNECTED';
    properties.subscription_mrr = planKeyToMrr(planKey || '');
    properties.stripe_customer_id = (after.stripeCustomerId as string) || undefined;
  } else if (status === 'trialing') {
    properties.checkout_funnel_stage = 'trialing';
    properties.lifecyclestage = 'opportunity';
    properties.subscription_mrr = planKeyToMrr('pro_trial');
  } else if (status === 'past_due') {
    properties.checkout_funnel_stage = 'active_subscriber'; // Still a customer, just past due
    properties.hs_lead_status = 'IN_PROGRESS';
  } else if (status === 'cancelled' || status === 'canceled') {
    properties.checkout_funnel_stage = 'churned';
    properties.lifecyclestage = 'other';
    properties.hs_lead_status = 'UNQUALIFIED';
    properties.subscription_mrr = 0;
  }

  await upsertHubSpotContact(properties);
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: Callable function for manual HubSpot sync (admin use)
// ─────────────────────────────────────────────────────────────────────────────

export const syncLeadToHubSpot = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be authenticated');

  // Check admin role
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  if (userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const email = request.data?.email as string | undefined;
  if (!email) throw new HttpsError('invalid-argument', 'Email required');

  // Find lead by email
  const leadsSnap = await admin.firestore()
    .collection('leads')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (leadsSnap.empty) {
    throw new HttpsError('not-found', `No lead found for email: ${email}`);
  }

  const lead = leadsSnap.docs[0].data();
  const utmString = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join('|');

  const contactId = await upsertHubSpotContact({
    email: lead.email as string,
    firstname: (lead.displayName as string) || undefined,
    lead_source_utm: utmString || undefined,
    offer_type: (lead.planKey as string) || undefined,
    checkout_funnel_stage: (lead.status as string) || 'lead_captured',
    stripe_customer_id: (lead.stripeCustomerId as string) || undefined,
    subscription_mrr: planKeyToMrr((lead.planKey as string) || ''),
  });

  return { success: true, hubspotContactId: contactId };
});
