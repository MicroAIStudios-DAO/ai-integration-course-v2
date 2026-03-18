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
const lessons = [
  {
    moduleId: 'module_01_id',
    lessonId: 'lesson_founders_01_content_architect',
    title: 'Founders Lesson: The Content Architect (Your Day 1 Win)',
    order: 0,
    durationMinutes: 35,
    description:
      'A welcome lesson for the founding cohort and Pioneer beta testers that turns a rough idea into a reusable content engine.',
    markdownPath: path.join(
      __dirname,
      '..',
      'lessons',
      'founders',
      'founders-lesson-01-content-architect.md'
    ),
  },
  {
    moduleId: 'module_02_id',
    lessonId: 'lesson_founders_02_informed_architect',
    title: 'Founders Lesson: The Informed Architect (Adding Real-Time Search)',
    order: 0,
    durationMinutes: 30,
    description:
      'Day 2 of the Pioneer beta track: add real-time Serper search before generating content so the agent can write with fresh 2026 context.',
    markdownPath: path.join(
      __dirname,
      '..',
      'lessons',
      'founders',
      'founders-lesson-02-informed-architect.md'
    ),
  },
];

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

const buildLessonContentId = (courseId, moduleId, lessonId) => `${courseId}__${moduleId}__${lessonId}`;

async function resolveModuleRef(courseRef, preferredModuleId) {
  const preferredModuleRef = courseRef.collection('modules').doc(preferredModuleId);
  const preferredModuleSnap = await preferredModuleRef.get();
  if (preferredModuleSnap.exists) {
    return preferredModuleRef;
  }

  throw new Error(`Module ${preferredModuleId} not found under courses/${COURSE_ID}`);
}

async function main() {
  const courseRef = db.collection('courses').doc(COURSE_ID);
  const courseSnap = await courseRef.get();
  if (!courseSnap.exists) {
    throw new Error(`Course ${COURSE_ID} not found`);
  }

  for (const lesson of lessons) {
    const moduleRef = await resolveModuleRef(courseRef, lesson.moduleId);
    const moduleSnap = await moduleRef.get();
    const content = fs.readFileSync(lesson.markdownPath, 'utf8');
    const lessonRef = moduleRef.collection('lessons').doc(lesson.lessonId);
    const contentRef = db.collection('lessonContent').doc(
      buildLessonContentId(COURSE_ID, moduleRef.id, lesson.lessonId)
    );
    const batch = db.batch();

    batch.set(
      lessonRef,
      {
        title: lesson.title,
        order: lesson.order,
        isFree: false,
        tier: 'founders',
        videoUrl: null,
        durationMinutes: lesson.durationMinutes,
        description: lesson.description,
        isFoundersLesson: true,
        accessGroup: 'founders_and_beta',
        unlockTriggers: ['founding_code', 'PIONEER'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      contentRef,
      {
        courseId: COURSE_ID,
        moduleId: moduleRef.id,
        lessonId: lesson.lessonId,
        tier: 'founders',
        content,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    console.log(
      `Seeded ${lesson.lessonId} in courses/${COURSE_ID}/modules/${moduleRef.id}/lessons/${lesson.lessonId}`
    );
    console.log(`Module title: ${moduleSnap.data()?.title || moduleRef.id}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed founders lesson:', error);
    process.exit(1);
  });
