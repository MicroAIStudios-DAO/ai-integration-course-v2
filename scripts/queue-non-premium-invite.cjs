#!/usr/bin/env node

const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'ai-integra-course-v2' });
}

const db = admin.firestore();

const CAMPAIGN_ID = 'non_premium_join_invite_v2_20260410';
const CAMPAIGN_LINK = 'https://aiintegrationcourse.com/pricing?utm_source=join_invite&utm_medium=email&utm_campaign=non_premium_join_invite_v2_20260410';
const TEMPLATE_VERSION = 'v2';
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
    subject: 'Special offer for you 65% off Join now for $19.99/month',
    previewText: 'This is the lowest-friction way back into the full AI Architect path.',
    body: `Hi ${firstName},

You are closer than you think to getting a real AI workflow live.

For a limited window, you can join Pro AI Architect at the annual rate that works out to just $19.99/month.

What you get:

- The full AI Architect curriculum
- The AI tutor for fast technical answers while you build
- Guided implementation lessons focused on real workflows
- A structured path from setup to your first working automation

If you have been waiting for the right time, this is it.

Claim the offer here:
${CAMPAIGN_LINK}

The fastest path to value is still simple:
pick your plan, start your access, and finish one real build.

Start here now:
${CAMPAIGN_LINK}

— AI Integration Course`,
    html: `
      <p>Hi ${firstName},</p>
      <p>You are closer than you think to getting a real AI workflow live.</p>
      <p>For a limited window, you can join <strong>Pro AI Architect</strong> at the annual rate that works out to just <strong>$19.99/month</strong>.</p>
      <p><strong>What you get:</strong></p>
      <ul>
        <li>The full AI Architect curriculum</li>
        <li>The AI tutor for fast technical answers while you build</li>
        <li>Guided implementation lessons focused on real workflows</li>
        <li>A structured path from setup to your first working automation</li>
      </ul>
      <p>If you have been waiting for the right time, this is it.</p>
      <p><a href="${CAMPAIGN_LINK}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Claim the $19.99/month Offer</a></p>
      <p>The fastest path to value is still simple: pick your plan, start your access, and finish one real build.</p>
      <p>— AI Integration Course</p>
    `,
  };
}

function buildDedupeKey(uid) {
  return `marketing_join_invite:${uid}:${CAMPAIGN_ID}`;
}

function buildQueueDocId(dedupeKey) {
  return `email_${crypto.createHash('sha256').update(dedupeKey).digest('hex').slice(0, 40)}`;
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
      const dedupeKey = buildDedupeKey(authUser.uid);
      const queueRef = db.collection('email_queue').doc(buildQueueDocId(dedupeKey));

      batch.set(queueRef, {
        to: email,
        from: 'AI Integration Course <Info@aiintegrationcourse.com>',
        replyTo: 'Info@aiintegrationcourse.com',
        subject: emailData.subject,
        previewText: emailData.previewText,
        body: emailData.body,
        html: emailData.html,
        userId: authUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        type: 'marketing_join_invite',
        campaignId: CAMPAIGN_ID,
        templateVersion: TEMPLATE_VERSION,
        dedupeKey,
        meta: {
          offerType: 'annual_1999_month_equivalent',
        },
        attemptCount: 0,
        scheduledFor: null,
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
