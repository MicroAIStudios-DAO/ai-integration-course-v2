const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkLessonFields() {
  const lesson1 = await db.collection('courses').doc('course_01_id')
    .collection('modules').doc('module_01_id')
    .collection('lessons').doc('1').get();
  
  console.log('Lesson 1 data:', JSON.stringify(lesson1.data(), null, 2));
}

checkLessonFields().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
