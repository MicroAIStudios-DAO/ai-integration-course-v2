import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startCheckoutForPlan } from '../utils/checkout';
import { trackCTAClick, pushAbandonmentFunnelState } from '../utils/analytics';

/**
 * Section 3: Pre-Checkout Plan Selector
 * Shows a simple, frictionless plan selector before routing to Stripe Checkout.
 * Detects traffic source from UTM params and adjusts copy accordingly.
 * Rule: No forced account creation. No extra fields. One clear CTA per path.
 */

const PlanSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const preselect = searchParams.get('plan') || ''; // 'trial' | 'annual'

  // Source-aware copy: Section 13D
  const isFromPaidSocial = utmMedium === 'paid_social' || utmMedium === 'cpc';
  const isFromEmail = utmMedium === 'email';
  const isFromOrganic = !isFromPaidSocial && !isFromEmail;

  const getHeroSubcopy = () => {
    if (isFromPaidSocial) return 'Start full access for $1 today. Build something real this week. Cancel before renewal if it\'s not for you.';
    if (isFromEmail) return 'Pick up where you left off. Your access is one step away.';
    return 'Get 7 days to build your first AI workflow. If it earns its keep, your access continues at $29.99/month. If not, cancel before renewal.';
  };

  useEffect(() => {
    // Auto-redirect if plan is already selected (e.g., from pricing page CTA)
    if (preselect === 'trial') {
      handleTrialCheckout();
    } else if (preselect === 'annual') {
      handleAnnualCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect]);

  const handleTrialCheckout = async () => {
    trackCTAClick('plan_selector_trial', 'plan_selector_page', 'trial');
    pushAbandonmentFunnelState('checkout_started', 'pro_trial', 1);
    await startCheckoutForPlan('pro_trial');
  };

  const handleAnnualCheckout = async () => {
    trackCTAClick('plan_selector_annual', 'plan_selector_page', 'annual');
    pushAbandonmentFunnelState('checkout_started', 'pro_annual', 239);
    await startCheckoutForPlan('pro');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">

        {/* Trust Row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-400 mb-10">
          <span>✓ Instant access after checkout</span>
          <span>✓ Secure payment</span>
          <span>✓ 14-Day Build Guarantee</span>
        </div>

        {/* TRIAL PATH */}
        <div className="bg-gray-900 border border-emerald-500 rounded-2xl p-8 mb-6">
          <div className="inline-block bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            LOWEST RISK
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Start full access for $1
          </h1>
          <p className="text-gray-300 mb-6">
            {getHeroSubcopy()}
          </p>

          {/* Dynamic charge summary — Trial */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Today</span>
              <span className="text-white font-semibold">$1.00</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Then, after 7 days</span>
              <span>$29.99/month unless cancelled before renewal</span>
            </div>
          </div>

          <button
            onClick={handleTrialCheckout}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Continue to Secure Checkout →
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Cancel before day 8 in 2 clicks if it's not for you.
          </p>
        </div>

        {/* ANNUAL PATH */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-8">
          <div className="inline-block bg-gray-700 text-gray-200 text-xs font-bold px-3 py-1 rounded-full mb-4">
            BEST VALUE
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Get the best price and full access today
          </h2>
          <p className="text-gray-300 mb-6">
            Join for $239/year and save $120 versus monthly.
          </p>

          {/* Dynamic charge summary — Annual */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Today</span>
              <span className="text-white font-semibold">$239.00</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Full year of access</span>
              <span>$19.99/month equivalent · Save $120</span>
            </div>
          </div>

          <button
            onClick={handleAnnualCheckout}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-colors"
          >
            Continue to Secure Checkout →
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Instant access after checkout. 14-Day Build Guarantee.
          </p>
        </div>

        {/* Help line */}
        <p className="text-center text-sm text-gray-500">
          Questions before you start?{' '}
          <a href="mailto:info@aiintegrationcourse.com" className="text-emerald-400 hover:underline">
            Reply to any email
          </a>{' '}
          and we'll help.
        </p>
      </div>
    </div>
  );
};

export default PlanSelectorPage;
