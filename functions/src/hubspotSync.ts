/**
 * hubspotSync.ts
 * 
 * Firebase Functions that mirror the Firestore `leads` collection to HubSpot contacts.
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

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

function getHubSpotToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN || functions.config().hubspot?.access_token;
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
    return createRes.data.id;
  } catch (createErr: any) {
    if (createErr.response?.status === 409) {
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
        return upsertRes.data.id;
      } catch (updateErr: any) {
        console.error(`[HubSpot] Failed to update contact ${email}:`, updateErr.response?.data || updateErr.message);
        return null;
      }
    }
    console.error(`[HubSpot] Failed to create contact ${email}:`, createErr.response?.data || createErr.message);
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

function planKeyToLifecycleStage(planKey: string, status: string): string {
  if (status === 'converted' || status === 'active') return 'customer';
  if (status === 'trialing') return 'opportunity';
  if (status === 'checkout_abandoned') return 'salesqualifiedlead';
  if (status === 'lead_captured') return 'lead';
  return 'lead';
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 1: Firestore leads/{leadId} onCreate → Create HubSpot contact
// ─────────────────────────────────────────────────────────────────────────────

export const onLeadCreated = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap) => {
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
      email: lead.email,
      firstname: lead.displayName || undefined,
      phone: lead.phone || undefined,
      lead_source_utm: utmString || undefined,
      offer_type: lead.planKey || undefined,
      checkout_funnel_stage: 'lead_captured',
      lifecyclestage: 'lead',
      hs_lead_status: 'NEW',
      hs_marketing_email_opt_in: lead.marketingConsent === true,
      hs_sms_opt_in: lead.smsConsent === true,
    });

    if (contactId) {
      await snap.ref.update({ hubspotContactId: contactId, hubspotSyncedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 2: Firestore leads/{leadId} onUpdate → Sync status changes to HubSpot
// ─────────────────────────────────────────────────────────────────────────────

export const onLeadUpdated = functions.firestore
  .document('leads/{leadId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after?.email) return;
    if (before?.status === after?.status && before?.checkout_funnel_stage === after?.checkout_funnel_stage) {
      return; // No relevant change
    }

    const properties: HubSpotContactProperties = {
      email: after.email,
    };

    // Map status to HubSpot lifecycle stage
    if (after.status === 'checkout_abandoned') {
      properties.checkout_funnel_stage = 'checkout_abandoned';
      properties.lifecyclestage = 'salesqualifiedlead';
      properties.hs_lead_status = 'IN_PROGRESS';
      properties.checkout_abandoned_at = after.abandonedAt?.toDate?.()?.toISOString() || new Date().toISOString();
      properties.last_abandoned_plan_key = after.planKey;
      properties.last_abandoned_stripe_session = after.stripeSessionId;
      properties.offer_type = after.planKey;
    } else if (after.status === 'converted') {
      properties.checkout_funnel_stage = 'converted';
      properties.lifecyclestage = 'customer';
      properties.hs_lead_status = 'CONNECTED';
      properties.recovery_attribution = after.recovered_from || undefined;
      properties.stripe_customer_id = after.stripeCustomerId || undefined;
      properties.subscription_mrr = planKeyToMrr(after.planKey || '');
    } else if (after.status === 'checkout_started') {
      properties.checkout_funnel_stage = 'checkout_started';
      properties.lifecyclestage = 'opportunity';
    }

    await upsertHubSpotContact(properties);
  });

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 3: Firestore users/{userId} onUpdate → Sync subscription status to HubSpot
// ─────────────────────────────────────────────────────────────────────────────

export const onUserSubscriptionUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after?.email) return;

    // Only sync on subscription status changes
    const statusChanged = before?.subscriptionStatus !== after?.subscriptionStatus;
    const tierChanged = before?.subscriptionTier !== after?.subscriptionTier;
    const paymentFailedChanged = before?.paymentFailedAt !== after?.paymentFailedAt;

    if (!statusChanged && !tierChanged && !paymentFailedChanged) return;

    const properties: HubSpotContactProperties = {
      email: after.email,
    };

    const status = after.subscriptionStatus;
    const planKey = after.planKey || after.subscriptionTier;

    if (status === 'active') {
      properties.checkout_funnel_stage = 'active_subscriber';
      properties.lifecyclestage = 'customer';
      properties.hs_lead_status = 'CONNECTED';
      properties.subscription_mrr = planKeyToMrr(planKey || '');
      properties.stripe_customer_id = after.stripeCustomerId || undefined;
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

export const syncLeadToHubSpot = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');

  // Check admin role
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { email } = data;
  if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email required');

  // Find lead by email
  const leadsSnap = await admin.firestore()
    .collection('leads')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (leadsSnap.empty) {
    throw new functions.https.HttpsError('not-found', `No lead found for email: ${email}`);
  }

  const lead = leadsSnap.docs[0].data();
  const utmString = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join('|');

  const contactId = await upsertHubSpotContact({
    email: lead.email,
    firstname: lead.displayName || undefined,
    lead_source_utm: utmString || undefined,
    offer_type: lead.planKey || undefined,
    checkout_funnel_stage: lead.status || 'lead_captured',
    stripe_customer_id: lead.stripeCustomerId || undefined,
    subscription_mrr: planKeyToMrr(lead.planKey || ''),
  });

  return { success: true, hubspotContactId: contactId };
});
