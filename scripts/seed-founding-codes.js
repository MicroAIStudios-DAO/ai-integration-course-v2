/**
 * Seed founding member access codes (14 total).
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/seed-founding-codes.js
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();

const codes = [
  'FOUNDING-A1B2',
  'FOUNDING-C3D4',
  'FOUNDING-E5F6',
  'FOUNDING-G7H8',
  'FOUNDING-J9K1',
  'FOUNDING-L2M3',
  'FOUNDING-N4P5',
  'FOUNDING-Q6R7',
  'FOUNDING-S8T9',
  'FOUNDING-U1V2',
  'FOUNDING-W3X4',
  'FOUNDING-Y5Z6',
  'FOUNDING-7H8J',
  'FOUNDING-9K1L',
];

async function main() {
  const batch = db.batch();
  const ref = db.collection('founding_codes');
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  codes.forEach((code) => {
    batch.set(
      ref.doc(code),
      {
        code,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
      },
      { merge: true }
    );
  });
  await batch.commit();
  console.log('Seeded founding codes:', codes.join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed codes:', err);
    process.exit(1);
  });
