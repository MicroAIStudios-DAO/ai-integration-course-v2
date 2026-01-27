import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscribeButton from '../components/payment/SubscribeButton';
import { trackViewPricing } from '../utils/analytics';

/**
 * PricingPage Component
 * 
 * AUDIT REQUIREMENT: Pricing Page Anchoring
 * Place a $999 "Corporate" tier (Contact Sales) next to the $49/mo Pro plan.
 * Makes Pro plan look like a "no-brainer" bargain.
 * 
 * AUDIT REQUIREMENT: Risk Reversal
 * Add "14-Day Build-Your-First-Bot Guarantee".
 * If they don't build a bot, they get a refund. Specificity builds trust.
 * 
 * AUDIT REQUIREMENT: CTA Hierarchy
 * Primary: "Start Building Now" (Paid). Secondary: "View Curriculum".
 * Resolve competing CTAs to focus on the outcome.
 */
const PricingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const proMonthlyPrice = 49;

  // Track view_item event when pricing page loads
  useEffect(() => {
    trackViewPricing('USD', proMonthlyPrice, 'Pro Plan');
  }, []);
  const proAnnualPrice = 39; // $39/mo billed annually ($468/year)
  const corporatePrice = 999;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white">
              AI Integration<span className="text-indigo-400">Course</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/courses" className="text-gray-300 hover:text-white transition-colors">
                Curriculum
              </Link>
              {currentUser ? (
                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Building with AI Today
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of professionals who are integrating AI into their businesses.
            Get your first win in 15 minutes with our hands-on curriculum.
          </p>

          {/* AUDIT: Risk Reversal - 14-Day Build Guarantee */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-3 text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-semibold">14-Day Build Guarantee</span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual <span className="text-emerald-400 ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Tier - View Curriculum */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Explorer</h3>
              <p className="text-gray-400">Get started with free lessons</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-400">/forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>5 Free Introductory Lessons</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Community Access</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic AI Tools Overview</span>
              </li>
              <li className="flex items-start gap-3 text-gray-500">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Premium Lessons</span>
              </li>
              <li className="flex items-start gap-3 text-gray-500">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>AI Tutor Access</span>
              </li>
            </ul>

            {/* AUDIT: Secondary CTA - "View Curriculum" */}
            <Link
              to="/courses"
              className="block w-full text-center py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
            >
              View Curriculum
            </Link>
          </div>

          {/* Pro Tier - FEATURED */}
          <div className="bg-gradient-to-b from-indigo-900/50 to-slate-800/50 border-2 border-indigo-500 rounded-2xl p-8 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
              <p className="text-gray-400">Everything you need to build with AI</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">
                ${billingCycle === 'monthly' ? proMonthlyPrice : proAnnualPrice}
              </span>
              <span className="text-gray-400">/month</span>
              {billingCycle === 'annual' && (
                <p className="text-sm text-emerald-400 mt-1">Billed annually (${proAnnualPrice * 12}/year)</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>All Premium Lessons</strong> (50+ hours)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>AI Tutor</strong> - 24/7 Personalized Help</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Build Your First Bot</strong> - Guided Project</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Certificate of Completion</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Private Community Access</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Monthly Live Q&A Sessions</span>
              </li>
            </ul>

            {/* AUDIT: Primary CTA - "Start Building Now" */}
            {currentUser ? (
              <SubscribeButton 
                priceId={billingCycle === 'monthly' ? 'price_pro_monthly' : 'price_pro_annual'}
                buttonText="Start Building Now"
                className="w-full py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              />
            ) : (
              <Link
                to="/signup"
                className="block w-full text-center py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                Start Building Now
              </Link>
            )}

            <p className="text-center text-sm text-gray-400 mt-4">
              7-day free trial • Cancel anytime
            </p>
          </div>

          {/* AUDIT: Corporate Tier - $999 Anchoring */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Corporate</h3>
              <p className="text-gray-400">For teams and enterprises</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${corporatePrice}</span>
              <span className="text-gray-400">/month</span>
              <p className="text-sm text-gray-500 mt-1">Per team (up to 25 seats)</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Everything in Pro</strong></span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Up to 25 Team Members</strong></span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Dedicated Account Manager</strong></span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom AI Integration Consulting</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Private Team Workshops</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority Support & SLA</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>SSO & Admin Dashboard</span>
              </li>
            </ul>

            <a
              href="mailto:enterprise@aiintegrationcourse.com?subject=Corporate%20Plan%20Inquiry"
              className="block w-full text-center py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* AUDIT: Risk Reversal - 14-Day Guarantee Section */}
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
                <h3 className="text-2xl font-bold text-white mb-4">
                  14-Day Build Guarantee
                </h3>
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

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                What is the 14-day guarantee?
              </h4>
              <p className="text-gray-400">
                Build your first working AI Agent in 14 days, or we refund every penny. You keep the source code.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. You'll continue to have access 
                until the end of your billing period.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                What's included in the AI Tutor?
              </h4>
              <p className="text-gray-400">
                Our AI Tutor is available 24/7 to answer your questions, help debug your code, 
                explain concepts, and guide you through projects. It's like having a personal 
                AI instructor always available.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Is the Corporate plan worth it?
              </h4>
              <p className="text-gray-400">
                The Corporate plan is designed for teams who want dedicated support, custom 
                workshops, and enterprise features like SSO. For individual learners, the Pro 
                plan offers everything you need at a fraction of the cost.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Build Your First AI Solution?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of professionals who are already building with AI.
          </p>
          <Link
            to={currentUser ? "/courses" : "/signup"}
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-colors"
          >
            Start Building Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-400 text-sm">
              © 2025 AI Integration Course. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <a href="mailto:support@aiintegrationcourse.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
