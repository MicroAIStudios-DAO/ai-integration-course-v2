/**
 * Script to add "Build Your First Bot" lesson to Firestore
 * Run with: node scripts/add-bot-lesson.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with application default credentials
// This works because we're authenticated via Firebase CLI
admin.initializeApp({
  projectId: 'ai-integra-course-v2',
});

const db = admin.firestore();

async function listCoursesAndModules() {
  console.log('=== Listing Courses and Modules ===\n');
  
  const coursesSnap = await db.collection('courses').get();
  console.log(`Found ${coursesSnap.size} courses\n`);
  
  for (const courseDoc of coursesSnap.docs) {
    const courseData = courseDoc.data();
    console.log(`Course: ${courseDoc.id}`);
    console.log(`  Title: ${courseData.title || 'N/A'}`);
    
    const modulesSnap = await db.collection('courses').doc(courseDoc.id).collection('modules').orderBy('order').get();
    console.log(`  Modules: ${modulesSnap.size}`);
    
    for (const moduleDoc of modulesSnap.docs) {
      const moduleData = moduleDoc.data();
      const lessonsSnap = await db.collection('courses').doc(courseDoc.id).collection('modules').doc(moduleDoc.id).collection('lessons').orderBy('order').get();
      
      console.log(`    Module: ${moduleDoc.id}`);
      console.log(`      Title: ${moduleData.title || 'N/A'}`);
      console.log(`      Order: ${moduleData.order || 'N/A'}`);
      console.log(`      Lessons: ${lessonsSnap.size}`);
      
      lessonsSnap.docs.forEach(lessonDoc => {
        const lessonData = lessonDoc.data();
        console.log(`        - ${lessonDoc.id}: ${lessonData.title} (order: ${lessonData.order})`);
      });
    }
    console.log('');
  }
}

async function addBotLesson() {
  // Read the markdown content
  const markdownPath = path.join(__dirname, '../lessons/premium/build-your-first-bot.md');
  const content = fs.readFileSync(markdownPath, 'utf8');
  
  // First, list courses to find the correct IDs
  console.log('=== Finding Course and Module IDs ===\n');
  
  const coursesSnap = await db.collection('courses').get();
  
  if (coursesSnap.empty) {
    console.log('No courses found! Creating default course structure...');
    // Create default course if none exists
    await db.collection('courses').doc('course_01_id').set({
      title: 'AI Integration Fundamentals',
      description: 'Learn to integrate AI into your business',
      order: 1,
    });
    await db.collection('courses').doc('course_01_id').collection('modules').doc('module_01_id').set({
      title: 'Module 1: Getting Started with AI',
      description: 'Introduction to AI integration',
      order: 1,
    });
  }
  
  // Use the first course and first module
  let courseId = 'course_01_id';
  let moduleId = 'module_01_id';
  
  // Try to find existing course/module
  for (const courseDoc of coursesSnap.docs) {
    courseId = courseDoc.id;
    const modulesSnap = await db.collection('courses').doc(courseId).collection('modules').orderBy('order').limit(1).get();
    if (!modulesSnap.empty) {
      moduleId = modulesSnap.docs[0].id;
      break;
    }
  }
  
  console.log(`Using Course: ${courseId}`);
  console.log(`Using Module: ${moduleId}`);
  
  // Check existing lessons to determine order
  const lessonsSnap = await db.collection('courses').doc(courseId).collection('modules').doc(moduleId).collection('lessons').orderBy('order', 'desc').limit(1).get();
  
  let maxOrder = 5;
  if (!lessonsSnap.empty) {
    maxOrder = lessonsSnap.docs[0].data().order || 5;
  }
  
  // Add the lesson with order 5.5 (will be 5.5 or next available)
  const lessonOrder = 5.5;
  const lessonId = 'lesson_mod1_project';
  
  console.log(`\n=== Adding Lesson ===`);
  console.log(`Lesson ID: ${lessonId}`);
  console.log(`Order: ${lessonOrder}`);
  
  const lessonRef = db.collection('courses').doc(courseId).collection('modules').doc(moduleId).collection('lessons').doc(lessonId);
  
  await lessonRef.set({
    title: 'MOD 1 PROJECT: Build Your First Bot',
    order: lessonOrder,
    isFree: false,
    tier: 'premium',
    content: content,
    videoUrl: null,
    durationMinutes: 180, // 3 hours total
    description: 'Build a Customer Service Email Bot in 14 days - complete this project or get a full refund!',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isProject: true,
    guaranteeDays: 14,
  });
  
  console.log(`\n✅ Lesson added successfully!`);
  console.log(`Path: courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  
  // Verify the lesson was added
  const verifySnap = await lessonRef.get();
  if (verifySnap.exists) {
    console.log('\n=== Verification ===');
    console.log('Lesson data:', JSON.stringify(verifySnap.data(), null, 2).substring(0, 500) + '...');
  }
}

async function main() {
  try {
    // First list existing structure
    await listCoursesAndModules();
    
    // Then add the lesson
    await addBotLesson();
    
    // List again to verify
    console.log('\n=== Updated Structure ===');
    await listCoursesAndModules();
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
