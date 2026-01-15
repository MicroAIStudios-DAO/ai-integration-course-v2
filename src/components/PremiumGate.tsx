import React from 'react';
import { Link } from 'react-router-dom';
import { useLessonAccess, ContentTier } from '../hooks/usePremiumAccess';

interface PremiumGateProps {
  tier: ContentTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  lessonTitle?: string;
}

/**
 * PremiumGate Component
 * 
 * Wraps content and only renders it if user has appropriate access.
 * Shows upgrade prompt for premium content when user doesn't have access.
 * 
 * Usage:
 * <PremiumGate tier="premium" lessonTitle="Advanced AI Strategies">
 *   <LessonContent />
 * </PremiumGate>
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({
  tier,
  children,
  fallback,
  showUpgradePrompt = true,
  lessonTitle,
}) => {
  const { canAccess, reason, loading, upgradeRequired } = useLessonAccess(tier);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // User has access - render content
  if (canAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  // Default upgrade prompt
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-8 md:p-12 text-center">
      <div className="max-w-2xl mx-auto">
        {/* Lock Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30">
            <svg 
              className="w-8 h-8 text-indigo-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Premium Content
        </h3>

        {/* Lesson title if provided */}
        {lessonTitle && (
          <p className="text-lg text-indigo-300 mb-4">
            "{lessonTitle}"
          </p>
        )}

        {/* Description */}
        <p className="text-gray-300 mb-8 leading-relaxed">
          This lesson is part of our premium curriculum. Upgrade to unlock 
          all lessons, get AI-powered tutoring, and accelerate your learning journey.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4">
            <svg className="w-6 h-6 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-300">All Premium Lessons</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <svg className="w-6 h-6 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-gray-300">AI Tutor Access</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <svg className="w-6 h-6 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-sm text-gray-300">Certificates</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            Start Free Trial
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium transition-colors"
          >
            Browse Free Lessons
          </Link>
        </div>

        {/* Trial info */}
        <p className="text-sm text-gray-500 mt-6">
          7-day free trial • Cancel anytime • No credit card required to start
        </p>
      </div>
    </div>
  );
};

/**
 * Inline Premium Badge
 * Shows a small badge indicating premium content
 */
export const PremiumBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white ${className}`}>
    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
    Premium
  </span>
);

/**
 * Trial Banner
 * Shows remaining trial days
 */
export const TrialBanner: React.FC<{ daysRemaining: number }> = ({ daysRemaining }) => {
  if (daysRemaining <= 0) return null;

  const urgency = daysRemaining <= 2 ? 'bg-red-600' : daysRemaining <= 5 ? 'bg-amber-600' : 'bg-indigo-600';

  return (
    <div className={`${urgency} text-white text-center py-2 px-4 text-sm`}>
      <span className="font-medium">
        {daysRemaining === 1 
          ? '⏰ Last day of your free trial!' 
          : `📅 ${daysRemaining} days left in your free trial`}
      </span>
      <Link to="/pricing" className="ml-2 underline hover:no-underline">
        Upgrade now
      </Link>
    </div>
  );
};

export default PremiumGate;
