#!/usr/bin/env node

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'ai-integra-course-v2' });
}

const db = admin.firestore();

const CAMPAIGN_ID = 'non_premium_join_invite_20260408';
const CAMPAIGN_LINK = 'https://aiintegrationcourse.com/pricing?utm_source=join_invite&utm_medium=email&utm_campaign=non_premium_join_invite_20260408';
const dryRun = process.argv.includes('--dry-run');

function getFirstName({ displayName, email }) {
  const cleanDisplayName = (displayName || '').trim();
  if (cleanDisplayName) {
    return cleanDisplayName.split(' ')[0];
  }

  const cleanEmail = (email || '').trim();
  if (cleanEmail.includes('@')) {
    return cleanEmail.split('@')[0];
  }

  return 'there';
}

function buildEmail({ displayName, email }) {
  const firstName = getFirstName({ displayName, email });

  return {
    subject: 'Ready to build with AI? Join now for $29.99/month',
    body: `Hi ${firstName},

You are closer than you think to getting a real AI workflow live.

AI Integration Course is built to help you move from curiosity to implementation with:

- A practical premium curriculum
- The AI tutor for fast answers while you build
- Guided lessons focused on real-world workflows
- A 7-day trial to get momentum before the first charge

If you have been meaning to start, this is the moment.

Join now for $29.99/month:
${CAMPAIGN_LINK}

The fastest way to get value is simple:
pick your plan, start your trial, and build your first working workflow.

Start here:
${CAMPAIGN_LINK}

The AI Integration Course Team`,
  };
}

function hasPremiumAccess(profile) {
  if (!profile) return false;

  const subscriptionStatus = (profile.subscriptionStatus || 'none').toString().toLowerCase();

  return (
    profile.premium === true ||
    profile.foundingMember === true ||
    profile.subscriptionTier === 'founding' ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing'
  );
}

function isEligible({ authUser, profile }) {
  const email = (authUser.email || profile?.email || '').trim();
  if (!email) {
    return false;
  }

  if (profile?.isAdmin === true || profile?.role === 'admin') {
    return false;
  }

  if (hasPremiumAccess(profile)) {
    return false;
  }

  if (profile?.marketingEmailSent && profile.marketingEmailSent[CAMPAIGN_ID]) {
    return false;
  }

  return true;
}

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
  const authUsers = await listAllAuthUsers();

  let totalWithEmail = 0;
  let eligible = 0;
  let premium = 0;
  let adminOrFounding = 0;
  let alreadyQueued = 0;
  let missingEmail = 0;
  let queued = 0;
  let ops = 0;
  let batch = db.batch();

  for (const authUser of authUsers) {
    const userRef = db.doc(`users/${authUser.uid}`);
    const userSnap = await userRef.get();
    const profile = userSnap.exists ? userSnap.data() : {};
    const email = (authUser.email || profile?.email || '').trim();

    if (!email) {
      missingEmail += 1;
      continue;
    }

    totalWithEmail += 1;

    if (profile?.isAdmin === true || profile?.role === 'admin' || profile?.subscriptionTier === 'founding' || profile?.foundingMember === true) {
      adminOrFounding += 1;
      continue;
    }

    if (hasPremiumAccess(profile)) {
      premium += 1;
      continue;
    }

    if (profile?.marketingEmailSent && profile.marketingEmailSent[CAMPAIGN_ID]) {
      alreadyQueued += 1;
      continue;
    }

    if (!isEligible({ authUser, profile })) {
      continue;
    }

    eligible += 1;
    const emailData = buildEmail({
      email,
      displayName: authUser.displayName || profile?.displayName || '',
    });

    if (!dryRun) {
      const queueRef = db.collection('email_queue').doc();

      batch.set(queueRef, {
        to: email,
        subject: emailData.subject,
        body: emailData.body,
        userId: authUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'marketing_join_invite',
        campaignId: CAMPAIGN_ID,
      });

      batch.set(userRef, {
        email,
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
    totalWithEmail,
    eligibleNonPremium: eligible,
    premiumOrTrialing: premium,
    adminOrFounding,
    alreadyQueuedForCampaign: alreadyQueued,
    missingEmail,
    queued: dryRun ? 0 : queued,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
