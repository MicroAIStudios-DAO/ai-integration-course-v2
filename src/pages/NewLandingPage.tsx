import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';
import FeedbackDrawer from '../components/feedback/FeedbackDrawer';
import LeadMagnetForm from '../components/lead-magnet/LeadMagnetForm';
import ExitIntentLeadMagnet from '../components/lead-magnet/ExitIntentLeadMagnet';
import { topWorkflowsLeadMagnet } from '../content/leadMagnets';

const NewLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent)]"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-pink-400/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-6 md:p-8">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          AI Integration Course
        </div>
        <div className="hidden md:flex space-x-6">
          <Link to="/courses" className="hover:text-cyan-400 transition-colors">Courses</Link>
          <Link to="/login" className="hover:text-cyan-400 transition-colors">Login</Link>
          <Link to="/pricing" className="bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 md:py-20">
        {/* Animated Avatar */}
        <div className="mb-8">
          <AnimatedAvatar size={120} />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Launch an AI Workflow That Pays Back in 14 Days
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-slate-300 mb-4 leading-relaxed">
          Stop collecting tutorials. Start with one workflow that removes repetitive work from your week and proves the ROI quickly.
        </p>
        <p className="text-md md:text-lg max-w-2xl text-slate-400 mb-8">
          Get your first win in 15 minutes. No fluff, no theory, just practical AI implementation with a direct business outcome.
        </p>

        {/* Premium Hero Visual */}
        <div className="w-full max-w-6xl mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-950/40 shadow-[0_20px_80px_rgba(15,23,42,0.55)]">
            <img
              src="/assets/hero_background_neural_network.png/hero_background_neural_network.png"
              alt="Premium AI systems and automation visual for AI Integration Course"
              className="h-[260px] w-full object-cover object-center md:h-[360px]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-between p-5 md:p-8">
              <div className="max-w-2xl text-left">
                <p className="mb-2 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Premium Training Experience
                </p>
                <h2 className="text-xl font-bold text-white md:text-3xl">
                  AI Integration Course Blueprint
                </h2>
                <p className="mt-2 text-sm text-slate-200 md:text-base">
                  Structured modules, practical workflows, and deployable automation systems.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/20 bg-slate-900/65 px-4 py-3 text-right backdrop-blur md:block">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Guarantee</p>
                <p className="text-lg font-bold text-white">14-Day Build Window</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Value Props */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="text-lg font-semibold mb-2">First Win in 15 Minutes</h3>
            <p className="text-sm text-slate-400">No lengthy setup. Complete your first AI project before your coffee gets cold.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🛠️</div>
            <h3 className="text-lg font-semibold mb-2">Built for Builders</h3>
            <p className="text-sm text-slate-400">Skip the theory. Every lesson ends with something you can use immediately.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI as Your Coach</h3>
            <p className="text-sm text-slate-400">Not just videos—an AI-enhanced accelerator that thinks with you and pushes you toward mastery.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            to="/pricing"
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            See Pricing
          </Link>
          <Link
            to="/courses"
            className="border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm transition-all hover:bg-white/5"
          >
            Explore Courses
          </Link>
        </div>

        {/* Email Capture */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-3 text-center">{topWorkflowsLeadMagnet.title}</h3>
          <p className="text-sm text-slate-300 mb-4 text-center">
            {topWorkflowsLeadMagnet.description}
          </p>
          <LeadMagnetForm source="new_landing_inline" theme="dark" />
          <p className="text-xs text-slate-400 mt-3 text-center">
            No spam. Unsubscribe anytime. Your data is secure.
          </p>
        </div>
      </div>

      {/* Floating AI Element */}
      <div className="absolute bottom-10 right-10 w-24 h-24 md:w-32 md:h-32 animate-bounce">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 opacity-80 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-2xl">
          AI
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} AI Integration Course. Guided by humans, built by AI.</p>
      </div>

      <FeedbackDrawer />
      <ExitIntentLeadMagnet source="new_landing_exit_intent" />
    </div>
  );
};

export default NewLandingPage;
