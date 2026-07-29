/**
 * ContinueLearningCard.tsx
 * 
 * The primary post-login CTA card. Shows:
 * - "Start Lesson 1" for new users
 * - "Continue Learning: [Lesson Title]" for returning users
 * - "Course Complete" celebration for users who finished everything
 * 
 * This card answers the user's immediate question: "What do I do now?"
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NextLessonResult } from '../../utils/learning/getNextIncompleteLesson';

interface ContinueLearningCardProps {
  nextLesson: NextLessonResult | null;
  nextLessonRoute: string | null;
  isNewUser: boolean;
  isAllComplete: boolean;
  userName?: string;
}

const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  nextLesson,
  nextLessonRoute,
  isNewUser,
  isAllComplete,
  userName,
}) => {
  const navigate = useNavigate();

  if (!nextLesson || !nextLessonRoute) return null;

  // --- Course Complete State ---
  if (isAllComplete) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-emerald-900/20 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎉</span>
            <h2 className="text-2xl font-bold text-white">Course Complete!</h2>
          </div>
          <p className="text-emerald-200/80 text-base mb-6 max-w-lg">
            Congratulations{userName ? `, ${userName}` : ''}! You've completed all {nextLesson.totalLessons} lessons.
            Your AI integration skills are ready for the real world.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/certification')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              Get Your Certificate
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
            >
              Review Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- New User State ---
  if (isNewUser) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/50 via-slate-900/70 to-purple-900/30 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-12 -translate-x-12" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome to AI Integration Course
          </h2>
          <p className="text-indigo-200/80 text-base md:text-lg mb-6 max-w-lg">
            Start with Lesson 1. We'll guide you step by step, and your progress will be saved automatically.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(nextLessonRoute)}
              data-tour="primary-cta"
              className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Lesson 1
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
            >
              View All Lessons
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Returning User State ---
  const lessonTitle = nextLesson.lesson.title?.replace(/^lesson\s+\d+(\.\d+)?\s*:\s*/i, '').trim() || 'Next Lesson';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/80 via-indigo-900/30 to-slate-900/60 p-8 shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
      <div className="relative z-10">
        <p className="text-indigo-300/80 text-sm font-medium uppercase tracking-wide mb-1">
          Welcome back{userName ? `, ${userName}` : ''}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Continue where you left off
        </h2>
        <div className="mt-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-indigo-300/60 uppercase tracking-wide font-medium mb-1">Next up — Lesson {nextLesson.lessonNumber}</p>
          <p className="text-lg text-white font-semibold">{lessonTitle}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>{nextLesson.completedCount} of {nextLesson.totalLessons} lessons complete</span>
            <span>{nextLesson.progressPercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${nextLesson.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(nextLessonRoute)}
            data-tour="primary-cta"
            className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Continue Learning
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
          >
            View All Lessons
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinueLearningCard;
