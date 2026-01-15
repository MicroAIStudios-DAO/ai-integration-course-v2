const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkNested() {
  console.log('=== Checking Course Structure ===\n');
  
  const course = await db.collection('courses').doc('course_01_id').get();
  console.log('Course exists:', course.exists);
  console.log('Course data:', course.data());
  
  console.log('\n=== Modules ===');
  const modules = await db.collection('courses/course_01_id/modules').get();
  console.log(`Found ${modules.size} modules`);
  
  for (const mod of modules.docs) {
    console.log(`\nModule: ${mod.id}`);
    console.log(JSON.stringify(mod.data(), null, 2));
    
    const lessons = await db.collection(`courses/course_01_id/modules/${mod.id}/lessons`).get();
    console.log(`  Lessons: ${lessons.size}`);
    
    lessons.docs.slice(0, 2).forEach(lesson => {
      console.log(`    - ${lesson.id}: ${lesson.data().title || 'No title'} (tier: ${lesson.data().tier || 'not set'})`);
    });
  }
}

checkNested()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
