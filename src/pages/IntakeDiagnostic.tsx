/**
 * IntakeDiagnostic.tsx — The "Genesis State" Page
 * 
 * A dedicated page for the 3-minute conversational diagnostic that builds
 * the student's adaptive profile. Accessed when a student first enrolls
 * or when they want to recalibrate their learning path.
 * 
 * After completion, redirects to the Competency Dashboard with their
 * personalized path.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdaptiveLearning } from '../context/AdaptiveLearningContext';
import AITutorV2 from '../components/AITutorV2';

const IntakeDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { isIntakeComplete, studentProfile, competencyGraph } = useAdaptiveLearning();
  const [showRecalibrate, setShowRecalibrate] = useState(false);

  // If intake is already complete and we have a path, redirect to dashboard
  useEffect(() => {
    if (isIntakeComplete && competencyGraph && !showRecalibrate) {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isIntakeComplete, competencyGraph, navigate, showRecalibrate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isIntakeComplete ? 'Profile Complete!' : 'Let\'s Personalize Your Journey'}
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            {isIntakeComplete
              ? `Great! Your path is ready. Redirecting to your dashboard...`
              : `A quick 3-minute conversation to understand your background, goals, and preferred learning style. This helps your AI Mentor adapt every lesson to your world.`
            }
          </p>
        </div>

        {/* Profile Summary (if complete) */}
        {isIntakeComplete && studentProfile && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6">
            <h3 className="text-sm font-semibold text-green-800 mb-3">Your Profile</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-green-600 mb-1">Technical Level</p>
                <p className="text-sm font-semibold text-green-800 capitalize">{studentProfile.technicalVector}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-green-600 mb-1">Industry</p>
                <p className="text-sm font-semibold text-green-800">{studentProfile.industryContext}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-green-600 mb-1">Governance</p>
                <p className="text-sm font-semibold text-green-800 capitalize">{studentProfile.governancePosture}</p>
              </div>
            </div>
            {studentProfile.preferredAnalogies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-600">Analogies tuned for: {studentProfile.preferredAnalogies.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Diagnostic Chat */}
        {(!isIntakeComplete || showRecalibrate) && (
          <div className="rounded-xl shadow-lg overflow-hidden">
            <AITutorV2
              lessonId="intake-diagnostic"
              premium={false}
              hasAccess={true}
              labMode={false}
            />
          </div>
        )}

        {/* Recalibrate Option */}
        {isIntakeComplete && !showRecalibrate && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowRecalibrate(true)}
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors underline"
            >
              Want to recalibrate your profile?
            </button>
          </div>
        )}

        {/* What happens next */}
        {!isIntakeComplete && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              What happens after the diagnostic:
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-indigo-500 mt-0.5">1.</span>
                <span>Your AI Mentor adapts all explanations to your industry and skill level</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-indigo-500 mt-0.5">2.</span>
                <span>A personalized learning path is generated (skipping what you don't need)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-indigo-500 mt-0.5">3.</span>
                <span>Proactive coaching kicks in during labs based on your progress</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntakeDiagnostic;
