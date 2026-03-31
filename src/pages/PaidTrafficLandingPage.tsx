import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

const PaidTrafficLandingPage: React.FC = () => {
  useEffect(() => {
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
        <Link
          to="/login"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Already a member? Log in
        </Link>
      </nav>

      {/* Hero — ONE clear message, ONE CTA */}
      <section className="px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-4xl mx-auto text-center">
        <p className="inline-block mb-6 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-sm font-medium tracking-wide">
          100% Free — No credit card required
        </p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
          Learn to automate your work with AI
          <span className="block text-cyan-400 mt-2">— 5 free lessons, zero risk</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          A structured, hands-on curriculum that teaches you to build real AI workflows.
          Start free. Upgrade only if it works for you.
        </p>

        <Link
          to="/signup"
          onClick={() => handleCTAClick('hero')}
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg px-10 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40 hover:scale-[1.02]"
        >
          Start Your Free AI Curriculum
        </Link>
        <p className="mt-4 text-sm text-slate-500">
          Join 1,200+ builders already learning. Takes 30 seconds to sign up.
        </p>
      </section>

      {/* What you get — plain language */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What you get — completely free
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">5 Structured Lessons</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Not random YouTube tutorials. A real curriculum that builds on
                itself — from AI fundamentals to your first working automation.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Hands-On Projects</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every lesson ends with something you can use at work.
                Build an AI workflow, not just watch someone else do it.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Access</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Learn alongside other builders. Ask questions, share wins,
                and see how others are using AI in their day-to-day work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Built for people who work, not just developers
        </h2>

        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            'Business owners who want AI to save time, not create more work',
            'Operators and managers tired of copy-pasting between tools',
            'Freelancers who want to deliver more without hiring',
            'Developers exploring AI integration for the first time',
            'Anyone curious about AI but overwhelmed by where to start',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof — simple */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">1,200+</p>
              <p className="text-sm text-slate-400 mt-1">Builders enrolled</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">5</p>
              <p className="text-sm text-slate-400 mt-1">Free lessons included</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-cyan-400">14 days</p>
              <p className="text-sm text-slate-400 mt-1">Money-back guarantee on Pro</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm italic max-w-lg mx-auto">
            "I came in skeptical, but the free lessons alone taught me more about
            practical AI than months of watching YouTube videos."
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How it works
        </h2>

        <div className="space-y-8 max-w-2xl mx-auto">
          {[
            {
              step: '1',
              title: 'Sign up free',
              desc: 'Create your account in 30 seconds. No credit card. No commitments.',
            },
            {
              step: '2',
              title: 'Complete 5 lessons at your pace',
              desc: 'Work through the free curriculum — structured, hands-on, and practical.',
            },
            {
              step: '3',
              title: 'Decide if you want more',
              desc: 'If the free lessons clicked, unlock 50+ hours of advanced content with Pro. If not, you lose nothing.',
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

      {/* FAQ — objection handling */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Common questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Is it really free?',
                a: 'Yes. 5 full lessons, no credit card required, no time limit. The free tier is permanent — it never expires.',
              },
              {
                q: 'Do I need to know how to code?',
                a: 'No. The curriculum starts from scratch and explains everything in plain language. Some lessons use Python, but we walk you through every step.',
              },
              {
                q: 'What happens after the free lessons?',
                a: 'You can keep your free account forever. If you want more, Pro unlocks 50+ hours of advanced lessons, an AI tutor, and live Q&A for $49/month — with a 14-day money-back guarantee.',
              },
              {
                q: "How is this different from YouTube tutorials?",
                a: "YouTube teaches concepts. This teaches execution. Every lesson ends with a working workflow you can use. The curriculum is structured — each lesson builds on the last.",
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

      {/* Final CTA */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Start learning AI — for free, right now
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          5 lessons. Zero risk. Upgrade only if it works.
        </p>
        <Link
          to="/signup"
          onClick={() => handleCTAClick('footer')}
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg px-10 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40 hover:scale-[1.02]"
        >
          Start Your Free AI Curriculum
        </Link>
        <p className="mt-4 text-sm text-slate-500">
          No credit card required. Cancel anytime.
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
          to="/signup"
          onClick={() => handleCTAClick('mobile_sticky')}
          className="block w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center py-3.5 rounded-xl"
        >
          Start Free — No Credit Card
        </Link>
      </div>
    </div>
  );
};

export default PaidTrafficLandingPage;
