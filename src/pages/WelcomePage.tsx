import React from "react";
import { Link } from "react-router-dom";
import ReactPlayer from "react-player";

const WELCOME_VIDEO_URL = "https://youtu.be/smkBKoxwzdE";

const ONBOARDING_STEPS = [
  {
    order: 1,
    label: "Visit the Homepage",
    why: "Get a feel for the overall experience",
    icon: "🏠",
  },
  {
    order: 2,
    label: 'Click "Courses" in the nav',
    why: "Browse the course catalog",
    icon: "📚",
  },
  {
    order: 3,
    label: "Open any lesson",
    why: "Experience the AI-enhanced lesson format",
    icon: "▶️",
  },
  {
    order: 4,
    label: "Try the AI Chat Tutor",
    why: "Ask it a question about something you're learning",
    icon: "🤖",
  },
  {
    order: 5,
    label: "Visit your Profile",
    why: "Set up your avatar and learning preferences",
    icon: "👤",
  },
];

const FEEDBACK_STEPS = [
  'Look for the "Founding Access" button in the bottom-left corner of any page',
  "Click it — a feedback panel will slide open",
  "Choose a category: Bug, Feature Request, or General Feedback",
  "Describe what you experienced in as much detail as you can",
  "Hit Submit — it goes directly to our development team",
];

const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12">

        {/* ── Pioneer Badge ── */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/40 px-5 py-2 text-sm font-semibold text-amber-300 uppercase tracking-[0.15em]">
            🚀 Pioneer Cohort — Founding Access
          </span>
        </div>

        {/* ── Hero ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-8">
          <h1 className="text-3xl md:text-4xl font-headings font-extrabold text-white text-center">
            Your Pioneer Cohort access is now live.
          </h1>
          <p className="mt-4 text-lg text-slate-300 text-center max-w-2xl mx-auto">
            Here is everything you need to get started and how to make the most of the next two weeks.
          </p>

          {/* Welcome Video */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 bg-black/30">
            <div className="w-full" style={{ aspectRatio: "16/9" }}>
              <ReactPlayer
                url={WELCOME_VIDEO_URL}
                width="100%"
                height="100%"
                controls
                className="react-player"
              />
            </div>
          </div>
        </div>

        {/* ── Step 1: Create Account ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">1</span>
            <h2 className="text-xl font-headings font-bold text-white">Create Your Account</h2>
          </div>
          <ol className="space-y-3 text-slate-300 text-sm">
            {[
              <>Go to <a href="https://aiintegrationcourse.com" className="text-cyan-400 underline" target="_blank" rel="noreferrer">aiintegrationcourse.com</a></>,
              <>Click <strong className="text-white">"Get Started"</strong> in the top right corner</>,
              "Sign up with your email address and create a password",
              "Check your inbox for a verification email and confirm your address",
              "Log back in — you will be taken directly to the platform",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-slate-400 mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 text-sm text-cyan-200">
            <strong>Note:</strong> Your account has already been flagged as a beta tester on our end. Once you log in, your Pioneer access will activate automatically.
          </div>
        </div>

        {/* ── Step 2: Explore ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">2</span>
            <h2 className="text-xl font-headings font-bold text-white">Explore the Platform</h2>
          </div>
          <p className="text-slate-400 text-sm mb-5">
            Take 15–20 minutes to explore freely. We recommend this path:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-slate-400 font-semibold w-10">Order</th>
                  <th className="text-left py-2 pr-4 text-slate-400 font-semibold">What to Do</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {ONBOARDING_STEPS.map((step) => (
                  <tr key={step.order} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-center">
                      <span className="text-lg">{step.icon}</span>
                    </td>
                    <td className="py-3 pr-4 text-white font-medium">{step.label}</td>
                    <td className="py-3 text-slate-400">{step.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Step 3: Submit Feedback ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</span>
            <h2 className="text-xl font-headings font-bold text-white">
              Submit Feedback{" "}
              <span className="text-emerald-400 text-base font-normal">(This Is the Most Important Part)</span>
            </h2>
          </div>
          <p className="text-slate-400 text-sm mb-5">
            We have made it as easy as possible to give feedback without leaving the page you are on.
          </p>

          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-[0.15em] mb-3">How to submit feedback:</h3>
          <ol className="space-y-2 mb-6">
            {FEEDBACK_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs text-emerald-300 mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-[0.15em] mb-3">What makes great feedback:</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "For bugs", tip: 'Tell us exactly what you did, what you expected to happen, and what actually happened. The more specific, the faster we can fix it.' },
              { label: "For UX issues", tip: '"This was confusing because..." is more useful than "this is bad."' },
              { label: "For feature requests", tip: "Describe the problem you were trying to solve, not just the solution you imagined." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-[0.12em] mb-2">{item.label}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-8 py-4 font-semibold text-white hover:bg-cyan-700 transition-colors text-lg"
          >
            Go to Courses →
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 font-semibold text-slate-300 hover:bg-white/5 transition-colors text-lg"
          >
            Back to Homepage
          </Link>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;
