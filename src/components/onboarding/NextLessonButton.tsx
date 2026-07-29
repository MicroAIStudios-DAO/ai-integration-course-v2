/**
 * NextLessonButton.tsx
 * 
 * Shows a "Next Lesson" button after a user marks a lesson as complete.
 * Uses the getNextIncompleteLesson utility to determine what comes next.
 * Replaces the dead-end feeling of "Lesson marked as complete!" with forward momentum.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCourses, getUserCourseProgress } from '../../firebaseService';
import { getNextIncompleteLesson, buildLessonRoute, NextLessonResult } from '../../utils/learning/getNextIncompleteLesson';

interface NextLessonButtonProps {
  /** The current lesson's course ID */
  courseId: string;
  /** Trigger a refresh when this changes (e.g., after marking complete) */
  refreshTrigger?: number;
}

const NextLessonButton: React.FC<NextLessonButtonProps> = ({ courseId, refreshTrigger }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [nextResult, setNextResult] = useState<NextLessonResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNext = async () => {
      if (!currentUser || !courseId) return;
      setLoading(true);
      try {
        const courses = await getCourses();
        const course = courses?.find(c => c.id === courseId) || courses?.[0];
        if (!course) return;

        const progress = await getUserCourseProgress(currentUser.uid, course.id);
        const result = getNextIncompleteLesson(course, progress?.completedLessons || []);
        setNextResult(result);
      } catch (err) {
        console.error('Error fetching next lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNext();
  }, [currentUser, courseId, refreshTrigger]);

  if (loading || !nextResult) return null;

  // If all complete, show a "Back to Dashboard" button
  if (nextResult.allComplete) {
    return (
      <button
        onClick={() => navigate('/learn')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Course Complete — View Dashboard
      </button>
    );
  }

  const route = buildLessonRoute(nextResult.courseId, nextResult.module.id, nextResult.lesson.id);
  const title = nextResult.lesson.title?.replace(/^lesson\s+\d+(\.\d+)?\s*:\s*/i, '').trim() || 'Next Lesson';

  return (
    <button
      onClick={() => navigate(route)}
      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
    >
      <span>Next: {title}</span>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  );
};

export default NextLessonButton;
