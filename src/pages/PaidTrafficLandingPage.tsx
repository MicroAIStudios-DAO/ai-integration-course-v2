import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

// P0 FIX: Attribution param keys to capture and persist through the funnel
const ATTRIBUTION_KEYS = ['gclid', 'utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'] as const;

const PaidTrafficLandingPage: React.FC = () => {
  useEffect(() => {
    // P0 FIX: Capture Google Ads and UTM attribution params from the landing URL
    // and persist them in sessionStorage so they survive navigation through
    // /pricing → Stripe checkout → account creation and can be passed to Stripe metadata.
    const params = new URLSearchParams(window.location.search);
    for (const key of ATTRIBUTION_KEYS) {
      const val = params.get(key);
      if (val) sessionStorage.setItem(key, val);
    }
    trackEvent('paid_landing_view', 'landing_page', 'start_page');
  }, []);

  const handleCTAClick = (location: string) => {
    trackEvent('paid_landing_cta_click', 'conversion', location);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Minimal Nav */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        <div className="text-xl font-bold text-white">
          AI Integration Course
        </div>
        {/* P1 FIX: Pass plan param so LoginPage can restore intended_plan for returning users */}
        <Link
          to="/login?plan=explorer"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Already a member? Log in
        </Link>
      </nav>

      {/* Hero — outcome-driven, high-intent conversion */}
      <section className="px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-4xl mx-auto text-center">
        <p className="inline-block mb-6 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-sm font-medium tracking-wide">
          Your first AI automation is one lesson away
        </p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
          Stop watching AI tutorials.
          <span className="block text-cyan-400 mt-2">Start building AI that works for you.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          A hands-on curriculum where every lesson ends with a real workflow you can use tomorrow.
          Pick a plan, go straight into secure checkout, then create your login after payment.
        </p>

        <Link
          to="/pricing"
          onClick={() => handleCTAClick('hero')}
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg px-10 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40 hover:scale-[1.02]"
        >
          See Plans & Start Building
        </Link>
        <p className="mt-4 text-sm text-slate-500">
          Choose your plan first. Checkout comes immediately. Login creation happens right after payment.
        </p>
      </section>

      {/* Before / After — emotional contrast */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What changes after your first week
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Before */}
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-red-500/10">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">Before</p>
              <ul className="space-y-3">
                {[
                  'Spending hours on tasks AI could handle in minutes',
                  'Watching tutorials that never connect to real work',
                  'Unsure which AI tools actually matter for your role',
                  'Falling behind while everyone talks about "using AI"',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400 text-sm">
                    <span className="text-red-400/60 mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-emerald-500/15">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">After</p>
              <ul className="space-y-3">
                {[
                  'AI workflows running that save you real hours every week',
                  'Confidence to build automations for any repeatable task',
                  'A portfolio of working AI integrations, not just theory',
                  'The skillset employers and clients are paying premium for',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200 text-sm">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll build — tangible outcomes, not features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          What you'll actually build
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          Not slideshows. Not theory. Every lesson produces something you can use at work the next day.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-2xl mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Workflows</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automate the repetitive work that eats your day — reports, emails, data entry, content drafts — with workflows you build yourself.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-2xl mb-4">
              🧠
            </div>
            <h3 className="text-lg font-semibold mb-2">Custom AI Integrations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect AI to the tools you already use. No CS degree needed — we walk you through every line, every API call, every deployment.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-2xl mb-4">
              🚀
            </div>
            <h3 className="text-lg font-semibold mb-2">A Skill That Compounds</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every automation you build teaches you patterns that apply to the next one. By lesson 5, you're not following instructions — you're designing solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Who this is for — identity-driven */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Built for builders, not bystanders
          </h2>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              'Business owners who want AI working for them, not another tool to manage',
              'Operators and managers who automate instead of hiring',
              'Freelancers who 3x their output without 3x-ing their hours',
              'Career-switchers who want the skill everyone is hiring for',
              'Developers adding AI to their stack for the first time',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-white/5">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — simple, fast, low friction */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          From checkout to first build in under an hour
        </h2>

        <div className="space-y-8 max-w-2xl mx-auto">
          {[
            {
              step: '1',
              title: 'Choose the plan that fits',
              desc: 'Start on pricing so intent is clear and checkout friction stays low.',
            },
            {
              step: '2',
              title: 'Complete secure checkout',
              desc: 'Choose your plan and go directly into Stripe without a signup wall interrupting the purchase.',
            },
            {
              step: '3',
              title: 'Create your login and start building',
              desc: 'After payment, create your login once so your access, progress, and billing stay attached to the same account.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-5">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof — credibility, not vanity metrics */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">5</p>
              <p className="text-sm text-slate-400 mt-1">Free lessons to prove it works</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">50+</p>
              <p className="text-sm text-slate-400 mt-1">Hours of advanced builds in Pro</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">14 days</p>
              <p className="text-sm text-slate-400 mt-1">Money-back guarantee, no questions</p>
            </div>
          </div>

          <blockquote className="max-w-lg mx-auto">
            <p className="text-slate-300 text-sm italic leading-relaxed">
              "I came in skeptical. By lesson 3, I had an AI workflow running that saved me
              4 hours a week on client reports. This isn't a course — it's an unfair advantage."
            </p>
          </blockquote>
        </div>
      </section>

      {/* FAQ — objection handling */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Common questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'What do I get for free?',
                a: 'Full access to 5 structured lessons — each one ends with a working AI workflow. No time limit on the free tier. Build at your own pace.',
              },
              {
                q: 'Do I need to know how to code?',
                a: 'No. The curriculum starts from scratch. Some lessons use Python, but we walk you through every step — copy, paste, customize, deploy. If you can follow a recipe, you can do this.',
              },
              {
                q: 'What is Pro and when would I need it?',
                a: 'Pro unlocks 50+ hours of advanced builds, a personal AI tutor that answers your questions in context, and live Q&A sessions. Most people try the free lessons first, then upgrade when they want to go deeper. From $19.99/month (billed annually) with a 14-day money-back guarantee.',
              },
              {
                q: 'How is this different from YouTube or ChatGPT?',
                a: 'YouTube teaches concepts. ChatGPT gives answers. Neither gives you a structured path from zero to deployed AI workflows. This course builds your skills lesson by lesson — each one stacks on the last — so you actually retain and apply what you learn.',
              },
              {
                q: 'How long until I see results?',
                a: 'Your first working AI automation by the end of lesson 1. Most people complete that in under an hour. By lesson 5, you\'ll have the pattern recognition to build automations on your own.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — urgency + outcome */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Your competitors are already using AI.
          <span className="block text-cyan-400 mt-1">Catch up in one lesson.</span>
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Pick your plan, create your account, and finish checkout in one clean flow.
        </p>
        <Link
          to="/pricing"
          onClick={() => handleCTAClick('footer')}
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg px-10 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40 hover:scale-[1.02]"
        >
          See Pricing
        </Link>
        <p className="mt-4 text-sm text-slate-500">
          Pricing first. Account second. Checkout third.
        </p>
      </section>

      {/* Minimal footer */}
      <footer className="px-6 py-8 border-t border-white/5 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 mb-4">
          <Link to="/pricing" className="hover:text-slate-300 transition-colors">Full Pricing</Link>
          <Link to="/about" className="hover:text-slate-300 transition-colors">About</Link>
          <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
        </div>
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} AI Integration Course. All rights reserved.
        </p>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-950/95 backdrop-blur border-t border-white/10 p-4 z-50">
        <Link
          to="/pricing"
          onClick={() => handleCTAClick('mobile_sticky')}
          className="block w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center py-3.5 rounded-xl"
        >
          See Pricing
        </Link>
      </div>
    </div>
  );
};

export default PaidTrafficLandingPage;
