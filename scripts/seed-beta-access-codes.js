/**
 * Seed cohort and scholarship beta access codes.
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
    cohort: 'Pioneer',
    maxUses: 20,
    grantPremium: false,
    description: 'Primary founding cohort code with a 20-seat cap.',
  },
  {
    code: 'SCHOLAR-7K2M',
    cohort: 'Pioneer',
    maxUses: 1,
    grantPremium: true,
    description: 'Scholarship code for invited builders without a credit card.',
  },
  {
    code: 'SCHOLAR-4Q8R',
    cohort: 'Pioneer',
    maxUses: 1,
    grantPremium: true,
    description: 'Scholarship code for invited builders without a credit card.',
  },
  {
    code: 'SCHOLAR-9V3X',
    cohort: 'Pioneer',
    maxUses: 1,
    grantPremium: true,
    description: 'Scholarship code for invited builders without a credit card.',
  },
  {
    code: 'SCHOLAR-2L7N',
    cohort: 'Pioneer',
    maxUses: 1,
    grantPremium: true,
    description: 'Scholarship code for invited builders without a credit card.',
  },
  {
    code: 'SCHOLAR-6T5P',
    cohort: 'Pioneer',
    maxUses: 1,
    grantPremium: true,
    description: 'Scholarship code for invited builders without a credit card.',
  },
];

async function main() {
  const batch = db.batch();

  for (const entry of codes) {
    batch.set(
      ref.doc(entry.code),
      {
        ...entry,
        active: true,
        usesCount: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log('Seeded beta access codes:');
  codes.forEach((entry) => {
    console.log(`- ${entry.code} | premium=${entry.grantPremium} | maxUses=${entry.maxUses}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed beta access codes:', err);
    process.exit(1);
  });
