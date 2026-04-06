import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscribeButton from '../components/payment/SubscribeButton';
import { trackViewPricing } from '../utils/analytics';
import useFoundingAccess from '../hooks/useFoundingAccess';
import SEO from '../components/SEO';
import RoiGuaranteeBadge from '../components/conversion/RoiGuaranteeBadge';
import ExitIntentLeadMagnet from '../components/lead-magnet/ExitIntentLeadMagnet';
import { getUserProfile, userHasPaidAccess } from '../firebaseService';
import { UserProfile } from '../types/course';
import { CheckoutPlanKey, formatPlanPrice, getCheckoutPlan } from '../config/pricing';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const explorerPlan = getCheckoutPlan('explorer_monthly');
  const proAnnualPlan = getCheckoutPlan('pro_annual');
  const corporatePlan = getCheckoutPlan('corporate_monthly');
  const { isFounding } = useFoundingAccess();
  const isPaidBetaEligible = profile?.isBetaTester === true && profile?.foundingMember !== true;
  const hasPaidBetaAccess = isPaidBetaEligible && userHasPaidAccess(profile);
  // Pro Annual is now the default featured plan
  const featuredPlanKey: CheckoutPlanKey = isPaidBetaEligible
    ? 'beta_monthly'
    : 'pro_annual';
  const featuredPlan = getCheckoutPlan(featuredPlanKey);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!currentUser) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await getUserProfile(currentUser.uid);
        if (active) {
          setProfile(nextProfile);
        }
      } catch (error) {
        console.error('Failed to load pricing profile:', error);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Track view_item event when pricing page loads
  useEffect(() => {
    trackViewPricing('USD', featuredPlan.amount, isPaidBetaEligible ? 'Paid Beta' : 'Pro Plan');
  }, [featuredPlan.amount, isPaidBetaEligible]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <SEO
        title="Pricing"
        description="Compare the Explorer, Pro, and Corporate plans for AI Integration Course. Start free, upgrade to the guided build path, or bring the training to your team."
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
            Ship Your First AI Workflow in 14 Days — Or Get Every Dollar Back
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Choose the path that fits your stage. Free to evaluate, Pro to deploy, Corporate to scale across your team.
          </p>

          {/* AUDIT: Risk Reversal - 14-Day Build Guarantee */}
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

        {/* Annual savings callout */}
        <div className="flex justify-center mb-12">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-6 py-3 inline-flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-emerald-300 font-medium">
              {isPaidBetaEligible
                ? 'Paid beta mirrors live subscriber billing.'
                : 'Pro plan saves $348/yr vs monthly — best value for serious builders.'}
            </span>
          </div>
        </div>


        {isFounding && (
          <div className="mb-10 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Founding Access Active</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Your founding benefits are already attached to this account.</h2>
            <p className="mt-3 max-w-3xl mx-auto text-sm leading-7 text-emerald-100">
              Pricing stays at three tiers for comparison, but you do not need a separate founding plan card. Your account already holds the permanent-access and priority-feedback benefits.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Explorer Tier - $29.99/mo */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Explorer</h3>
              <p className="text-gray-400">Start building with guided access</p>
            </div>
            <p className="mb-6 text-sm text-gray-400">Best for evaluating the teaching style, running your first workflow, and deciding if the full Pro path is right for you.</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${formatPlanPrice(explorerPlan.displayMonthlyPrice)}</span>
              <span className="text-gray-400">/month</span>
              <p className="text-xs text-gray-500 mt-1">Billed monthly</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All Introductory Lessons</span>
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
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>1 Guided Build Project</span>
              </li>
              <li className="flex items-start gap-3 text-gray-500">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Advanced Premium Lessons</span>
              </li>
              <li className="flex items-start gap-3 text-gray-500">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>AI Tutor Access</span>
              </li>
            </ul>

            {currentUser ? (
              <SubscribeButton
                planKey="explorer_monthly"
                priceId={explorerPlan.priceId}
                buttonText="Start Explorer"
                className="w-full py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
              />
            ) : (
              <Link
                to="/signup"
                className="block w-full text-center py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
              >
                Start Explorer
              </Link>
            )}
            <p className="text-center text-xs text-gray-500 mt-3">Payment info required • Cancel anytime</p>
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
              <h3 className="text-xl font-semibold text-white mb-2">{isPaidBetaEligible ? 'Paid Beta' : 'Pro'}</h3>
              <p className="text-gray-400">
                {isPaidBetaEligible ? 'Launch-week testing with real billing behavior' : 'Everything you need to build with AI'}
              </p>
            </div>
            <p className="mb-6 text-sm text-indigo-100">
              {isPaidBetaEligible
                ? 'Best for paid testers who should behave like production customers while still getting a tighter feedback loop and launch-week support.'
                : 'Best for solo builders, operators, and founders who want one production-ready workflow this month.'}
            </p>
            
            <div className="mb-6">
              {/* Price anchoring: show $49 slashed, $19.99 prominent */}
              {!isPaidBetaEligible && (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-gray-500 line-through decoration-red-500/70 decoration-2">${formatPlanPrice(49)}</span>
                  <span className="text-5xl font-black text-white">${formatPlanPrice(proAnnualPlan.displayMonthlyPrice)}</span>
                  <span className="text-gray-400">/mo</span>
                </div>
              )}
              {isPaidBetaEligible && (
                <div>
                  <span className="text-4xl font-bold text-white">${formatPlanPrice(featuredPlan.amount)}</span>
                  <span className="text-gray-400">/month</span>
                </div>
              )}
              {!isPaidBetaEligible && (
                <p className="text-xs text-gray-400 mt-2">Paid annually ($239.88/yr)</p>
              )}
              {isPaidBetaEligible && (
                <p className="text-sm text-cyan-300 mt-1">Paid beta is monthly-only and intentionally mirrors live subscriber billing.</p>
              )}
              {!isPaidBetaEligible && (
                <p className="text-xs text-emerald-400 mt-1 font-medium">Save $348/yr vs monthly</p>
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
                <span>{isPaidBetaEligible ? 'Priority bug reporting + direct beta feedback lane' : 'Monthly Live Q&A Sessions'}</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{isPaidBetaEligible ? 'Same paid access model you expect from launch users' : 'Private Community Access'}</span>
              </li>
            </ul>

            {/* AUDIT: Primary CTA - "Start Building Now" */}
            {isFounding || hasPaidBetaAccess ? (
              <Link
                to="/welcome"
                className="block w-full text-center py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"
              >
                {isFounding ? 'Open Founding Dashboard' : 'Open Beta Dashboard'}
              </Link>
            ) : currentUser ? (
              <SubscribeButton
                planKey={featuredPlanKey}
                priceId={featuredPlan.priceId}
                buttonText={isPaidBetaEligible ? 'Activate Paid Beta' : 'Start Building Now'}
                className="w-full py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              />
            ) : (
              <Link
                to="/signup"
                className="block w-full text-center py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                {isPaidBetaEligible ? 'Activate Paid Beta' : 'Start Building Now'}
              </Link>
            )}

            <p className="text-center text-sm text-gray-400 mt-4">
              {isFounding
                ? 'Permanent access active on this account'
                : isPaidBetaEligible
                  ? '$29.99/mo paid beta • No free bypass • Cancel anytime'
                  : '7-day free trial • Payment info required • Cancel anytime'}
            </p>
            {!isFounding && !isPaidBetaEligible && (
              <div className="mt-3 flex justify-center">
                <RoiGuaranteeBadge />
              </div>
            )}
          </div>

          {/* Corporate Tier - $149/mo with Stripe checkout */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Corporate</h3>
              <p className="text-gray-400">For teams and enterprises</p>
            </div>
            <p className="mb-6 text-sm text-gray-400">Best for organizations that need team rollout, private workshops, and direct implementation support.</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">${formatPlanPrice(corporatePlan.displayMonthlyPrice)}</span>
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

            {currentUser ? (
              <SubscribeButton
                planKey="corporate_monthly"
                priceId={corporatePlan.priceId}
                buttonText="Start Corporate Plan"
                className="w-full py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
              />
            ) : (
              <Link
                to="/signup"
                className="block w-full text-center py-3 px-6 rounded-lg border border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white font-medium transition-colors"
              >
                Start Corporate Plan
              </Link>
            )}
            <p className="text-center text-xs text-gray-500 mt-3">Payment info required • Cancel anytime</p>
          </div>
        </div>

        {/* Trust Badges Row under pricing cards */}
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

            {/* Objection handling: "Will this be outdated in 2 months?" */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
              <h4 className="text-lg font-semibold text-white mb-2">
                Will this course be outdated in 2 months?
              </h4>
              <p className="text-gray-400">
                This is the #1 question we get — and it’s the right one to ask. The curriculum is built around <strong className="text-white">implementation patterns, not specific model versions</strong>. When GPT-5 or Gemini Ultra drops, the prompting logic, workflow architecture, and deployment patterns you learn here transfer directly. We also push monthly content updates to reflect the latest APIs and tools. Pro members get every update at no extra cost, forever.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Why not just watch free YouTube tutorials?
              </h4>
              <p className="text-gray-400">
                YouTube gives you fragments. This course gives you a <strong className="text-white">complete, sequenced build path</strong> from your first API call to a production-deployed automation — with an AI tutor to unblock you in real time. The difference is shipping something that works versus spending 40 hours watching videos and still not having a deployed bot.
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
            If you are still evaluating, start free. If you are ready to ship, take the Pro path and move into checkout.
          </p>
          <Link
            to={isFounding ? "/welcome" : currentUser ? "/courses" : "/signup"}
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
