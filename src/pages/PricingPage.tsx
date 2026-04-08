import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscribeButton from '../components/payment/SubscribeButton';
import { trackViewPricing } from '../utils/analytics';
import useFoundingAccess from '../hooks/useFoundingAccess';
import SEO from '../components/SEO';
import RoiGuaranteeBadge from '../components/conversion/RoiGuaranteeBadge';
import ExitIntentLeadMagnet from '../components/lead-magnet/ExitIntentLeadMagnet';
import { PlanKey, plans, formatPlanPrice } from '../config/pricing';
import { storePlanKey } from '../utils/checkout';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PricingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFounding } = useFoundingAccess();

  const explorer = plans.explorer;
  const pro = plans.pro;
  const corporate = plans.corporate;

  useEffect(() => {
    trackViewPricing('USD', pro.analyticsValue, pro.name);
  }, [pro.analyticsValue, pro.name]);

  const renderCTA = (planKey: PlanKey) => {
    const plan = plans[planKey];

    if (isFounding) {
      return (
        <Link
          to="/welcome"
          className="block w-full text-center py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"
        >
          Open Founding Dashboard
        </Link>
      );
    }

    if (currentUser) {
      return (
        <SubscribeButton
          planKey={planKey}
          buttonText={plan.ctaText}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            plan.featured
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : planKey === 'corporate'
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        />
      );
    }

    return (
      <Link
        to="/signup"
        onClick={() => storePlanKey(planKey)}
        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
          plan.featured
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : planKey === 'corporate'
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        {plan.ctaText}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <SEO
        title="Pricing"
        description="Compare the Explorer, Pro AI Architect, and Team plans for AI Integration Course. Start the 7-day Explorer trial, or go annual and save 50%."
        url="/pricing"
        keywords={[
          'AI Integration Course pricing',
          'AI automation course cost',
          'AI course for business owners',
          'Gemini API course pricing'
        ]}
        author="Blaine Casey"
      />

      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white">
              AI Integration<span className="text-indigo-400">Course</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/courses" className="text-gray-300 hover:text-white transition-colors">Curriculum</Link>
              {currentUser ? (
                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
              ) : (
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ship Your First AI Workflow in 14 Days — Or Get Every Dollar Back
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Start free. Go Pro to deploy. Scale your team with shared, audited AI workflows.
          </p>
          <RoiGuaranteeBadge className="px-6 py-3 text-sm" />

          <div className="mt-10 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto text-left">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Outcome</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Ship one real workflow</h2>
              <p className="mt-2 text-sm text-gray-300">The course is designed around getting from lesson to implementation, not endless theory.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Support</p>
              <h2 className="mt-2 text-lg font-semibold text-white">AI tutor plus guided project</h2>
              <p className="mt-2 text-sm text-gray-300">Use the tutor, the build path, and the curriculum together so you can move faster with fewer stalls.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Risk</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Guarantee stays specific</h2>
              <p className="mt-2 text-sm text-gray-300">If you do not build your first working AI agent in 14 days, the course gets refunded.</p>
            </div>
          </div>
        </div>

        {isFounding && (
          <div className="mb-10 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Founding Access Active</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Your founding benefits are already attached to this account.</h2>
            <p className="mt-3 max-w-3xl mx-auto text-sm leading-7 text-emerald-100">
              Pricing stays at three tiers for comparison, but you do not need a separate plan. Your account already holds the permanent-access and priority-feedback benefits.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Explorer */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">{explorer.name}</h3>
              <p className="text-gray-400">{explorer.tagline}</p>
            </div>
            <p className="mb-6 text-sm text-gray-400">
              Best for evaluating the teaching style, lesson quality, and your first workflow idea before committing.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${formatPlanPrice(explorer.displayPrice)}</span>
              <span className="text-gray-400">{explorer.intervalLabel}</span>
              <p className="text-sm text-emerald-400 mt-1">7-day trial starts right away</p>
            </div>

            <ul className="space-y-4 mb-8">
              {explorer.features.map((f, i) => (
                <li key={i} className={`flex items-start gap-3 ${f.included ? 'text-gray-300' : 'text-gray-500'}`}>
                  {f.included ? <CheckIcon /> : <XIcon />}
                  <span className={f.bold ? 'font-semibold' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA('explorer')}
            <p className="text-center text-sm text-gray-400 mt-4">
              Cancel anytime during the first 7 days.
            </p>
          </div>

          {/* Pro AI Architect — FEATURED */}
          <div className="bg-gradient-to-b from-indigo-900/50 to-slate-800/50 border-2 border-indigo-500 rounded-2xl p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Best Value
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">{pro.name}</h3>
              <p className="text-gray-400">{pro.tagline}</p>
            </div>
            <p className="mb-6 text-sm text-indigo-100">
              Best for solo builders, operators, and founders who want one production-ready workflow this month.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                {pro.anchorMonthlyPrice && (
                  <span className="text-lg text-gray-500 line-through">${formatPlanPrice(pro.anchorMonthlyPrice)}/mo</span>
                )}
              </div>
              <span className="text-4xl font-bold text-white">
                ${formatPlanPrice(pro.monthlyEquivalent || pro.displayPrice)}
              </span>
              <span className="text-gray-400">/mo</span>
              <p className="text-sm text-emerald-400 mt-1">
                ${formatPlanPrice(pro.displayPrice)}/year &mdash; billed annually
              </p>
              <p className="text-xs text-indigo-300 mt-1">Save 50% vs monthly equivalent</p>
            </div>

            <ul className="space-y-4 mb-8">
              {pro.features.map((f, i) => (
                <li key={i} className={`flex items-start gap-3 ${f.included ? 'text-gray-300' : 'text-gray-500'}`}>
                  {f.included ? <CheckIcon /> : <XIcon />}
                  <span className={f.bold ? 'font-semibold' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA('pro')}
            <p className="text-center text-sm text-gray-400 mt-4">
              14-day build guarantee &middot; Cancel anytime
            </p>
            {!isFounding && (
              <div className="mt-3 flex justify-center">
                <RoiGuaranteeBadge />
              </div>
            )}
          </div>

          {/* Corporate / Team AI Standard */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">{corporate.name}</h3>
              <p className="text-gray-400">{corporate.tagline}</p>
            </div>
            <p className="mb-6 text-sm text-gray-400">
              Stop your team from guessing prompts. Standardize your AI operations with a shared library of audited, high-performance agents.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${formatPlanPrice(corporate.displayPrice)}</span>
              <span className="text-gray-400">{corporate.intervalLabel}</span>
              <p className="text-sm text-gray-500 mt-1">Up to {corporate.seatCount} seats included</p>
            </div>

            <ul className="space-y-4 mb-8">
              {corporate.features.map((f, i) => (
                <li key={i} className={`flex items-start gap-3 ${f.included ? 'text-gray-300' : 'text-gray-500'}`}>
                  {f.included ? <CheckIcon /> : <XIcon />}
                  <span className={f.bold ? 'font-semibold' : ''}>{f.text}</span>
                </li>
              ))}
            </ul>

            {renderCTA('corporate')}

            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                If this saves a 5-person team one hour each per week, it pays for itself almost immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            256-bit SSL Secure Checkout
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            1,200+ Builders Enrolled
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            14-Day Money-Back Guarantee
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Updated Monthly for 2026
          </div>
        </div>

        {/* 14-Day Guarantee Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">14-Day Build Guarantee</h3>
                <p className="text-gray-300 mb-4">
                  Build your first working AI Agent in 14 days, or we refund every penny. You keep the source code.
                </p>
                <p className="text-sm text-gray-400">
                  Outcome-based, time-bound, and risk-free. We only win when you ship.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">What is the 14-day guarantee?</h4>
              <p className="text-gray-400">Build your first working AI Agent in 14 days, or we refund every penny. You keep the source code.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">How does the Explorer free trial work?</h4>
              <p className="text-gray-400">Your Explorer access starts immediately and runs for 7 days. If you decide it is not right for you, cancel during the trial window. If you stay active, the plan continues at $29.99/month.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Why is Pro billed annually?</h4>
              <p className="text-gray-400">Pro AI Architect is designed for committed builders. Annual billing gives you a 50% discount versus monthly pricing, and you get uninterrupted access to all updates for a full year.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-400">Yes! You can cancel your subscription at any time. You will continue to have access until the end of your billing period.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">What is included in the Team plan?</h4>
              <p className="text-gray-400">Team AI Standard includes up to 5 seats, shared workflow libraries with audited agent templates, priority support, and a team progress dashboard. If your team needs more than 5 seats, contact us.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
              <h4 className="text-lg font-semibold text-white mb-2">Will this course be outdated in 2 months?</h4>
              <p className="text-gray-400">The curriculum is built around implementation patterns, not specific model versions. We push monthly content updates to reflect the latest APIs and tools. All plan members get every update at no extra cost.</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Why not just watch free YouTube tutorials?</h4>
              <p className="text-gray-400">YouTube gives you fragments. This course gives you a complete, sequenced build path from your first API call to a production-deployed automation — with an AI tutor to unblock you in real time.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Build Your First AI Solution?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Start the 7-day Explorer trial, or save 50% with the Pro annual plan.
          </p>
          <Link
            to={isFounding ? '/welcome' : currentUser ? '/courses' : '/signup'}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-colors"
          >
            {isFounding ? 'Open Founding Dashboard' : 'Start Building Now'}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          {!isFounding && !currentUser && (
            <div className="mt-4 flex justify-center">
              <RoiGuaranteeBadge />
            </div>
          )}
        </div>
      </main>

      <ExitIntentLeadMagnet source="pricing_exit_intent" />

      <footer className="border-t border-slate-700/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-400 text-sm">&copy; 2025 AI Integration Course. All rights reserved.</div>
            <div className="flex gap-6">
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <a href="mailto:support@aiintegrationcourse.com" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
