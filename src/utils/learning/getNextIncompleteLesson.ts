/**
 * getNextIncompleteLesson.ts
 * 
 * Determines the next lesson a user should take based on their completion state.
 * Walks the course tree (modules → lessons) in order and returns the first
 * lesson whose ID is NOT in the completedLessonIds set.
 */

import { Course, Lesson, Module } from '../../types/course';

export interface NextLessonResult {
  lesson: Lesson;
  module: Module;
  courseId: string;
  /** Absolute lesson number across all modules (1-indexed) */
  lessonNumber: number;
  /** Total lessons in the course */
  totalLessons: number;
  /** Number of completed lessons */
  completedCount: number;
  /** Progress percentage (0–100) */
  progressPercent: number;
  /** Whether all lessons are complete */
  allComplete: boolean;
}

/**
 * Returns the next incomplete lesson for a user, or null if all are complete.
 * 
 * @param course - The full course object with modules and lessons loaded
 * @param completedLessonIds - Array of lesson IDs the user has completed
 */
export function getNextIncompleteLesson(
  course: Course | null,
  completedLessonIds: string[]
): NextLessonResult | null {
  if (!course || !course.modules || course.modules.length === 0) {
    return null;
  }

  const completedSet = new Set(completedLessonIds || []);

  // Flatten all lessons in module order → lesson order
  const sortedModules = [...course.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  let absoluteIndex = 0;
  let totalLessons = 0;

  // First pass: count total lessons
  for (const mod of sortedModules) {
    const sortedLessons = [...(mod.lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    totalLessons += sortedLessons.length;
  }

  const completedCount = completedLessonIds.filter(id => {
    // Only count IDs that actually exist in this course
    for (const mod of sortedModules) {
      if (mod.lessons?.some(l => l.id === id)) return true;
    }
    return false;
  }).length;

  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Second pass: find first incomplete
  for (const mod of sortedModules) {
    const sortedLessons = [...(mod.lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const lesson of sortedLessons) {
      absoluteIndex++;
      if (!completedSet.has(lesson.id)) {
        return {
          lesson,
          module: mod,
          courseId: course.id,
          lessonNumber: absoluteIndex,
          totalLessons,
          completedCount,
          progressPercent,
          allComplete: false,
        };
      }
    }
  }

  // All lessons complete
  return {
    lesson: sortedModules[sortedModules.length - 1].lessons[sortedModules[sortedModules.length - 1].lessons.length - 1],
    module: sortedModules[sortedModules.length - 1],
    courseId: course.id,
    lessonNumber: totalLessons,
    totalLessons,
    completedCount,
    progressPercent: 100,
    allComplete: true,
  };
}

/**
 * Builds the route path for a given lesson.
 */
export function buildLessonRoute(courseId: string, moduleId: string, lessonId: string): string {
  return `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
}
