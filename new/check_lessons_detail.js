const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkLessons() {
  console.log('=== Checking Lesson Structure ===\n');
  
  const lessonsRef = db.collection('courses/course_01_id/modules/module_01_id/lessons');
  const lessons = await lessonsRef.limit(3).get();
  
  console.log(`Found ${lessons.size} lessons (showing first 3)\n`);
  
  lessons.forEach(doc => {
    const data = doc.data();
    console.log(`Lesson ID: ${doc.id}`);
    console.log(`  title: ${data.title || 'N/A'}`);
    console.log(`  tier: ${data.tier || 'NOT SET ❌'}`);
    console.log(`  isPremium: ${data.isPremium !== undefined ? data.isPremium : 'NOT SET ❌'}`);
    console.log(`  order: ${data.order || 'N/A'}`);
    console.log(`  Fields: ${Object.keys(data).join(', ')}`);
    console.log('');
  });
  
  // Count total lessons
  const allLessons = await lessonsRef.get();
  console.log(`\nTotal lessons in module_01_id: ${allLessons.size}`);
  
  // Check other modules
  console.log('\n=== Checking All Modules ===\n');
  const modules = await db.collection('courses/course_01_id/modules').get();
  console.log(`Found ${modules.size} modules:\n`);
  
  for (const mod of modules.docs) {
    const modData = mod.data();
    const modLessons = await db.collection(`courses/course_01_id/modules/${mod.id}/lessons`).get();
    console.log(`Module: ${mod.id}`);
    console.log(`  title: ${modData.title || 'N/A'}`);
    console.log(`  lessons: ${modLessons.size}`);
  }
}

checkLessons()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
