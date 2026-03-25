/**
 * Convert legacy free beta testers into the paid beta model.
 *
 * Dry run:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/migrate-beta-testers-to-paid.js
 *
 * Apply:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/migrate-beta-testers-to-paid.js --apply
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();
const APPLY = process.argv.includes('--apply');

const hasLivePaidAccess = (user) => {
  const subscriptionStatus = (user.subscriptionStatus || 'none').toString();
  return (
    Boolean(user.scholarshipAccessCode) ||
    Boolean(user.betaScholarshipCode) ||
    user.foundingMember === true ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing'
  );
};

async function main() {
  const snapshot = await db.collection('users').where('isBetaTester', '==', true).get();
  console.log(`Found ${snapshot.size} beta tester account(s).`);

  let updates = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const keepPaid = hasLivePaidAccess(data);
    const isScholarshipRecipient = Boolean(data.scholarshipAccessCode) || Boolean(data.betaScholarshipCode);
    const update = {
      ...(isScholarshipRecipient
        ? {
            isBetaTester: false,
            premium: true,
            scholarshipAccessCode: data.scholarshipAccessCode || data.betaScholarshipCode,
            scholarshipGrantedAt:
              data.scholarshipGrantedAt || data.betaScholarshipGrantedAt || null,
            scholarshipAccessSource: data.scholarshipAccessSource || 'scholarship_code',
            betaCohort: admin.firestore.FieldValue.delete(),
            betaAccessSource: admin.firestore.FieldValue.delete(),
            betaAccessCode: admin.firestore.FieldValue.delete(),
            betaPlanKey: admin.firestore.FieldValue.delete(),
            betaPriceCents: admin.firestore.FieldValue.delete(),
            betaProgramStatus: admin.firestore.FieldValue.delete(),
            betaSignupDate: admin.firestore.FieldValue.delete(),
            betaScholarshipCode: admin.firestore.FieldValue.delete(),
            betaScholarshipGrantedAt: admin.firestore.FieldValue.delete(),
          }
        : {
            betaPlanKey: data.betaPlanKey || 'beta_monthly',
            betaPriceCents: data.betaPriceCents || 2999,
            betaProgramStatus: keepPaid ? 'active' : 'awaiting_checkout',
            betaAccessSource: data.betaAccessSource || 'paid_beta_code',
            premium: keepPaid ? data.premium === true : false,
            subscriptionStatus: keepPaid ? (data.subscriptionStatus || 'active') : 'none',
            ...(data.betaScholarshipCode
              ? {}
              : {
                  betaScholarshipCode: admin.firestore.FieldValue.delete(),
                  betaScholarshipGrantedAt: admin.firestore.FieldValue.delete(),
                }),
          }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (APPLY) {
      await doc.ref.set(update, { merge: true });
    }

    updates += 1;
    console.log(`[${APPLY ? 'apply' : 'dry-run'}] ${doc.id} -> ${keepPaid ? 'keep paid access' : 'require checkout'}`);
  }

  console.log(`${APPLY ? 'Applied' : 'Prepared'} ${updates} beta tester update(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to migrate beta testers:', error);
    process.exit(1);
  });
