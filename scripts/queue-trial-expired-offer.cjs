#!/usr/bin/env node

const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'ai-integra-course-v2' });
}

const db = admin.firestore();

const CAMPAIGN_ID = 'trial_expired_offer_v2_20260410';
const CAMPAIGN_LINK = 'https://aiintegrationcourse.com/pricing?utm_source=reactivation_email&utm_medium=email&utm_campaign=trial_expired_offer_v2_20260410';
const TEMPLATE_VERSION = 'v2';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const dryRun = process.argv.includes('--dry-run');

const getFirstName = (data) => {
  const displayName = (data.displayName || '').trim();
  if (displayName) {
    return displayName.split(' ')[0];
  }

  const email = (data.email || '').trim();
  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return 'there';
};

const buildEmail = (data) => {
  const firstName = getFirstName(data);

  return {
    subject: 'Your trial ended. Pick back up for $29.99/month',
    previewText: 'Your setup window closed, but the fastest path back in is still open.',
    body: `Hi ${firstName},

Your trial window ended, but the next move is still simple.

For $29.99/month, you can get back into AI Integration Course and keep building with:

- The guided implementation library
- The AI tutor for fast technical answers
- Practical workflow lessons built for real business use
- A clear path from setup to a working automation

If you are serious about getting one useful AI workflow live, restart here:
${CAMPAIGN_LINK}

The fastest path to value is still the same:
pick your plan, get back in, and finish one real build.

— AI Integration Course`,
    html: `
      <p>Hi ${firstName},</p>
      <p>Your trial window ended, but the next move is still simple.</p>
      <p>For <strong>$29.99/month</strong>, you can get back into AI Integration Course and keep building with:</p>
      <ul>
        <li>The guided implementation library</li>
        <li>The AI tutor for fast technical answers</li>
        <li>Practical workflow lessons built for real business use</li>
        <li>A clear path from setup to a working automation</li>
      </ul>
      <p>If you are serious about getting one useful AI workflow live, restart here:</p>
      <p><a href="${CAMPAIGN_LINK}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Restart Your Access</a></p>
      <p>The fastest path to value is still the same: pick your plan, get back in, and finish one real build.</p>
      <p>— AI Integration Course</p>
    `,
  };
};

function buildDedupeKey(uid) {
  return `trial_expired_offer:${uid}:${CAMPAIGN_ID}`;
}

function buildQueueDocId(dedupeKey) {
  return `email_${crypto.createHash('sha256').update(dedupeKey).digest('hex').slice(0, 40)}`;
}

const isEligible = ({ authUser, profile, now }) => {
  const email = (authUser.email || profile?.email || '').trim();
  if (!email || profile?.premium === true) {
    return false;
  }

  if (profile?.isAdmin === true || profile?.role === 'admin') {
    return false;
  }

  if (profile?.subscriptionTier === 'founding') {
    return false;
  }

  if (profile?.marketingEmailSent && profile.marketingEmailSent[CAMPAIGN_ID]) {
    return false;
  }

  const createdAt = authUser.metadata?.creationTime
    ? new Date(authUser.metadata.creationTime)
    : null;

  if (!createdAt) {
    return false;
  }

  return now.getTime() - createdAt.getTime() >= SEVEN_DAYS_MS;
};

async function listAllAuthUsers() {
  const users = [];
  let nextPageToken;

  do {
    const page = await admin.auth().listUsers(1000, nextPageToken);
    users.push(...page.users);
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  return users;
}

async function main() {
  const now = new Date();
  const authUsers = await listAllAuthUsers();

  let eligible = 0;
  let queued = 0;
  let skipped = 0;
  let ops = 0;
  let batch = db.batch();

  for (const authUser of authUsers) {
    const userRef = db.doc(`users/${authUser.uid}`);
    const userSnap = await userRef.get();
    const profile = userSnap.exists ? userSnap.data() : {};

    if (!isEligible({ authUser, profile, now })) {
      skipped += 1;
      continue;
    }

    eligible += 1;
    const email = buildEmail({
      ...profile,
      email: authUser.email || profile?.email || '',
      displayName: authUser.displayName || profile?.displayName || '',
    });

    if (!dryRun) {
      const dedupeKey = buildDedupeKey(authUser.uid);
      const queueRef = db.collection('email_queue').doc(buildQueueDocId(dedupeKey));
      batch.set(queueRef, {
        to: authUser.email || profile?.email,
        from: 'AI Integration Course <Info@aiintegrationcourse.com>',
        replyTo: 'Info@aiintegrationcourse.com',
        subject: email.subject,
        previewText: email.previewText,
        body: email.body,
        html: email.html,
        userId: authUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'marketing_reactivation',
        campaignId: CAMPAIGN_ID,
        templateVersion: TEMPLATE_VERSION,
        dedupeKey,
        meta: {
          trigger: 'manual_trial_expired_backfill',
        },
        attemptCount: 0,
        scheduledFor: null,
      });

      batch.set(userRef, {
        email: authUser.email || profile?.email || null,
        displayName: authUser.displayName || profile?.displayName || null,
        marketingEmailSent: {
          [CAMPAIGN_ID]: admin.firestore.FieldValue.serverTimestamp(),
        },
        lastMarketingCampaignId: CAMPAIGN_ID,
        lastMarketingQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      ops += 2;
      queued += 1;

      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (!dryRun && ops > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({
    campaignId: CAMPAIGN_ID,
    dryRun,
    totalUsers: authUsers.length,
    eligible,
    queued: dryRun ? 0 : queued,
    skipped,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
