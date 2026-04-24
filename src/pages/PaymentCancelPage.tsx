import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPlanKeyFromSearch, getStoredPlanKey, startCheckoutForPlan } from '../utils/checkout';
import { trackCancellationPageView, trackCancellationRecoveryClick, pushAbandonmentFunnelState } from '../utils/analytics';

/**
 * Section 5: Cancel Page / Return Page
 * Exact copy from brief. Includes:
 * - Plan-aware primary and secondary CTAs
 * - All 3 objection blocks
 * - Micro-survey with cancel_reason storage
 * - cancel_reason pushed to dataLayer and sessionStorage for use in later email flows
 */

const CANCEL_REASONS = [
  { id: 'price', label: 'Price' },
  { id: 'time', label: 'Not enough time' },
  { id: 'unclear', label: 'Not sure what I get' },
  { id: 'technical', label: 'Not technical enough' },
  { id: 'compare', label: 'Wanted to compare options' },
  { id: 'ask_someone', label: 'Need to ask someone' },
  { id: 'other', label: 'Other' },
];

const PaymentCancelPage: React.FC = () => {
  const location = useLocation();
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const planKey = getPlanKeyFromSearch(location.search) || getStoredPlanKey() || 'pro_trial';
  const isTrialAbandon = planKey === 'pro_trial' || planKey === 'explorer';
  const isAnnualAbandon = planKey === 'pro';

  // Build plan-aware resume URL
  const resumeUrl = `/pricing?plan=${planKey}&utm_source=cancel_page&utm_medium=recovery_cta&utm_campaign=cancel_page_resume`;
  const trialUrl = `/start-trial?plan=trial&utm_source=cancel_page&utm_medium=recovery_cta&utm_campaign=cancel_page_trial_fallback`;

  useEffect(() => {
    trackCancellationPageView(planKey, 'checkout_cancel');
    pushAbandonmentFunnelState('checkout_cancelled', planKey, isAnnualAbandon ? 239 : 29.99);
  }, [planKey, isAnnualAbandon]);

  const handleResumeClick = () => {
    trackCancellationRecoveryClick(planKey, cancelReason || 'none');
  };

  const handleSurveySubmit = (reason: string) => {
    setCancelReason(reason);
    setSurveySubmitted(true);

    // Store for use in email branching (Section 13H)
    sessionStorage.setItem('cancel_reason', reason);

    // Push to dataLayer for GTM audience segmentation
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cancel_reason_selected',
        cancel_reason: reason,
        plan_key: planKey,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl space-y-6">

        {/* HERO — Exact brief copy */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            You didn't lose your spot.
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Your checkout is still open. Pick up where you left off in one click.
          </p>

          {/* PRIMARY CTA */}
          <Link
            to={resumeUrl}
            onClick={handleResumeClick}
            className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl text-lg text-center transition-colors mb-3"
          >
            Resume My Checkout
          </Link>

          {/* SECONDARY CTA — Plan-aware */}
          {isAnnualAbandon && (
            <Link
              to={trialUrl}
              className="block w-full border border-gray-600 hover:border-gray-400 text-gray-300 font-medium py-3 px-8 rounded-xl text-base text-center transition-colors"
            >
              Prefer to start smaller? Start the 7-day trial for $1.
            </Link>
          )}
          {isTrialAbandon && (
            <Link
              to={resumeUrl}
              className="block w-full border border-gray-600 hover:border-gray-400 text-gray-300 font-medium py-3 px-8 rounded-xl text-base text-center transition-colors"
            >
              Still thinking? Resume your $1 trial here.
            </Link>
          )}
        </div>

        {/* OBJECTION BLOCKS — Exact brief copy */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">Too expensive right now?</h3>
            <p className="text-gray-400 text-sm">
              Start with full access for $1 today. Upgrade only if it earns its place.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">Not enough time?</h3>
            <p className="text-gray-400 text-sm">
              Your first useful win should take minutes, not hours. This was designed for real schedules.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">Not sure it'll work for you?</h3>
            <p className="text-gray-400 text-sm">
              That's why you're protected by the 14-Day Build Guarantee.
            </p>
          </div>
        </div>

        {/* MICRO-SURVEY — Section 5 */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          {!surveySubmitted ? (
            <>
              <p className="text-sm font-semibold text-gray-300 mb-4">
                What stopped you from finishing?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSurveySubmit(r.id)}
                    className="text-left text-xs text-gray-400 border border-gray-700 hover:border-emerald-500 hover:text-white rounded-lg px-3 py-2 transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center">
              Thanks — that helps us improve.{' '}
              <Link to={resumeUrl} className="text-emerald-400 hover:underline">
                Your checkout is still open.
              </Link>
            </p>
          )}
        </div>

        {/* HELP CTA */}
        <p className="text-center text-sm text-gray-500">
          Have a question before you decide?{' '}
          <a href="mailto:info@aiintegrationcourse.com" className="text-emerald-400 hover:underline">
            Reply to any email and tell us what stopped you.
          </a>
        </p>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
          <span>🔐 256-bit SSL</span>
          <span>✅ 14-Day Build Guarantee</span>
          <span>🚫 No charge was made</span>
        </div>

      </div>
    </div>
  );
};

export default PaymentCancelPage;
