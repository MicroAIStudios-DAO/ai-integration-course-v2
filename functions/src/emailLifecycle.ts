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

const DEFAULT_FROM = 'AI Integration Course <Info@aiintegrationcourse.com>';
const DEFAULT_REPLY_TO = 'Info@aiintegrationcourse.com';
const DEFAULT_DASHBOARD_URL = 'https://aiintegrationcourse.com/dashboard';
const DEFAULT_CURRICULUM_URL = 'https://aiintegrationcourse.com/curriculum';
const DEFAULT_INTRO_LESSON_URL = 'https://aiintegrationcourse.com/lessons/intro';
const DEFAULT_PRICING_URL = 'https://aiintegrationcourse.com/pricing';
const PLAYBOOK_DELAY_MS = 15 * 60 * 1000;
const CHECKOUT_ABANDONMENT_DELAY_MS = 60 * 60 * 1000;

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

      const hasPromoConsent = profile.promotionalEmailConsent === true;

      if (
        checkoutStartedAt &&
        checkoutStartedAt.toDate().getTime() <= now.getTime() - CHECKOUT_ABANDONMENT_DELAY_MS &&
        !premium &&
        subscriptionStatus !== 'trialing' &&
        subscriptionStatus !== 'active' &&
        hasPromoConsent
      ) {
        const queued = await queueCheckoutAbandonmentEmail({
          uid,
          email,
          displayName: profile.displayName,
          checkoutStartedAt,
        });
        if (queued) {
          checkoutQueued += 1;
        }
      }
    }

    console.log(`Lifecycle cadence queued checkout=${checkoutQueued}`);
  }
);
