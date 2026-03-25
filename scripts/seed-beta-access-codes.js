/**
 * Seed cohort and scholarship access codes.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/seed-beta-access-codes.js
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();
const ref = db.collection('beta_access_codes');

const codes = [
  {
    code: 'PIONEER',
    accessType: 'beta',
    accessSource: 'paid_beta_code',
    cohort: 'Pioneer',
    maxUses: 20,
    grantPremium: false,
    checkoutPlanKey: 'beta_monthly',
    priceCents: 2999,
    description: 'Primary paid beta cohort code with a 20-seat cap.',
  },
  {
    code: 'SCHOLAR-7K2M',
    accessType: 'scholarship',
    accessSource: 'scholarship_code',
    maxUses: 1,
    grantPremium: true,
    description: 'Private scholarship code for invited builders.',
  },
  {
    code: 'SCHOLAR-4Q8R',
    accessType: 'scholarship',
    accessSource: 'scholarship_code',
    maxUses: 1,
    grantPremium: true,
    description: 'Private scholarship code for invited builders.',
  },
  {
    code: 'SCHOLAR-9V3X',
    accessType: 'scholarship',
    accessSource: 'scholarship_code',
    maxUses: 1,
    grantPremium: true,
    description: 'Private scholarship code for invited builders.',
  },
  {
    code: 'SCHOLAR-2L7N',
    accessType: 'scholarship',
    accessSource: 'scholarship_code',
    maxUses: 1,
    grantPremium: true,
    description: 'Private scholarship code for invited builders.',
  },
  {
    code: 'SCHOLAR-6T5P',
    accessType: 'scholarship',
    accessSource: 'scholarship_code',
    maxUses: 1,
    grantPremium: true,
    description: 'Private scholarship code for invited builders.',
  },
];

async function main() {
  for (const entry of codes) {
    const docRef = ref.doc(entry.code);
    const snap = await docRef.get();
    const isScholarship = entry.accessType === 'scholarship';

    await docRef.set(
      {
        code: entry.code,
        accessType: entry.accessType,
        accessSource: entry.accessSource,
        grantPremium: entry.grantPremium,
        maxUses: entry.maxUses,
        description: entry.description,
        active: true,
        ...(isScholarship
          ? {
              cohort: admin.firestore.FieldValue.delete(),
              checkoutPlanKey: admin.firestore.FieldValue.delete(),
              priceCents: admin.firestore.FieldValue.delete(),
            }
          : {
              cohort: entry.cohort,
              checkoutPlanKey: entry.checkoutPlanKey,
              priceCents: entry.priceCents,
            }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(snap.exists
          ? {}
          : {
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              usesCount: 0,
            }),
      },
      { merge: true }
    );
  }
  console.log('Seeded beta access codes:');
  codes.forEach((entry) => {
    console.log(
      `- ${entry.code} | type=${entry.accessType} | premium=${entry.grantPremium} | maxUses=${entry.maxUses}`
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed beta access codes:', err);
    process.exit(1);
  });
