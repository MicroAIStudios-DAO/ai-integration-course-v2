#!/usr/bin/env -S node -r ts-node/register
/**
 * Grants Firebase Auth custom claim { admin: true } to a user by email.
 * Usage: ts-node scripts/grant_admin.ts livetrue2u@gmail.com
 * Requires GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`.
 */
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Usage: grant_admin.ts <email>'); process.exit(1); }
  const user = await admin.auth().getUserByEmail(email);
  const existing = user.customClaims || {};
  await admin.auth().setCustomUserClaims(user.uid, { ...existing, admin: true, subscriptionActive: true });
  console.log(`Granted admin + subscriptionActive claims to ${email} (uid=${user.uid})`);
}

main().catch(e => { console.error(e?.message || e); process.exit(1); });

