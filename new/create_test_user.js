const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function createTestUser() {
  console.log('=== Creating Test Subscriber Account ===\n');
  
  const testEmail = 'test.subscriber@aiintegration.com';
  const testPassword = 'TestSubscriber2024!';
  
  try {
    // Step 1: Create user in Firebase Authentication
    console.log('Step 1: Creating user in Firebase Auth...');
    let user;
    try {
      user = await auth.createUser({
        email: testEmail,
        password: testPassword,
        displayName: 'Test Subscriber',
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
    
    // Step 2: Create user document in Firestore with subscription
    console.log('\nStep 2: Creating user document in Firestore...');
    await db.collection('users').doc(user.uid).set({
      email: testEmail,
      displayName: 'Test Subscriber',
      isSubscribed: true,
      subscriptionActive: true,
      activeTrial: false,
      isAdmin: false,
      role: 'subscriber',
      subscriptionTier: 'premium',
      subscriptionStartDate: admin.firestore.Timestamp.now(),
      subscriptionEndDate: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      ),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    console.log('✅ User document created in Firestore');
    
    // Step 3: Set custom claims for faster access checks
    console.log('\nStep 3: Setting custom claims...');
    await auth.setCustomUserClaims(user.uid, {
      subscriptionActive: true,
      subscriber: true
    });
    console.log('✅ Custom claims set');
    
    console.log('\n=== Test Subscriber Account Created! ===\n');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 UID:', user.uid);
    console.log('💎 Subscription: Active (Premium)');
    console.log('📅 Valid until:', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString());
    console.log('\n✅ This account can access ALL premium lessons!');
    console.log('\nLogin at: https://ai-integra-course-v2.web.app/login');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

createTestUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
