import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackPurchase, setUserProperties, trackGoogleAdsSignupConversion, trackCustomEvent } from '../utils/analytics';
import { PlanKey, plans } from '../config/pricing';

/**
 * Plan-aware success page.
 *
 * IMPORTANT: The webhook (stripeWebhookV2) is the authority for subscription state.
 * This page fires client-side analytics as a belt-and-suspenders backup.
 *
 * For Explorer trials: we fire a 'trial_start' event, NOT a purchase.
 * Purchase events should only fire for paid conversions.
 */
const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recover the plan the user just purchased from sessionStorage or URL
  const planKey = (
    new URLSearchParams(location.search).get('plan') ||
    sessionStorage.getItem('intended_plan') ||
    'explorer'
  ) as PlanKey;

  const plan = plans[planKey] || plans.explorer;
  const isTrial = plan.trialDays > 0;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sId = queryParams.get('session_id');
    setSessionId(sId);

    if (sId) {
      if (isTrial) {
        // Explorer or Pro trial start — NOT a paid conversion yet
        trackCustomEvent('subscription', 'trial_start', planKey);
        setUserProperties({
          subscription_status: 'trial',
          signup_date: new Date().toISOString().split('T')[0],
        });
      } else {
        // Paid plan — fire purchase event with correct value
        trackPurchase(
          sId,
          plan.analyticsValue,
          'USD',
          0,
          plan.name,
          planKey
        );
        trackGoogleAdsSignupConversion(plan.analyticsValue, 'USD');
        setUserProperties({
          subscription_status: planKey === 'corporate' ? 'corporate' : 'pro',
          signup_date: new Date().toISOString().split('T')[0],
        });
      }

      // Clean up intended_plan from sessionStorage
      sessionStorage.removeItem('intended_plan');
      setLoading(false);
    } else {
      setError('No session ID found. Payment status cannot be confirmed.');
      setLoading(false);
    }
  }, [location, isTrial, plan.analyticsValue, plan.name, planKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-slate-800/50 rounded-2xl border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Payment Verification Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic heading/messaging based on plan
  const headingMap: Record<PlanKey, string> = {
    explorer: 'Your 7-Day Trial Has Started!',
    pro: 'Welcome to Pro AI Architect!',
    corporate: 'Welcome to Team AI Standard!',
  };

  const subheadMap: Record<PlanKey, string> = {
    explorer: 'Your 7-day full-access trial is live. Cancel during the trial window if it is not right for you. Stay active and the plan continues at $29.99/month.',
    pro: 'Your annual plan is active. You just locked in the best rate for a full year of building.',
    corporate: 'Your team plan is active with up to 5 seats. Time to standardize your AI operations.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center p-8 bg-slate-800/50 rounded-2xl border border-green-500/20">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">{headingMap[planKey]}</h1>
        <p className="text-gray-300 mb-2">{subheadMap[planKey]}</p>
        <p className="text-sm text-gray-500 mb-6">Transaction ID: {sessionId}</p>

        {/* 14-Day Guarantee Reminder */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-semibold text-indigo-400">14-Day Build-Your-First-Bot Guarantee</span>
          </div>
          <p className="text-sm text-gray-400">
            Build your first working bot in 14 days or get a full refund. No questions asked.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-white mb-3">Your Next Steps:</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Start the &quot;Build Your First Bot&quot; lesson to claim your guarantee</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Set up your AI tools (Gmail, Zapier, OpenAI)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Deploy your first customer service email bot</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            Start Building Now
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
