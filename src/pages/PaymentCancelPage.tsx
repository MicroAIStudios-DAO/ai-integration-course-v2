import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPlanKeyFromSearch, getStoredPlanKey } from '../utils/checkout';

const OBJECTION_RESPONSES = [
  {
    icon: '💳',
    heading: 'Not sure about the price?',
    body: "The monthly plan is $29.99 — less than a single hour of consultant time. And if you don't ship your first AI workflow in 14 days, we refund every dollar. No risk.",
  },
  {
    icon: '⏱️',
    heading: "Worried you don't have time?",
    body: 'Lesson 1 takes under an hour and ends with a working automation. You don\'t need a block of time — you need one focused session.',
  },
  {
    icon: '🤔',
    heading: "Not sure it'll work for you?",
    body: 'You keep the source code even if you cancel. The 14-day guarantee means the only way you lose is if you never start.',
  },
];

const PaymentCancelPage = () => {
  const location = useLocation();
  const [objection] = useState(
    () => OBJECTION_RESPONSES[Math.floor(Math.random() * OBJECTION_RESPONSES.length)]
  );

  const planKey = getPlanKeyFromSearch(location.search) || getStoredPlanKey() || 'explorer';
  const planLabel =
    planKey === 'pro' ? 'Annual ($19.99/mo)' :
    planKey === 'corporate' ? 'Enterprise (5 seats)' :
    'Monthly ($29.99/mo)';
  const pricingUrl = `/pricing?plan=${planKey}&utm_source=cancel_page&utm_medium=recovery_cta&utm_campaign=checkout_cancel_recovery`;

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'checkout_cancelled',
        plan_key: planKey,
        page_location: window.location.href,
      });
    }
  }, [planKey]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full space-y-6">

        <div className="rounded-2xl border border-amber-400/20 bg-slate-900/70 p-8 text-center text-slate-100">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">No charge was made</h1>
          <p className="text-slate-300 leading-7 mb-1">
            Your checkout was not completed. Nothing was billed.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Your 14-day build guarantee still applies the moment you subscribe.
          </p>

          <Link
            to={pricingUrl}
            className="inline-flex w-full items-center justify-center rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300 mb-3"
          >
            Resume {planLabel} Checkout →
          </Link>

          <Link
            to="/pricing"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            See all plans
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 text-slate-200">
          <div className="text-2xl mb-2">{objection.icon}</div>
          <h2 className="text-base font-semibold text-white mb-1">{objection.heading}</h2>
          <p className="text-sm text-slate-400 leading-6">{objection.body}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
          <span>🔐 256-bit SSL</span>
          <span>✅ 14-Day Money-Back Guarantee</span>
          <span>🚫 No charge today</span>
          <span>📧 info@aiintegrationcourse.com</span>
        </div>

      </div>
    </div>
  );
};

export default PaymentCancelPage;
