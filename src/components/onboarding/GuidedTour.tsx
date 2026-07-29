/**
 * GuidedTour.tsx
 * 
 * A lightweight, internal guided tour component using coachmarks/tooltips.
 * No external dependencies. Highlights real UI elements and explains the learning path.
 * 
 * Steps:
 * 1. Welcome message
 * 2. Where courses/lessons are (nav menu)
 * 3. How to start Lesson 1
 * 4. How marking complete works
 * 5. How progress resumes next login
 * 6. Where to ask the AI Tutor for help
 */

import React, { useState, useEffect, useCallback } from 'react';

interface TourStep {
  title: string;
  description: string;
  /** CSS selector to highlight (optional — if null, shows centered modal) */
  targetSelector?: string;
  /** Position of tooltip relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome! Let me show you around.',
    description: "This will take about 60 seconds. I'll show you the fastest way to begin learning. You can skip this anytime and come back later.",
  },
  {
    title: 'Your Learning Dashboard',
    description: "This is your home base. Every time you sign in, you'll land here. The big button at the top always shows your next lesson — no searching required.",
  },
  {
    title: 'Finding All Courses & Lessons',
    description: "The 'All Lessons' card below takes you to the full course catalog. You can also find it in the navigation menu. But you don't need it to get started — just click the main button.",
    targetSelector: '[data-tour="all-lessons"]',
    position: 'top',
  },
  {
    title: 'Starting Your First Lesson',
    description: "Click 'Start Lesson 1' (or 'Continue Learning' if you've already begun). The lesson will open with video, reading material, and an AI tutor to help you.",
    targetSelector: '[data-tour="primary-cta"]',
    position: 'bottom',
  },
  {
    title: 'Completing a Lesson',
    description: "At the bottom of each lesson, you'll see a 'Mark as Complete' button. Click it when you're done. Your progress is saved automatically — it will be here next time you log in.",
  },
  {
    title: 'AI Tutor — Your Personal Guide',
    description: "Every lesson has an AI Tutor sidebar. Ask it anything about the material. It adapts to your level and gives personalized explanations. You can also access it from the dashboard.",
    targetSelector: '[data-tour="ai-tutor"]',
    position: 'top',
  },
  {
    title: "You're ready!",
    description: "Next time you sign in, we'll bring you right back to the next lesson you haven't completed yet. No searching, no guessing. Just click and learn.",
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
  isNewUser: boolean;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Position tooltip near target element if specified
  useEffect(() => {
    if (step.targetSelector) {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const pos = step.position || 'bottom';
        let top = 0;
        let left = rect.left + rect.width / 2;

        switch (pos) {
          case 'bottom':
            top = rect.bottom + 12;
            break;
          case 'top':
            top = rect.top - 12;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 12;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 12;
            break;
        }

        setTooltipPosition({ top, left });

        // Add highlight ring to target
        target.classList.add('tour-highlight');
        return () => {
          target.classList.remove('tour-highlight');
        };
      }
    }
    setTooltipPosition(null);
  }, [currentStep, step]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, onSkip]);

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onSkip} />

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] w-[90vw] max-w-md"
        style={
          tooltipPosition
            ? { top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px`, transform: 'translateX(-50%)' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-indigo-400' : i < currentStep ? 'bg-indigo-600' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">{currentStep + 1} / {TOUR_STEPS.length}</span>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">{step.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/20 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                {isLastStep ? "Let's go!" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tour highlight CSS */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default GuidedTour;
