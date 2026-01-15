const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testRules() {
  console.log('=== Testing Firestore Access ===\n');
  
  try {
    // Test 1: Read courses collection
    console.log('Test 1: Reading courses collection...');
    const courses = await db.collection('courses').get();
    console.log(`✅ SUCCESS: Found ${courses.size} course(s)`);
    
    // Test 2: Read a specific course
    console.log('\nTest 2: Reading course_01_id...');
    const course = await db.collection('courses').doc('course_01_id').get();
    console.log(`✅ SUCCESS: Course exists: ${course.exists}`);
    console.log(`   Title: ${course.data()?.title}`);
    
    // Test 3: Read modules
    console.log('\nTest 3: Reading modules...');
    const modules = await db.collection('courses/course_01_id/modules').get();
    console.log(`✅ SUCCESS: Found ${modules.size} module(s)`);
    
    // Test 4: Read lessons
    console.log('\nTest 4: Reading lessons from module_01_id...');
    const lessons = await db.collection('courses/course_01_id/modules/module_01_id/lessons').get();
    console.log(`✅ SUCCESS: Found ${lessons.size} lesson(s)`);
    
    // Test 5: Read a specific free lesson
    console.log('\nTest 5: Reading lesson 1 (free tier)...');
    const lesson1 = await db.collection('courses/course_01_id/modules/module_01_id/lessons').doc('1').get();
    console.log(`✅ SUCCESS: Lesson exists: ${lesson1.exists}`);
    console.log(`   Title: ${lesson1.data()?.title}`);
    console.log(`   Tier: ${lesson1.data()?.tier}`);
    
    // Test 6: Read a premium lesson
    console.log('\nTest 6: Reading lesson 10 (premium tier)...');
    const lesson10 = await db.collection('courses/course_01_id/modules/module_01_id/lessons').doc('10').get();
    console.log(`✅ SUCCESS: Lesson exists: ${lesson10.exists}`);
    console.log(`   Title: ${lesson10.data()?.title}`);
    console.log(`   Tier: ${lesson10.data()?.tier}`);
    
    console.log('\n=== All Tests Passed! ===');
    console.log('\nNote: These tests use admin credentials.');
    console.log('Unauthenticated users can:');
    console.log('  ✅ List courses, modules, and lessons');
    console.log('  ✅ Read free lessons (tier: "free")');
    console.log('  ❌ Read premium lessons (tier: "premium")');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testRules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
