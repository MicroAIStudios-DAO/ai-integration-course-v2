#!/usr/bin/env node
// Grants Firebase Auth custom claim { admin: true, subscriptionActive: true } to a user by email.
// Usage: node scripts/grant_admin.cjs livetrue2u@gmail.com

const admin = require('firebase-admin');
try { admin.initializeApp(); } catch {}

async function main(){
  const email = process.argv[2];
  if(!email){ console.error('Usage: node scripts/grant_admin.cjs <email>'); process.exit(1); }
  const user = await admin.auth().getUserByEmail(email);
  const claims = Object.assign({}, user.customClaims || {}, { admin: true, subscriptionActive: true });
  await admin.auth().setCustomUserClaims(user.uid, claims);
  // Also mirror to Firestore user profile for UI gating
  try {
    const db = admin.firestore();
    await db.doc(`users/${user.uid}`).set({ isAdmin: true, role: 'admin', isSubscribed: true }, { merge: true });
  } catch {}
  console.log(`Granted admin+subscriptionActive to ${email} (uid=${user.uid}) and updated users profile`);
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });
