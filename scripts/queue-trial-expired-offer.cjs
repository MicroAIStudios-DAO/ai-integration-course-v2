#!/usr/bin/env node

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'ai-integra-course-v2' });
}

const db = admin.firestore();

const CAMPAIGN_ID = 'trial_expired_offer_20260408';
const CAMPAIGN_LINK = 'https://aiintegrationcourse.com/pricing?utm_source=reactivation_email&utm_medium=email&utm_campaign=trial_expired_offer_20260408';
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
    subject: 'Your AI trial ended. Restart today for just $29.99/month',
    body: `Hi ${firstName},

Your free access window has ended, but your next step is simple.

For just $29.99/month, you can get back into AI Integration Course and keep building with:

- Full premium curriculum access
- The AI tutor for fast answers while you build
- Guided implementation lessons built around real workflows
- A 7-day trial that starts after secure checkout with your card on file

If you are serious about getting one AI workflow live, act now:
${CAMPAIGN_LINK}

This is the fastest path from "I signed up" to "I shipped something real."

If you want the easiest on-ramp, start with Explorer at $29.99/month and cancel before the first charge if it is not right for you.

Act now and get back in:
${CAMPAIGN_LINK}

The AI Integration Course Team`,
  };
};

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
      const queueRef = db.collection('email_queue').doc();
      batch.set(queueRef, {
        to: authUser.email || profile?.email,
        subject: email.subject,
        body: email.body,
        userId: authUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'marketing_reactivation',
        campaignId: CAMPAIGN_ID,
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
