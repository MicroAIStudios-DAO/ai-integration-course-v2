const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyUsers() {
  console.log('=== Verifying Test User Accounts ===\n');
  
  const freeUserUid = '8h8fgmr982SLPDcG7T2zedKT5uf1';
  const subscriberUid = 'k6MgkCcp2nexmDfcAL7wDDxFeID2';
  
  try {
    // Check free user
    console.log('1. Free User Account:');
    const freeUserDoc = await db.collection('users').doc(freeUserUid).get();
    if (freeUserDoc.exists) {
      const data = freeUserDoc.data();
      console.log('   Email:', data.email);
      console.log('   isSubscribed:', data.isSubscribed);
      console.log('   subscriptionActive:', data.subscriptionActive);
      console.log('   activeTrial:', data.activeTrial);
      console.log('   role:', data.role);
      console.log('   ✅ Should only access FREE lessons\n');
    }
    
    // Check subscriber
    console.log('2. Subscriber Account:');
    const subscriberDoc = await db.collection('users').doc(subscriberUid).get();
    if (subscriberDoc.exists) {
      const data = subscriberDoc.data();
      console.log('   Email:', data.email);
      console.log('   isSubscribed:', data.isSubscribed);
      console.log('   subscriptionActive:', data.subscriptionActive);
      console.log('   activeTrial:', data.activeTrial);
      console.log('   role:', data.role);
      console.log('   ✅ Should access ALL lessons\n');
    }
    
    console.log('=== Verification Complete ===');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
