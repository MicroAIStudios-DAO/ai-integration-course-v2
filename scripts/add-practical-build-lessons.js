/**
 * Script to add practical build lessons (Modules 2-7) + GitHub starter lesson (Module 1).
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/add-practical-build-lessons.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();

const lessons = [
  {
    courseId: 'course_01_id',
    moduleId: 'module_01_id',
    lessonId: 'lesson_5_1_github_repository',
    title: 'Lesson 5.1: GitHub Repository',
    order: 5.1,
    tier: 'free',
    isFree: true,
    durationMinutes: 45,
    description: 'Create your GitHub account and starter repo for all module builds.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'github-lesson-00-github-starter-repo.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_02_id',
    lessonId: 'lesson_mod2_project',
    title: 'MOD 2 PROJECT: AI Portfolio Risk Snapshot + Investment Memo',
    order: 3.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 120,
    description: 'Build a portfolio risk snapshot and generate an AI investment memo.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-2-practical-build-finance.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_03_id',
    lessonId: 'lesson_mod3_project',
    title: 'MOD 3 PROJECT: Startup Validator + Experiment Planner',
    order: 6.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 120,
    description: 'Turn a startup idea into a lean canvas, experiments, and a 7-day plan.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-3-practical-build-startups.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_04_id',
    lessonId: 'lesson_mod4_project',
    title: 'MOD 4 PROJECT: Small Business AI Helpdesk (FAQ + SOP Assistant)',
    order: 6.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 150,
    description: 'Build a tiny RAG assistant grounded in your own business docs.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-4-practical-build-small-business.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_05_id',
    lessonId: 'lesson_mod5_project',
    title: 'MOD 5 PROJECT: Real Estate Deal Underwriter + Listing Optimizer',
    order: 6.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 150,
    description: 'Compute underwriting metrics and generate a cautious AI deal summary.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-5-practical-build-real-estate.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_06_id',
    lessonId: 'lesson_mod6_project',
    title: 'MOD 6 PROJECT: Executive AI Strategy Brief Generator',
    order: 5.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 120,
    description: 'Generate a board-ready AI roadmap with risks and KPIs.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-6-practical-build-exec-leadership.md'),
  },
  {
    courseId: 'course_01_id',
    moduleId: 'module_07_id',
    lessonId: 'lesson_mod7_project',
    title: 'MOD 7 PROJECT: Creative Brief + Shot List Generator',
    order: 8.1,
    tier: 'premium',
    isFree: false,
    durationMinutes: 120,
    description: 'Generate a creative brief, concept directions, and a shot list.',
    markdownPath: path.join(__dirname, '..', 'lessons', 'premium', 'module-7-practical-build-creative-industries.md'),
  },
];

async function addLesson(lesson) {
  const content = fs.readFileSync(lesson.markdownPath, 'utf8');
  const lessonRef = db
    .collection('courses')
    .doc(lesson.courseId)
    .collection('modules')
    .doc(lesson.moduleId)
    .collection('lessons')
    .doc(lesson.lessonId);

  await lessonRef.set(
    {
      title: lesson.title,
      order: lesson.order,
      isFree: lesson.isFree,
      tier: lesson.tier,
      content,
      videoUrl: null,
      durationMinutes: lesson.durationMinutes,
      description: lesson.description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isProject: true,
    },
    { merge: true }
  );

  console.log(`Added: ${lesson.title} -> courses/${lesson.courseId}/modules/${lesson.moduleId}/lessons/${lesson.lessonId}`);
}

async function main() {
  for (const lesson of lessons) {
    await addLesson(lesson);
  }
}

main()
  .then(() => {
    console.log('All practical build lessons added.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to add lessons:', err);
    process.exit(1);
  });
