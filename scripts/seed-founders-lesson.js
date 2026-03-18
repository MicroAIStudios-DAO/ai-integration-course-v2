/**
 * Seed the founders welcome lesson for Pioneer beta testers and founding members.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/seed-founders-lesson.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'ai-integra-course-v2';
const COURSE_ID = 'course_01_id';
const PREFERRED_MODULE_ID = 'module_01_id';
const LESSON_ID = 'lesson_founders_01_content_architect';
const MARKDOWN_PATH = path.join(
  __dirname,
  '..',
  'lessons',
  'founders',
  'founders-lesson-01-content-architect.md'
);

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

async function resolveModuleRef(courseRef) {
  const preferredModuleRef = courseRef.collection('modules').doc(PREFERRED_MODULE_ID);
  const preferredModuleSnap = await preferredModuleRef.get();
  if (preferredModuleSnap.exists) {
    return preferredModuleRef;
  }

  const firstModuleSnap = await courseRef.collection('modules').orderBy('order').limit(1).get();
  if (firstModuleSnap.empty) {
    throw new Error(`No modules found under courses/${COURSE_ID}`);
  }

  return firstModuleSnap.docs[0].ref;
}

async function main() {
  const courseRef = db.collection('courses').doc(COURSE_ID);
  const courseSnap = await courseRef.get();
  if (!courseSnap.exists) {
    throw new Error(`Course ${COURSE_ID} not found`);
  }

  const moduleRef = await resolveModuleRef(courseRef);
  const moduleSnap = await moduleRef.get();
  const content = fs.readFileSync(MARKDOWN_PATH, 'utf8');

  const lessonRef = moduleRef.collection('lessons').doc(LESSON_ID);
  await lessonRef.set(
    {
      title: 'Founders Lesson: The Content Architect (Your Day 1 Win)',
      order: 0,
      isFree: false,
      tier: 'founders',
      content,
      videoUrl: null,
      durationMinutes: 35,
      description:
        'A welcome lesson for the founding cohort and Pioneer beta testers that turns a rough idea into a reusable content engine.',
      isFoundersLesson: true,
      accessGroup: 'founders_and_beta',
      unlockTriggers: ['founding_code', 'PIONEER'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `Seeded ${LESSON_ID} in courses/${COURSE_ID}/modules/${moduleRef.id}/lessons/${LESSON_ID}`
  );
  console.log(`Module title: ${moduleSnap.data()?.title || moduleRef.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed founders lesson:', error);
    process.exit(1);
  });
