import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { startCheckoutForPlan } from '../utils/checkout';
import { trackCTAClick, pushAbandonmentFunnelState } from '../utils/analytics';

/**
 * Section 3: Pre-Checkout Plan Selector
 * Shows a simple, frictionless plan selector before routing to Stripe Checkout.
 * Detects traffic source from UTM params and adjusts copy accordingly.
 * Rule: No forced account creation. No extra fields. One clear CTA per path.
 */

const PlanSelectorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<'trial' | 'annual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utmMedium = searchParams.get('utm_medium') || '';
  const preselect = searchParams.get('plan') || ''; // 'trial' | 'annual'

  // Source-aware copy: Section 13D
  const isFromPaidSocial = utmMedium === 'paid_social' || utmMedium === 'cpc';
  const isFromEmail = utmMedium === 'email';

  const getHeroSubcopy = () => {
    if (isFromPaidSocial) return 'Start full access for $1 today. Build something real this week. Cancel before day 8 if it\'s not for you.';
    if (isFromEmail) return 'Pick up where you left off. Your access is one step away.';
    return 'Get 7 days to build your first AI workflow. If it earns its keep, your access continues at $29.99/month. If not, cancel before day 8.';
  };

  useEffect(() => {
    // Auto-redirect if plan is already selected (e.g., from pricing page CTA)
    if (preselect === 'trial') {
      void handleTrialCheckout();
    } else if (preselect === 'annual') {
      void handleAnnualCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect]);

  const handleTrialCheckout = async () => {
    setError(null);
    setLoading('trial');
    try {
      trackCTAClick('plan_selector_trial', 'plan_selector_page', 'trial');
      pushAbandonmentFunnelState('checkout_started', 'pro_trial', 1);
      await startCheckoutForPlan('pro_trial');
    } catch (err: any) {
      console.error("Trial checkout failed:", err);
      setError(err?.message || "We could not generate your checkout link. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleAnnualCheckout = async () => {
    setError(null);
    setLoading('annual');
    try {
      trackCTAClick('plan_selector_annual', 'plan_selector_page', 'annual');
      pushAbandonmentFunnelState('checkout_started', 'pro_annual', 239);
      await startCheckoutForPlan('pro');
    } catch (err: any) {
      console.error("Annual checkout failed:", err);
      setError(err?.message || "We could not generate your checkout link. Please try again.");
    } finally {
      setLoading(null);
    }
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

        {/* Error notification block if Cloud Functions / App Check fail */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/25 rounded-2xl p-5 mb-8 text-sm text-red-200">
            <h3 className="font-bold text-white uppercase tracking-wider mb-2">Checkout Verification Notice</h3>
            <p className="leading-relaxed">{error}</p>
            <p className="text-xs text-red-400/80 mt-3">
              If you have an aggressive privacy shield or ad blocker enabled, it might be blocking the Stripe checkout generator. Try temporarily pausing it and refreshing this page.
            </p>
          </div>
        )}

        {/* TRIAL PATH */}
        <div className="bg-gray-900 border border-emerald-500 rounded-2xl p-8 mb-6">
          <div className="inline-block bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            LOWEST RISK
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Start full access for $1
          </h1>
          <p className="text-gray-300 mb-6 text-sm">
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
            disabled={loading !== null}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'trial' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Checkout...
              </>
            ) : (
              "Continue to Secure Checkout →"
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Cancel before day 8 in 2 clicks if it's not for you.
          </p>
        </div>

        {/* ANNUAL PATH */}
        <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-8 mb-8">
          <div className="inline-block bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            BEST VALUE
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Get the best price and full access today
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            Enjoy our elite academy rate of just $19.95 a month. Billed annually at $239 to unlock maximum savings.
          </p>

          {/* Dynamic charge summary — Annual */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Tuition Rate</span>
              <span className="text-white font-semibold">$19.95 / month</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Billed annually at $239 today</span>
              <span>Save over $120 vs standard monthly renewal</span>
            </div>
          </div>

          <button
            onClick={handleAnnualCheckout}
            disabled={loading !== null}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 px-8 rounded-xl text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'annual' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Checkout...
              </>
            ) : (
              "Subscribe for $19.95 a Month →"
            )}
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
