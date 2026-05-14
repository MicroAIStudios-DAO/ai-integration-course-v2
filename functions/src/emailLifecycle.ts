import admin from 'firebase-admin';
import crypto from 'crypto';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  lifecycleEmailTemplates,
  playbookTemplateContext,
  renderEmailTemplate,
  type LifecycleEmailType,
  type TemplateRenderContext,
} from './emailTemplates';

if (!admin.apps.length) {
  admin.initializeApp();
}

const DEFAULT_FROM = 'AI Integration Course <info@aiintegrationcourse.com>';
const DEFAULT_REPLY_TO = 'info@aiintegrationcourse.com';
const DEFAULT_DASHBOARD_URL = 'https://aiintegrationcourse.com/dashboard';
const DEFAULT_CURRICULUM_URL = 'https://aiintegrationcourse.com/curriculum';
const DEFAULT_INTRO_LESSON_URL = 'https://aiintegrationcourse.com/lessons/intro';
const DEFAULT_PRICING_URL = 'https://aiintegrationcourse.com/pricing';
const PLAYBOOK_DELAY_MS = 15 * 60 * 1000;
const CHECKOUT_ABANDONMENT_DELAY_MS = 10 * 60 * 1000;       // Email 1: 10 minutes
const CHECKOUT_ABANDONMENT_2_DELAY_MS = 6 * 60 * 60 * 1000; // Email 2: 6 hours
const CHECKOUT_ABANDONMENT_3_DELAY_MS = 24 * 60 * 60 * 1000; // Email 3: 24 hours
const CHECKOUT_ABANDONMENT_4_DELAY_MS = 48 * 60 * 60 * 1000;  // Email 4: 48 hours
const CHECKOUT_ABANDONMENT_5_DELAY_MS = 6 * 24 * 60 * 60 * 1000; // Email 5: 6 days
const PAYMENT_FAILED_2_DELAY_MS = 2 * 24 * 60 * 60 * 1000;       // Dunning 2: 2 days
const PAYMENT_FAILED_3_DELAY_MS = 5 * 24 * 60 * 60 * 1000;       // Dunning 3: 5 days
const ANNUAL_UPSELL_DELAY_DAYS = 30;    // Day 30 for monthly subscribers

export type EmailQueueStatus = 'pending' | 'processing' | 'sent' | 'retry' | 'error' | 'superseded';

export type QueueEmailDoc = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  previewText: string;
  body: string;
  html: string;
  userId?: string;
  type: LifecycleEmailType | 'marketing_join_invite' | 'marketing_reactivation' | 'churn_recovery';
  campaignId: string;
  templateVersion: string;
  dedupeKey: string;
  meta: Record<string, unknown>;
  status: EmailQueueStatus;
  attemptCount: number;
  scheduledFor: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
};

type QueueTemplateOptions = {
  userId: string;
  email: string;
  displayName?: string | null;
  templateType: LifecycleEmailType;
  dedupeKey: string;
  context?: TemplateRenderContext;
  meta?: Record<string, unknown>;
  scheduledFor?: Date | null;
};

type QueueProfileOptions = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  subscriptionTier?: string | null;
  checkoutStartedAt?: FirebaseFirestore.Timestamp | null;
  trialStartedAt?: FirebaseFirestore.Timestamp | null;
  trialEndsAt?: FirebaseFirestore.Timestamp | null;
  lastLessonStartAt?: FirebaseFirestore.Timestamp | null;
  marketingEmailSent?: Record<string, unknown>;
};

const db = admin.firestore();

const toTimestamp = (value?: Date | FirebaseFirestore.Timestamp | null): FirebaseFirestore.Timestamp | null => {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) {
    return value;
  }
  return admin.firestore.Timestamp.fromDate(value);
};

const firstNameFromProfile = (displayName?: string | null, email?: string | null): string => {
  const cleanDisplayName = (displayName || '').trim();
  if (cleanDisplayName) {
    return cleanDisplayName.split(' ')[0];
  }

  const cleanEmail = (email || '').trim();
  if (cleanEmail.includes('@')) {
    return cleanEmail.split('@')[0];
  }

  return 'there';
};

const humanizeTier = (subscriptionTier?: string | null): string => {
  switch ((subscriptionTier || '').toLowerCase()) {
    case 'explorer':
      return 'Monthly';
    case 'pro':
      return 'Annual';
    case 'corporate':
      return 'Enterprise';
    case 'founding':
      return 'Founding Architect';
    default:
      return subscriptionTier || 'AI Integration Course';
  }
};

const hashDedupeKey = (dedupeKey: string): string =>
  crypto.createHash('sha256').update(dedupeKey).digest('hex');

const buildQueueDocId = (dedupeKey: string): string => `email_${hashDedupeKey(dedupeKey).slice(0, 40)}`;

const buildBaseContext = (options: {
  email: string;
  displayName?: string | null;
  subscriptionTier?: string | null;
}): TemplateRenderContext => ({
  firstName: firstNameFromProfile(options.displayName, options.email),
  displayName: (options.displayName || '').trim() || firstNameFromProfile(options.displayName, options.email),
  subscriptionTier: humanizeTier(options.subscriptionTier),
  ctaUrl: DEFAULT_DASHBOARD_URL,
});

async function queueTemplatedEmail(options: QueueTemplateOptions): Promise<boolean> {
  const email = (options.email || '').trim();
  if (!email) {
    return false;
  }

  const template = lifecycleEmailTemplates[options.templateType];
  const context = {
    ...buildBaseContext({
      email,
      displayName: options.displayName,
      subscriptionTier: String(options.context?.subscriptionTier || ''),
    }),
    ...(options.context || {}),
  };
  const rendered = renderEmailTemplate(template, context);
  const queueRef = db.collection('email_queue').doc(buildQueueDocId(options.dedupeKey));
  const userRef = db.doc(`users/${options.userId}`);
  let queued = false;

  await db.runTransaction(async (tx) => {
    const [queueSnap, userSnap] = await Promise.all([tx.get(queueRef), tx.get(userRef)]);
    if (queueSnap.exists) {
      return;
    }

    const campaignSent = userSnap.exists ? userSnap.get(`marketingEmailSent.${template.campaignId}`) : null;
    if (campaignSent) {
      return;
    }

    const queuePayload: QueueEmailDoc = {
      to: email,
      from: DEFAULT_FROM,
      replyTo: rendered.replyTo || DEFAULT_REPLY_TO,
      subject: rendered.subject,
      previewText: rendered.previewText,
      body: rendered.body,
      html: rendered.html,
      userId: options.userId,
      type: rendered.type,
      campaignId: rendered.campaignId,
      templateVersion: rendered.templateVersion,
      dedupeKey: options.dedupeKey,
      meta: options.meta || {},
      status: 'pending',
      attemptCount: 0,
      scheduledFor: toTimestamp(options.scheduledFor || null),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    tx.set(queueRef, queuePayload);

    if (userSnap.exists) {
      tx.update(userRef, {
        [`marketingEmailSent.${template.campaignId}`]: admin.firestore.FieldValue.serverTimestamp(),
        lastMarketingCampaignId: template.campaignId,
        lastMarketingQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    queued = true;
  });

  return queued;
}

export async function queueWelcomeEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'welcome_email',
    dedupeKey: `welcome_email:${options.uid}:v1`,
    context: {
      ctaUrl: DEFAULT_DASHBOARD_URL,
    },
    meta: {
      trigger: 'account_creation',
    },
  });
}

export async function queueTrialStartedEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_started_email',
    dedupeKey: `trial_started_email:${options.uid}:${humanizeTier(options.subscriptionTier)}:v1`,
    context: {
      subscriptionTier: humanizeTier(options.subscriptionTier),
      ctaUrl: DEFAULT_CURRICULUM_URL,
    },
    meta: {
      trigger: 'trial_started',
      trialStartedAt: options.trialStartedAt || null,
      trialEndsAt: options.trialEndsAt || null,
    },
  });
}

export async function queuePlaybookDelivery(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'playbook_delivery',
    dedupeKey: `playbook_delivery:${options.uid}:v1`,
    context: {
      ...playbookTemplateContext,
    },
    meta: {
      trigger: 'playbook_delivery',
      asset: 'prompt_engineering_automation_playbook_full',
    },
    scheduledFor: new Date(Date.now() + PLAYBOOK_DELAY_MS),
  });
}

export async function queueTrialDay3Nudge(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_day_3_nudge',
    dedupeKey: `trial_day_3_nudge:${options.uid}:v1`,
    context: {
      ctaUrl: DEFAULT_INTRO_LESSON_URL,
    },
    meta: {
      trigger: 'trial_day_3',
      trialStartedAt: options.trialStartedAt || null,
    },
  });
}

export async function queueTrialExpiredOffer(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_expired_offer',
    dedupeKey: `trial_expired_offer:${options.uid}:v2`,
    context: {
      ctaUrl: `${DEFAULT_PRICING_URL}?utm_source=reactivation_email&utm_medium=email&utm_campaign=trial_expired_offer_v2_20260410`,
    },
    meta: {
      trigger: 'trial_expired',
      trialEndsAt: options.trialEndsAt || null,
    },
  });
}

export async function queueCheckoutAbandonmentEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'checkout_abandonment_email',
    dedupeKey: `checkout_abandonment_email:${options.uid}:v1`,
    context: {
      ctaUrl: `${DEFAULT_PRICING_URL}?utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_v1_20260410`,
    },
    meta: {
      trigger: 'checkout_abandonment',
      checkoutStartedAt: options.checkoutStartedAt || null,
    },
  });
}

export async function queueCheckoutAbandonmentEmail2(options: QueueProfileOptions & { planName?: string; recoveryUrl?: string }): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'checkout_abandonment_email_2',
    dedupeKey: `checkout_abandonment_email_2:${options.uid}:v1`,
    context: {
      planName: options.planName || 'Pro Trial',
      ctaUrl: options.recoveryUrl || `${DEFAULT_PRICING_URL}?utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_2_v1_2026&utm_content=email2_objections`,
    },
    meta: { trigger: 'checkout_abandonment_2', checkoutStartedAt: options.checkoutStartedAt || null },
    scheduledFor: new Date(Date.now() + CHECKOUT_ABANDONMENT_2_DELAY_MS),
  });
}

export async function queueCheckoutAbandonmentEmail3(options: QueueProfileOptions & { recoveryUrl?: string }): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'checkout_abandonment_email_3',
    dedupeKey: `checkout_abandonment_email_3:${options.uid}:v1`,
    context: {
      ctaUrl: options.recoveryUrl || `${DEFAULT_PRICING_URL}?utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_3_v1_2026&utm_content=email3_transformation`,
    },
    meta: { trigger: 'checkout_abandonment_3', checkoutStartedAt: options.checkoutStartedAt || null },
    scheduledFor: new Date(Date.now() + CHECKOUT_ABANDONMENT_3_DELAY_MS),
  });
}

export async function queueCheckoutAbandonmentEmail4(options: QueueProfileOptions & { recoveryUrl?: string }): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'checkout_abandonment_email_4',
    dedupeKey: `checkout_abandonment_email_4:${options.uid}:v1`,
    context: {
      ctaUrl: options.recoveryUrl || `${DEFAULT_PRICING_URL}?utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_4_v1_2026&utm_content=email4_bonus`,
    },
    meta: { trigger: 'checkout_abandonment_4', checkoutStartedAt: options.checkoutStartedAt || null },
    scheduledFor: new Date(Date.now() + CHECKOUT_ABANDONMENT_4_DELAY_MS),
  });
}

export async function queueCheckoutAbandonmentEmail5(options: QueueProfileOptions & { recoveryUrl?: string; trialUrl?: string }): Promise<boolean> {
  const trialUrl = options.trialUrl || `${DEFAULT_PRICING_URL}?plan=pro_trial&utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_5_closeout`;
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'checkout_abandonment_email_5',
    dedupeKey: `checkout_abandonment_email_5:${options.uid}:v1`,
    context: {
      ctaUrl: options.recoveryUrl || `${DEFAULT_PRICING_URL}?utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_5_closeout`,
      trialUrl,
    },
    meta: { trigger: 'checkout_abandonment_5', checkoutStartedAt: options.checkoutStartedAt || null },
    scheduledFor: new Date(Date.now() + CHECKOUT_ABANDONMENT_5_DELAY_MS),
  });
}

export async function queueTrialDay1Email(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_day_1_email',
    dedupeKey: `trial_day_1_email:${options.uid}:v1`,
    context: {
      quickStartLink: `${DEFAULT_CURRICULUM_URL}?utm_source=trial_onboarding&utm_medium=email&utm_campaign=trial_day_1_v1_2026`,
    },
    meta: { trigger: 'trial_started_day_1' },
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Day 1 = 24h after trial start
  });
}

export async function queueTrialDay5Email(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_day_5_email',
    dedupeKey: `trial_day_5_email:${options.uid}:v1`,
    context: {
      ctaUrl: `${DEFAULT_CURRICULUM_URL}?utm_source=trial_onboarding&utm_medium=email&utm_campaign=trial_day_5_v1_2026`,
    },
    meta: { trigger: 'trial_day_5' },
  });
}

export async function queueTrialDay7Email(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_day_7_email',
    dedupeKey: `trial_day_7_email:${options.uid}:v1`,
    context: {
      ctaUrl: `${DEFAULT_DASHBOARD_URL}?utm_source=trial_onboarding&utm_medium=email&utm_campaign=trial_day_7_v1_2026`,
    },
    meta: { trigger: 'trial_day_7' },
  });
}

export async function queueTrialConciergeEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_concierge_email',
    dedupeKey: `trial_concierge_email:${options.uid}:v1`,
    context: {},
    meta: { trigger: 'trial_not_activated_day_3' },
  });
}

export async function queuePaymentFailedEmail2(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'payment_failed_email_2',
    dedupeKey: `payment_failed_email_2:${options.uid}:${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
    context: {
      ctaUrl: `${DEFAULT_DASHBOARD_URL}/billing?utm_source=payment_failed&utm_medium=email&utm_campaign=payment_failed_email_2_v1_2026`,
    },
    meta: { trigger: 'payment_failed_2', subscriptionTier: options.subscriptionTier || '' },
    scheduledFor: new Date(Date.now() + PAYMENT_FAILED_2_DELAY_MS),
  });
}

export async function queuePaymentFailedEmail3(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'payment_failed_email_3',
    dedupeKey: `payment_failed_email_3:${options.uid}:${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
    context: {
      ctaUrl: `${DEFAULT_DASHBOARD_URL}/billing?utm_source=payment_failed&utm_medium=email&utm_campaign=payment_failed_email_3_v1_2026`,
    },
    meta: { trigger: 'payment_failed_3', subscriptionTier: options.subscriptionTier || '' },
    scheduledFor: new Date(Date.now() + PAYMENT_FAILED_3_DELAY_MS),
  });
}

export async function queueRescueLinkEmail(options: { uid: string; email: string; resumeUrl: string }): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email,
    templateType: 'rescue_link_email',
    dedupeKey: `rescue_link_email:${options.uid}:${Math.floor(Date.now() / (60 * 60 * 1000))}`, // 1 per hour
    context: { resumeUrl: options.resumeUrl },
    meta: { trigger: 'exit_intent_rescue' },
  });
}

export async function queueTrialEndingSoon(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'trial_ending_soon',
    dedupeKey: `trial_ending_soon:${options.uid}:v1`,
    context: {
      ctaUrl: `${DEFAULT_DASHBOARD_URL}?utm_source=trial_ending&utm_medium=email&utm_campaign=trial_ending_soon_v1_2026`,
    },
    meta: { trigger: 'trial_ending_soon', trialEndsAt: options.trialEndsAt || null },
  });
}

export async function queuePaymentFailedEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'payment_failed_email',
    dedupeKey: `payment_failed_email:${options.uid}:${Date.now()}`,
    context: {
      planName: options.subscriptionTier ? humanizeTier(options.subscriptionTier) : 'your plan',
      ctaUrl: `${DEFAULT_DASHBOARD_URL}/billing?utm_source=payment_failed&utm_medium=email&utm_campaign=payment_failed_email_v1_2026`,
    },
    meta: { trigger: 'payment_failed', subscriptionTier: options.subscriptionTier || '' },
  });
}

export async function queueAnnualUpsellEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'annual_upsell_email',
    dedupeKey: `annual_upsell_email:${options.uid}:v1`,
    context: {
      ctaUrl: `${DEFAULT_PRICING_URL}?plan=pro&utm_source=annual_upsell&utm_medium=email&utm_campaign=annual_upsell_email_v1_2026`,
    },
    meta: { trigger: 'annual_upsell_day30', subscriptionTier: options.subscriptionTier || '' },
  });
}

export async function queuePaidWelcomeEmail(options: QueueProfileOptions): Promise<boolean> {
  return queueTemplatedEmail({
    userId: options.uid,
    email: options.email || '',
    displayName: options.displayName,
    templateType: 'paid_welcome_email',
    dedupeKey: `paid_welcome_email:${options.uid}:v1`,
    context: {
      subscriptionTier: humanizeTier(options.subscriptionTier),
      ctaUrl: DEFAULT_DASHBOARD_URL,
    },
    meta: {
      trigger: 'first_successful_charge',
      subscriptionTier: humanizeTier(options.subscriptionTier),
    },
  });
}

export const queueLifecycleEmailCadenceV2 = onSchedule(
  {
    region: 'us-central1',
    schedule: 'every 30 minutes',
    timeZone: 'America/Los_Angeles',
  },
  async () => {
    const now = new Date();
    const usersSnap = await db.collection('users').limit(500).get();
    let checkoutQueued = 0;
    let trialEndingSoonQueued = 0;
    let annualUpsellQueued = 0;

    for (const userDoc of usersSnap.docs) {
      const profile = userDoc.data();
      const email = (profile.email || '').toString().trim();
      if (!email || profile.isAdmin === true || profile.role === 'admin') {
        continue;
      }

      const uid = userDoc.id;
      const subscriptionStatus = (profile.subscriptionStatus || 'none').toString().toLowerCase();
      const premium = profile.premium === true;
      const checkoutStartedAt = profile.checkoutStartedAt as FirebaseFirestore.Timestamp | undefined;
      const trialEndsAt = profile.trialEndsAt as FirebaseFirestore.Timestamp | undefined;
      const subscriptionStartedAt = profile.subscriptionStartedAt as FirebaseFirestore.Timestamp | undefined;
      const billingInterval = (profile.billingInterval || '').toString().toLowerCase();

      // ── ABANDONMENT SEQUENCE (5 emails) ──────────────────────────────────────────────
      if (
        checkoutStartedAt &&
        !premium &&
        subscriptionStatus !== 'trialing' &&
        subscriptionStatus !== 'active'
      ) {
        const elapsedMs = now.getTime() - checkoutStartedAt.toDate().getTime();
        const planKey = (profile.pendingCheckoutPlanKey || 'pro_trial').toString();
        const isAnnualAbandon = planKey === 'pro';
        // Plan-aware recovery URL
        const recoveryUrl = `${DEFAULT_PRICING_URL}?plan=${planKey}&utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_recovery`;
        // Plan-aware CTA label for Email 2 (Section 7)
        const email2CtaLabel = isAnnualAbandon ? 'Start the 7-Day Trial for $1' : 'Resume My $1 Trial';
        // Annual fallback copy for Emails 3 & 4
        const annualFallback = isAnnualAbandon ? `\n\nStart with $1 Instead:\n${DEFAULT_PRICING_URL}?plan=pro_trial&utm_source=checkout_abandonment&utm_medium=email&utm_campaign=annual_to_trial_fallback` : '';
        const annualFallbackHtml = isAnnualAbandon ? `<p style="margin-top:12px;"><a href="${DEFAULT_PRICING_URL}?plan=pro_trial&utm_source=checkout_abandonment&utm_medium=email&utm_campaign=annual_to_trial_fallback" style="display:inline-block;padding:10px 18px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Start with $1 Instead →</a></p>` : '';
        const opts = { uid, email, displayName: profile.displayName, checkoutStartedAt };

        // Email 1: 10 minutes
        if (elapsedMs >= CHECKOUT_ABANDONMENT_DELAY_MS) {
          const queued = await queueCheckoutAbandonmentEmail(opts);
          if (queued) checkoutQueued += 1;
        }
        // Email 2: ~22-24 hours — plan-aware objection handler
        if (elapsedMs >= CHECKOUT_ABANDONMENT_2_DELAY_MS) {
          await queueCheckoutAbandonmentEmail2({
            ...opts,
            planName: planKey,
            recoveryUrl: `${recoveryUrl}&utm_content=email2_objections`,
            // @ts-ignore — extra context fields passed through
            ctaLabel: email2CtaLabel,
          });
        }
        // Email 3: ~46-48 hours — momentum / identity + annual fallback
        if (elapsedMs >= CHECKOUT_ABANDONMENT_3_DELAY_MS) {
          await queueCheckoutAbandonmentEmail3({
            ...opts,
            recoveryUrl: `${recoveryUrl}&utm_content=email3_momentum`,
            // @ts-ignore
            annualFallback,
            annualFallbackHtml,
          });
        }
        // Email 4: ~72 hours — conditional incentive (first-time buyers only)
        if (elapsedMs >= CHECKOUT_ABANDONMENT_4_DELAY_MS && !profile.hasPurchasedBefore) {
          await queueCheckoutAbandonmentEmail4({
            ...opts,
            recoveryUrl: `${recoveryUrl}&utm_content=email4_incentive`,
            // @ts-ignore
            annualFallback,
            annualFallbackHtml,
          });
        }
        // Email 5: 6-7 days — closeout
        if (elapsedMs >= CHECKOUT_ABANDONMENT_5_DELAY_MS) {
          await queueCheckoutAbandonmentEmail5({
            ...opts,
            recoveryUrl: `${recoveryUrl}&utm_content=email5_closeout`,
            trialUrl: `${DEFAULT_PRICING_URL}?plan=pro_trial&utm_source=checkout_abandonment&utm_medium=email&utm_campaign=checkout_abandonment_email_5_closeout`,
          });
        }
      }

      // ── TRIAL ONBOARDING SEQUENCE (Day 1, 3, 5, 7 + Concierge) ───────────────────
      const trialStartedAt = profile.trialStartedAt as FirebaseFirestore.Timestamp | undefined;
      if (subscriptionStatus === 'trialing' && trialStartedAt) {
        if (trialStartedAt) {
          const daysSinceTrial = (now.getTime() - trialStartedAt.toDate().getTime()) / (24 * 60 * 60 * 1000);
          const hasActivated = profile.firstValueCompletedAt != null;

          // Day 1: Get your first win
          if (daysSinceTrial >= 1 && daysSinceTrial < 2) {
            await queueTrialDay1Email({ uid, email, displayName: profile.displayName });
          }
          // Day 3: Concierge for non-activated users
          if (daysSinceTrial >= 3 && daysSinceTrial < 4 && !hasActivated) {
            await queueTrialConciergeEmail({ uid, email, displayName: profile.displayName });
          }
          // Day 5: Trial moving fast
          if (daysSinceTrial >= 5 && daysSinceTrial < 6) {
            await queueTrialDay5Email({ uid, email, displayName: profile.displayName });
          }
          // Day 7: Final day
          if (daysSinceTrial >= 7 && daysSinceTrial < 8) {
            await queueTrialDay7Email({ uid, email, displayName: profile.displayName });
          }
        }
      }

      // ── TRIAL ENDING SOON (Day 6 of trial) ───────────────────────────────────────────
      if (trialEndsAt && subscriptionStatus === 'trialing') {
        const msUntilTrialEnd = trialEndsAt.toDate().getTime() - now.getTime();
        const msInOneDay = 24 * 60 * 60 * 1000;
        // Send when between 24h and 48h remain (Day 6 window)
        if (msUntilTrialEnd > 0 && msUntilTrialEnd <= msInOneDay * 2 && msUntilTrialEnd > msInOneDay) {
          const queued = await queueTrialEndingSoon({ uid, email, displayName: profile.displayName, trialEndsAt });
          if (queued) trialEndingSoonQueued += 1;
        }
      }

      // ── DUNNING SEQUENCE — 3-step payment failure recovery ───────────────────────
      const paymentFailedAt = profile.paymentFailedAt as FirebaseFirestore.Timestamp | undefined;
      if (paymentFailedAt && subscriptionStatus === 'past_due') {
        const elapsedSinceFailure = now.getTime() - paymentFailedAt.toDate().getTime();
        const dunningOpts = { uid, email, displayName: profile.displayName, subscriptionTier: profile.subscriptionTier };
        // Dunning 1: immediate (fired from webhook, not here)
        // Dunning 2: 2 days after failure
        if (elapsedSinceFailure >= PAYMENT_FAILED_2_DELAY_MS) {
          await queuePaymentFailedEmail2(dunningOpts);
        }
        // Dunning 3: 5 days after failure (final warning)
        if (elapsedSinceFailure >= PAYMENT_FAILED_3_DELAY_MS) {
          await queuePaymentFailedEmail3(dunningOpts);
        }
      }

      // ── ANNUAL UPSELL (Day 30 for monthly subscribers) ─────────────────────────────
      if (
        subscriptionStatus === 'active' &&
        billingInterval === 'month' &&
        subscriptionStartedAt
      ) {
        const daysSinceStart = (now.getTime() - subscriptionStartedAt.toDate().getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceStart >= ANNUAL_UPSELL_DELAY_DAYS && daysSinceStart < ANNUAL_UPSELL_DELAY_DAYS + 1) {
          const queued = await queueAnnualUpsellEmail({ uid, email, displayName: profile.displayName, subscriptionTier: profile.subscriptionTier });
          if (queued) annualUpsellQueued += 1;
        }
      }
    }

    console.log(`Lifecycle cadence queued checkout=${checkoutQueued} trialEndingSoon=${trialEndingSoonQueued} annualUpsell=${annualUpsellQueued}`);
    // SMS_TEMPLATES (Section 8): Delivered as Twilio/Klaviyo integration specs — see SMS_Templates.md
    // RETARGETING (Section 9): dataLayer pushes are live in analytics.ts — see Retargeting_Ad_Specs.md
    // HOT_SAUCE (Section 13): Source-aware copy via UTM params — see HotSauce_Spec.md
  }
);
