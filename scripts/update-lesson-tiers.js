/**
 * Bulk Update Firestore Lessons - Add 'tier' field
 * 
 * This script adds the 'tier' field to all lesson documents in Firestore.
 * - Sets tier: "free" for lessons where isFree === true
 * - Sets tier: "premium" for all other lessons
 * 
 * Usage:
 *   node scripts/update-lesson-tiers.js
 * 
 * Prerequisites:
 *   - Firebase CLI logged in: firebase login
 *   - GOOGLE_APPLICATION_CREDENTIALS set, OR run from authenticated gcloud environment
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Uses Application Default Credentials when deployed or GOOGLE_APPLICATION_CREDENTIALS env var
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2'
  });
}

const db = admin.firestore();

// Configuration - which lessons should be free
const FREE_LESSON_PATTERNS = [
  // By lesson order (first lesson of each module is often free)
  { moduleOrder: 1, lessonOrder: 1 },
  // Or by specific lesson IDs
  // 'introduction',
  // 'getting-started',
  // 'overview',
];

// Or explicitly list free lesson IDs
const FREE_LESSON_IDS = [
  // Add specific lesson IDs here if known
  // 'lesson-id-1',
  // 'lesson-id-2',
];

async function updateLessonTiers() {
  console.log('🔄 Starting Firestore tier field update...\n');
  
  let totalLessons = 0;
  let updatedLessons = 0;
  let freeLessons = 0;
  let premiumLessons = 0;
  let errors = 0;

  try {
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    console.log(`📚 Found ${coursesSnapshot.size} courses\n`);

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      console.log(`\n📖 Course: ${courseData.title || courseId}`);

      // Get all modules in this course
      const modulesSnapshot = await db.collection('courses').doc(courseId).collection('modules').get();
      
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id;
        const moduleData = moduleDoc.data();
        console.log(`  📁 Module: ${moduleData.title || moduleId}`);

        // Get all lessons in this module
        const lessonsSnapshot = await db
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .get();

        for (const lessonDoc of lessonsSnapshot.docs) {
          totalLessons++;
          const lessonId = lessonDoc.id;
          const lessonData = lessonDoc.data();
          
          // Determine if lesson should be free
          let isFree = false;
          
          // Check existing isFree field
          if (lessonData.isFree === true) {
            isFree = true;
          }
          
          // Check if in free lesson IDs list
          if (FREE_LESSON_IDS.includes(lessonId)) {
            isFree = true;
          }
          
          // Check pattern matches (e.g., first lesson of first module)
          for (const pattern of FREE_LESSON_PATTERNS) {
            if (pattern.moduleOrder && pattern.lessonOrder) {
              if (moduleData.order === pattern.moduleOrder && lessonData.order === pattern.lessonOrder) {
                isFree = true;
              }
            }
          }

          const tier = isFree ? 'free' : 'premium';
          
          // Skip if tier already set correctly
          if (lessonData.tier === tier) {
            console.log(`    ✓ ${lessonData.title || lessonId}: tier already set to "${tier}"`);
            if (tier === 'free') freeLessons++;
            else premiumLessons++;
            continue;
          }

          // Update the lesson document
          try {
            await db
              .collection('courses')
              .doc(courseId)
              .collection('modules')
              .doc(moduleId)
              .collection('lessons')
              .doc(lessonId)
              .update({
                tier: tier,
                isFree: isFree // Also ensure isFree is consistent
              });

            updatedLessons++;
            if (tier === 'free') {
              freeLessons++;
              console.log(`    ✅ ${lessonData.title || lessonId}: set to FREE`);
            } else {
              premiumLessons++;
              console.log(`    🔒 ${lessonData.title || lessonId}: set to PREMIUM`);
            }
          } catch (err) {
            errors++;
            console.error(`    ❌ Error updating ${lessonId}:`, err.message);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total lessons scanned:  ${totalLessons}`);
    console.log(`Lessons updated:        ${updatedLessons}`);
    console.log(`Free lessons:           ${freeLessons}`);
    console.log(`Premium lessons:        ${premiumLessons}`);
    console.log(`Errors:                 ${errors}`);
    console.log('='.repeat(50));
    
    if (errors === 0) {
      console.log('\n✅ All lessons updated successfully!');
    } else {
      console.log(`\n⚠️  Completed with ${errors} errors`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
updateLessonTiers()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
