const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixFreeUser() {
  try {
    // Get user by email from Authentication
    const user = await admin.auth().getUserByEmail('test.freeuser@aiintegration.com');
    console.log('Free user found in Auth:', user.uid);
    
    // Check if Firestore document exists
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      console.log('Firestore document missing. Creating...');
      await db.collection('users').doc(user.uid).set({
        email: 'test.freeuser@aiintegration.com',
        displayName: 'Test Free User',
        isSubscribed: false,
        subscriptionActive: false,
        activeTrial: false,
        role: 'user',
        subscriptionTier: 'free',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Firestore document created');
    } else {
      console.log('Firestore document exists:', userDoc.data());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixFreeUser().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
