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
  const ref = db.collection('founding_codes');
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date('2099-12-31T23:59:59.000Z'));

  for (const code of codes) {
    const docRef = ref.doc(code);
    const snap = await docRef.get();
    const data = snap.data() || {};
    const used = Boolean(data.usedBy);

    await docRef.set(
      {
        code,
        expiresAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(snap.exists
          ? {}
          : {
              active: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'available',
            }),
        ...(used ? {} : { active: true, status: 'available' }),
      },
      { merge: true }
    );
  }

  console.log('Seeded founding codes:', codes.join(', '));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed codes:', err);
    process.exit(1);
  });
