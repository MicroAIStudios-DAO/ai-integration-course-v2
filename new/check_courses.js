const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/ai-integration-course/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkCourses() {
  console.log('=== Checking Firestore Data ===\n');
  
  // List all collections
  const collections = await db.listCollections();
  console.log('Collections:', collections.map(c => c.id).join(', '));
  
  // Check courses
  console.log('\n=== Courses Collection ===');
  const coursesSnap = await db.collection('courses').get();
  console.log(`Found ${coursesSnap.size} courses`);
  
  if (coursesSnap.empty) {
    console.log('❌ No courses found in database!');
  } else {
    coursesSnap.forEach(doc => {
      console.log(`\nCourse: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
  
  // Check lessons
  console.log('\n=== Lessons Collection ===');
  const lessonsSnap = await db.collection('lessons').get();
  console.log(`Found ${lessonsSnap.size} lessons`);
  
  if (!lessonsSnap.empty) {
    lessonsSnap.docs.slice(0, 2).forEach(doc => {
      console.log(`\nLesson: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}

checkCourses()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
