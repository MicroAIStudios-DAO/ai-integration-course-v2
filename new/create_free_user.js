const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function createFreeUser() {
  console.log('=== Creating Test Free User Account ===\n');
  
  const testEmail = 'test.freeuser@aiintegration.com';
  const testPassword = 'TestFreeUser2024!';
  
  try {
    // Step 1: Create user in Firebase Authentication
    console.log('Step 1: Creating user in Firebase Auth...');
    let user;
    try {
      user = await auth.createUser({
        email: testEmail,
        password: testPassword,
        displayName: 'Test Free User',
        emailVerified: true
      });
      console.log(`✅ User created with UID: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  User already exists, fetching existing user...');
        user = await auth.getUserByEmail(testEmail);
        console.log(`✅ Found existing user with UID: ${user.uid}`);
      } else {
        throw error;
      }
    }
    
    // Step 2: Create user document in Firestore WITHOUT subscription
    console.log('\nStep 2: Creating user document in Firestore...');
    await db.collection('users').doc(user.uid).set({
      email: testEmail,
      displayName: 'Test Free User',
      isSubscribed: false,
      subscriptionActive: false,
      activeTrial: false,
      isAdmin: false,
      role: 'user',
      subscriptionTier: 'free',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    console.log('✅ User document created in Firestore');
    
    // Step 3: Set custom claims (no subscription)
    console.log('\nStep 3: Setting custom claims...');
    await auth.setCustomUserClaims(user.uid, {
      subscriptionActive: false,
      subscriber: false
    });
    console.log('✅ Custom claims set');
    
    console.log('\n=== Test Free User Account Created! ===\n');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 UID:', user.uid);
    console.log('🆓 Subscription: None (Free Tier)');
    console.log('\n✅ This account can ONLY access FREE lessons!');
    console.log('❌ Premium lessons will show "Login to access" or be blocked');
    console.log('\nLogin at: https://ai-integra-course-v2.web.app/login');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

createFreeUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
