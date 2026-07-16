import admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const buildLessonContentId = (courseId: string, moduleId: string, lessonId: string): string =>
  `${courseId}__${moduleId}__${lessonId}`;

export const addLessonToFirestoreV2 = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { courseId, moduleId, lesson } = request.data || {};

    if (!courseId || !moduleId || !lesson) {
      throw new HttpsError('invalid-argument', 'Missing courseId, moduleId, or lesson data');
    }

    try {
      const lessonId = lesson.id || `lesson_${Date.now()}`;
      const lessonRef = admin.firestore()
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleId)
        .collection('lessons')
        .doc(lessonId);
      const contentRef = admin.firestore().collection('lessonContent').doc(buildLessonContentId(courseId, moduleId, lessonId));
      const isProtectedLesson = lesson.isFree !== true && lesson.tier !== 'free';
      const batch = admin.firestore().batch();

      // Lesson docs are world-readable catalog metadata: content pointers
      // (storagePath/videoUrl) for protected lessons must never land on
      // them — they go to the tier-gated lessonContent doc instead.
      batch.set(lessonRef, {
        title: lesson.title,
        order: lesson.order,
        isFree: lesson.isFree || false,
        tier: lesson.tier || 'premium',
        storagePath: isProtectedLesson ? null : (lesson.storagePath || null),
        videoUrl: isProtectedLesson ? null : (lesson.videoUrl || null),
        durationMinutes: lesson.durationMinutes || 0,
        description: lesson.description || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(isProtectedLesson ? {} : { content: lesson.content || null }),
      }, { merge: true });

      if (isProtectedLesson && (lesson.content || lesson.storagePath || lesson.videoUrl)) {
        batch.set(contentRef, {
          courseId,
          moduleId,
          lessonId,
          tier: lesson.tier || 'premium',
          ...(lesson.content ? { content: lesson.content } : {}),
          ...(lesson.storagePath ? { storagePath: lesson.storagePath } : {}),
          ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();

      console.log(`Added lesson ${lessonId} to ${courseId}/${moduleId}`);

      return {
        success: true,
        lessonId,
        path: `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      };
    } catch (err: any) {
      console.error('Error adding lesson:', err);
      throw new HttpsError('internal', err.message);
    }
  }
);

export const listCoursesAndModulesV2 = onCall(
  { region: 'us-central1' },
  async () => {
    try {
      const coursesSnap = await admin.firestore().collection('courses').get();
      const result: any[] = [];

      for (const courseDoc of coursesSnap.docs) {
        const courseData = courseDoc.data();
        const modulesSnap = await admin.firestore()
          .collection('courses')
          .doc(courseDoc.id)
          .collection('modules')
          .orderBy('order')
          .get();

        const modules: any[] = [];
        for (const moduleDoc of modulesSnap.docs) {
          const moduleData = moduleDoc.data();
          const lessonsSnap = await admin.firestore()
            .collection('courses')
            .doc(courseDoc.id)
            .collection('modules')
            .doc(moduleDoc.id)
            .collection('lessons')
            .orderBy('order')
            .get();

          modules.push({
            id: moduleDoc.id,
            title: moduleData.title,
            order: moduleData.order,
            lessonCount: lessonsSnap.size,
            lessons: lessonsSnap.docs.map((lessonDoc) => ({
              id: lessonDoc.id,
              title: lessonDoc.data().title,
              order: lessonDoc.data().order,
            })),
          });
        }

        result.push({
          id: courseDoc.id,
          title: courseData.title,
          moduleCount: modules.length,
          modules,
        });
      }

      return { success: true, courses: result };
    } catch (err: any) {
      console.error('Error listing courses:', err);
      throw new HttpsError('internal', err.message);
    }
  }
);
