/**
 * LearningDashboardPage.tsx
 * 
 * The primary post-login landing page for signed-in users.
 * Answers the user's immediate question: "What do I do now?"
 * 
 * Shows:
 * - Start/Continue Learning hero card
 * - Progress summary
 * - Quick links to tutor, courses, certification
 * - Option to launch guided tour
 */

import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useOnboardingState } from '../hooks/useOnboardingState';
import ContinueLearningCard from '../components/onboarding/ContinueLearningCard';
import GuidedTour from '../components/onboarding/GuidedTour';
import OnboardingTutor from '../components/onboarding/OnboardingTutor';

const LearningDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    error,
    nextLesson,
    nextLessonRoute,
    isNewUser,
    isAllComplete,
  } = useLessonProgress();
  const {
    shouldShowTour,
    tourCompleted,
    loading: tourLoading,
    completeTour,
    skipTour,
    resetTour,
  } = useOnboardingState();

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Loading state
  if (loading || tourLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayName = currentUser.displayName?.split(' ')[0] || undefined;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Guided Tour Overlay */}
      {shouldShowTour && (
        <GuidedTour
          onComplete={completeTour}
          onSkip={skipTour}
          isNewUser={isNewUser}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Primary CTA Card */}
        <ContinueLearningCard
          nextLesson={nextLesson}
          nextLessonRoute={nextLessonRoute}
          isNewUser={isNewUser}
          isAllComplete={isAllComplete}
          userName={displayName}
        />

        {/* AI Onboarding Tutor — shows for new users or when tour is active */}
        {isNewUser && !shouldShowTour && (
          <div className="mt-6">
            <OnboardingTutor isNewUser={isNewUser} />
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/courses"
            data-tour="all-lessons"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 text-center hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            <span className="text-2xl mb-2 block">📚</span>
            <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">All Lessons</p>
          </Link>
          <Link
            to="/tutor"
            data-tour="ai-tutor"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 text-center hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            <span className="text-2xl mb-2 block">🧠</span>
            <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">AI Tutor</p>
          </Link>
          <Link
            to="/certification"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 text-center hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Certification</p>
          </Link>
          <Link
            to="/community"
            className="group rounded-xl border border-white/10 bg-white/5 p-5 text-center hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            <span className="text-2xl mb-2 block">💬</span>
            <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Community</p>
          </Link>
        </div>

        {/* Tour Relaunch */}
        {tourCompleted && (
          <div className="mt-6 text-center">
            <button
              onClick={resetTour}
              className="text-sm text-slate-500 hover:text-indigo-400 transition-colors underline underline-offset-4"
            >
              Restart the guided tour
            </button>
          </div>
        )}

        {/* Recent Activity / Progress Summary */}
        {!isNewUser && nextLesson && !isAllComplete && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-400">{nextLesson.completedCount}</p>
                <p className="text-xs text-slate-400 mt-1">Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{nextLesson.totalLessons - nextLesson.completedCount}</p>
                <p className="text-xs text-slate-400 mt-1">Remaining</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400">{nextLesson.progressPercent}%</p>
                <p className="text-xs text-slate-400 mt-1">Progress</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningDashboardPage;
