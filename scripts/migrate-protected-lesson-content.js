/**
 * Move protected lesson bodies out of public lesson docs into lessonContent.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/admin.json node scripts/migrate-protected-lesson-content.js
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();
const DELETE_FIELD = admin.firestore.FieldValue.delete();
const SERVER_TIMESTAMP = admin.firestore.FieldValue.serverTimestamp();
const buildLessonContentId = (courseId, moduleId, lessonId) => `${courseId}__${moduleId}__${lessonId}`;

async function commitBatch(batchState) {
  if (batchState.ops === 0) {
    return;
  }
  await batchState.batch.commit();
  batchState.batch = db.batch();
  batchState.ops = 0;
}

async function main() {
  const coursesSnap = await db.collection('courses').get();
  const batchState = { batch: db.batch(), ops: 0 };
  let migratedCount = 0;

  for (const courseDoc of coursesSnap.docs) {
    const modulesSnap = await courseDoc.ref.collection('modules').get();
    for (const moduleDoc of modulesSnap.docs) {
      const lessonsSnap = await moduleDoc.ref.collection('lessons').get();
      for (const lessonDoc of lessonsSnap.docs) {
        const lesson = lessonDoc.data() || {};
        const isFree = lesson.tier === 'free' || lesson.isFree === true;
        const inlineContent = [lesson.content, lesson.md, lesson.html]
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .find(Boolean);

        if (isFree || !inlineContent) {
          continue;
        }

        const contentId = buildLessonContentId(courseDoc.id, moduleDoc.id, lessonDoc.id);
        const contentRef = db.collection('lessonContent').doc(contentId);

        batchState.batch.set(
          contentRef,
          {
            courseId: courseDoc.id,
            moduleId: moduleDoc.id,
            lessonId: lessonDoc.id,
            tier: lesson.tier || 'premium',
            content: inlineContent,
            updatedAt: SERVER_TIMESTAMP,
          },
          { merge: true }
        );
        batchState.batch.set(
          lessonDoc.ref,
          {
            content: DELETE_FIELD,
            md: DELETE_FIELD,
            html: DELETE_FIELD,
            updatedAt: SERVER_TIMESTAMP,
          },
          { merge: true }
        );
        batchState.ops += 2;
        migratedCount += 1;

        if (batchState.ops >= 400) {
          await commitBatch(batchState);
        }

        console.log(`Migrated protected content for ${lessonDoc.ref.path}`);
      }
    }
  }

  await commitBatch(batchState);
  console.log(`Done. Migrated ${migratedCount} protected lesson docs.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to migrate protected lesson content:', error);
    process.exit(1);
  });
