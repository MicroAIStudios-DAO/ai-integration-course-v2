const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFreeUser() {
  const usersSnapshot = await db.collection('users').where('email', '==', 'test.freeuser@aiintegration.com').get();
  
  if (usersSnapshot.empty) {
    console.log('Free user not found in Firestore');
    return;
  }
  
  usersSnapshot.forEach(doc => {
    console.log('Free user ID:', doc.id);
    console.log('Free user data:', JSON.stringify(doc.data(), null, 2));
  });
}

checkFreeUser().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
