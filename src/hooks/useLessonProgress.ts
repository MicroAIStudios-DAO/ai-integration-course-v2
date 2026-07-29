/**
 * useLessonProgress.ts
 * 
 * Custom hook that provides the current user's lesson progress state,
 * including the next incomplete lesson, progress percentage, and loading state.
 * This is the single source of truth for the learning dashboard and continuation flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCourses, getUserCourseProgress } from '../firebaseService';
import { Course, UserCourseProgress } from '../types/course';
import { getNextIncompleteLesson, NextLessonResult, buildLessonRoute } from '../utils/learning/getNextIncompleteLesson';

export interface LessonProgressState {
  /** Whether data is still loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** The primary course (first course in the system) */
  course: Course | null;
  /** User's progress document */
  progress: UserCourseProgress | null;
  /** Computed next lesson result */
  nextLesson: NextLessonResult | null;
  /** Direct route to the next lesson */
  nextLessonRoute: string | null;
  /** Whether this is a brand-new user (no completions) */
  isNewUser: boolean;
  /** Whether the user has completed all lessons */
  isAllComplete: boolean;
  /** Refresh the progress data */
  refresh: () => Promise<void>;
}

export function useLessonProgress(): LessonProgressState {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserCourseProgress | null>(null);
  const [nextLesson, setNextLesson] = useState<NextLessonResult | null>(null);
  const [nextLessonRoute, setNextLessonRoute] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      setCourse(null);
      setProgress(null);
      setNextLesson(null);
      setNextLessonRoute(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch courses
      const courses = await getCourses();
      if (!courses || courses.length === 0) {
        setError('No courses available.');
        setLoading(false);
        return;
      }

      const primaryCourse = courses[0];
      setCourse(primaryCourse);

      // Fetch user progress for this course
      const userProgress = await getUserCourseProgress(currentUser.uid, primaryCourse.id);
      setProgress(userProgress);

      // Compute next lesson
      const completedIds = userProgress?.completedLessons || [];
      const result = getNextIncompleteLesson(primaryCourse, completedIds);
      setNextLesson(result);

      if (result && !result.allComplete) {
        setNextLessonRoute(buildLessonRoute(result.courseId, result.module.id, result.lesson.id));
      } else if (result && result.allComplete) {
        // Point to the last lesson as a review
        setNextLessonRoute(buildLessonRoute(result.courseId, result.module.id, result.lesson.id));
      } else {
        setNextLessonRoute(null);
      }
    } catch (err) {
      console.error('Error fetching lesson progress:', err);
      setError('Failed to load your progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isNewUser = !progress || !progress.completedLessons || progress.completedLessons.length === 0;
  const isAllComplete = nextLesson?.allComplete ?? false;

  return {
    loading,
    error,
    course,
    progress,
    nextLesson,
    nextLessonRoute,
    isNewUser,
    isAllComplete,
    refresh: fetchData,
  };
}
