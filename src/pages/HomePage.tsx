import React, { useMemo } from 'react';
import AnimatedAvatar from '../components/layout/AnimatedAvatar';
import { useAuth } from '../context/AuthContext';
import { appConfig } from '../config/environment';
import SEO from '../components/SEO';
import CourseSchema from '../components/seo/CourseSchema';
import FeedbackDrawer from '../components/feedback/FeedbackDrawer';
import LeadMagnetForm from '../components/lead-magnet/LeadMagnetForm';
import ExitIntentLeadMagnet from '../components/lead-magnet/ExitIntentLeadMagnet';
import { topWorkflowsLeadMagnet, agenticReadinessScorecard } from '../content/leadMagnets';
import {
  homepageFaqItems,
  homepageVideoObject,
} from '../content/marketingPages';
import { trackFreeStarterOptIn } from '../utils/analytics';

const buildExternalUrl = (baseUrl: string, path: string): string => {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const resolvedUrl = new URL(baseUrl);
    resolvedUrl.pathname = normalizedPath;
    resolvedUrl.search = '';
    resolvedUrl.hash = '';
    return resolvedUrl.toString();
  } catch {
    return path;
  }
};

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const handleFreeStarterOptIn = (source: string) => () => {
    trackFreeStarterOptIn(source, '/courses');
  };
  const { baseUrl } = appConfig;
  const nav = useMemo(() => ({
    home: baseUrl,
    lab: buildExternalUrl(baseUrl, '/welcome'),
    courses: buildExternalUrl(baseUrl, '/courses'),
    local: buildExternalUrl(baseUrl, '/ai-workshops-san-diego'),
    login: buildExternalUrl(baseUrl, '/login'),
    signup: buildExternalUrl(baseUrl, '/pricing'),
    pricing: buildExternalUrl(baseUrl, '/pricing'),
    about: buildExternalUrl(baseUrl, '/about'),
    blogs: buildExternalUrl(baseUrl, '/blogs'),
    library: buildExternalUrl(baseUrl, '/library'),
    solutions: buildExternalUrl(baseUrl, '/solutions'),
    contact: buildExternalUrl(baseUrl, '/contact'),
    faq: buildExternalUrl(baseUrl, '/faq'),
    tutor: buildExternalUrl(baseUrl, '/tutor'),
    terms: buildExternalUrl(baseUrl, '/terms'),
    privacy: buildExternalUrl(baseUrl, '/privacy'),
  }), [baseUrl]);

  return (
    <>
      <SEO
        title="Stop Chatting, Start Architecting | AI Integration Course"
        description="Learn to build, deploy, and govern autonomous AI workflows. Practical agentic systems training for operators and developers."
        url="/"
        keywords={[
          'How to build agentic workflows with LiteLLM',
          'Python AI automation for real estate agents',
          'Replacing Zapier with custom AI agents',
          'Gemini 1.5 Pro vs Claude for local data processing',
          'Integrating Serper API with local Python scripts',
          'AI governance strategies for S-Corps 2026',
          'How to build a personalized content distribution engine',
          'San Diego AI consulting and integration workshops',
          'Moving from prompt engineering to systems architecture',
          'Retrieval-Augmented Generation RAG for small business',
        ]}
        author="Blaine Casey"
      />
      <CourseSchema
        includeFaqSchema
        faqItems={homepageFaqItems}
        includeVideoSchema
        videoObject={homepageVideoObject}
      />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.12),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_36%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)] text-slate-100 overflow-hidden">

        {/* NAVBAR */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-10">
          <a href={nav.home} className="text-xl font-black uppercase tracking-[0.06em] text-white hover:opacity-80 transition-opacity">
            AI Integration Course
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-slate-300">
            <a href={nav.lab} className="hover:text-cyan-300 transition-colors">The Lab</a>
            <a href={nav.courses} className="hover:text-cyan-300 transition-colors">
              {currentUser ? 'My Curriculum' : 'Curriculum'}
            </a>
            <a href={nav.blogs} className="hover:text-cyan-300 transition-colors">Blog</a>
            <a href={nav.local} className="hover:text-cyan-300 transition-colors">San Diego Workshops</a>
            {currentUser ? (
              <a href={buildExternalUrl(baseUrl, '/billing')} className="hover:text-cyan-300 transition-colors">Account</a>
            ) : (
              <a href={nav.login} className="hover:text-cyan-300 transition-colors">Login</a>
            )}
          </div>
          {currentUser ? (
            <a
              href={nav.courses}
              className="hidden md:inline-flex rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-cyan-300 hover:bg-cyan-400/20 transition-colors"
            >
              My Curriculum &rarr;
            </a>
          ) : (
            <a
              href={nav.pricing}
              className="hidden md:inline-flex rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-colors"
            >
              Get Started
            </a>
          )}
          <button className="md:hidden text-white" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </nav>

        {/* HERO */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-20 text-center md:pt-16 md:pb-28">
          <div className="mb-8 flex justify-center">
            <AnimatedAvatar size={100} />
          </div>
          <p className="mb-6 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
            Hands-On AI Training. Build Real Workflows Today
          </p>

          <h1 className="mx-auto max-w-4xl text-5xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-7xl lg:text-8xl">
            Stop&nbsp;Chatting.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Start&nbsp;Architecting.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            The internet is moving from LLMs to Agentic Systems. Learn to build, deploy,
            and govern autonomous AI workflows that run your business operations.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={nav.pricing}
              className="inline-flex flex-col items-center rounded-2xl bg-cyan-500 px-8 py-4 text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30 hover:scale-[1.02]"
            >
              <span className="text-base font-bold uppercase tracking-[0.1em]">Ship Your First Agent This Week</span>
              <span className="text-xs font-semibold mt-1 opacity-80">$29.99/mo &mdash; 14-day money-back guarantee</span>
            </a>
            <a
              href="#demo"
              className="inline-flex items-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold uppercase tracking-[0.1em] text-white backdrop-blur transition-all hover:border-white/25 hover:bg-white/10"
            >
              Watch the Day 1 Demo
            </a>
          </div>
          {/* TRUST BAR */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="flex items-center gap-2"><span className="text-cyan-400">&#10003;</span> No prior ML experience required</span>
            <span className="flex items-center gap-2"><span className="text-cyan-400">&#10003;</span> Works on Windows &amp; Mac</span>
            <span className="flex items-center gap-2"><span className="text-cyan-400">&#10003;</span> Cancel anytime</span>
          </div>

        </section>

        {/* PROBLEM / SOLUTION SPLIT */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-rose-400/15 bg-rose-500/[0.06] p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-300/80">The Old Way</p>
              <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">Copy-pasting into ChatGPT all day.</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Manual prompts. No memory. No integration. Every task starts from scratch.
                You\u2019re using a $200B technology stack as a search bar.
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.06] p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">The 2026 Way</p>
              <h3 className="mt-4 text-2xl font-bold text-white md:text-3xl">One script. Autonomous execution. Integrated APIs.</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Your agent pulls live data, processes it through your business logic, and outputs
                distribution-ready assets \u2014 while you move on to the next decision.
              </p>
            </div>
          </div>
        </section>

        {/* 2-MIN DEMO VIDEO */}
        <section id="demo" className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">See It In Action</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Watch the Day 1 Script Demo
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              See the exact Content Architect workflow you will build \u2014 from raw transcript to
              30-day distribution engine in one execution.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950/60 shadow-2xl">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/smkBKoxwzdE?rel=0"
                title="AI Integration Course Day 1 Script Demo"
                className="w-full h-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </section>
        {/* AGENTIC READINESS SCORECARD — Audit #1 Fastest Win */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.04] p-8 md:p-10">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Free Assessment</p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                {agenticReadinessScorecard.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                {agenticReadinessScorecard.description}
              </p>
            </div>
            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
              {agenticReadinessScorecard.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <a
                href={agenticReadinessScorecard.downloadPath}
                className="inline-flex items-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02]"
              >
                {agenticReadinessScorecard.ctaLabel}
              </a>
              <p className="mt-3 text-xs text-slate-500">{agenticReadinessScorecard.instantAccessLabel}</p>
            </div>
          </div>
        </section>

        {/* CURRICULUM PREVIEW */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Strategic Intel</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Curriculum Pipeline
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { num: '01', title: 'The Content Architect', copy: 'Turn raw transcripts into a 30-day distribution engine. Environment setup on Windows and Mac.', status: 'Live', accent: 'cyan' },
              { num: '02', title: 'The Informed Agent', copy: 'Integrating Serper.dev for real-time web awareness. Ground every output in 2026 facts.', status: 'Live', accent: 'emerald' },
              { num: '03', title: 'Persistent Memory', copy: 'Connecting your agents to vector databases for long-term recall and context continuity.', status: 'Next Week', accent: 'slate' },
            ].map((mod) => (
              <div
                key={mod.num}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-5">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-lg font-black text-white">
                    {mod.num}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{mod.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{mod.copy}</p>
                  </div>
                </div>
                <span className={`inline-flex flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${
                  mod.accent === 'cyan'
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                    : mod.accent === 'emerald'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-white/15 bg-white/5 text-slate-300'
                }`}>
                  {mod.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/courses/course_01_id/modules/module_01_id/lessons/lesson_founders_01_content_architect"
              className="inline-flex items-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:scale-[1.02]"
            >
              Run the Content Architect Script
            </a>
            <a href={nav.courses} onClick={handleFreeStarterOptIn('homepage_curriculum_details')} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
              View full curriculum details &rarr;
            </a>
          </div>
        </section>

        {/* MID-PAGE CTA — close value-action gap after curriculum preview */}
        <section className="relative z-10 mx-auto max-w-2xl px-6 pb-16 text-center">
          <p className="text-base text-slate-300">
            Ready to start with a clear plan and a real workflow outcome?
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={nav.pricing}
              className="inline-flex items-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:scale-[1.02]"
            >
              View Plans &amp; Pricing
            </a>
            <a
              href={nav.signup}
              className="text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Or go straight to pricing &rarr;
            </a>
          </div>
        </section>

        {/* 3-STEP QUICK START */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">How It Works</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              From Zero to Running Agent in 3 Steps
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
              No PhD required. No cloud infrastructure to configure. Just a laptop, a terminal, and this course.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-7">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-black text-slate-950">1</span>
              <h3 className="mt-2 text-lg font-bold text-white">Set Up Your Environment</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Follow the Day 1 walkthrough to install Python, configure your API keys, and run your first agent script locally &mdash; on Windows or Mac.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">~45 minutes</p>
            </div>
            <div className="relative rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-7">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-slate-950">2</span>
              <h3 className="mt-2 text-lg font-bold text-white">Build the Content Architect</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Turn a raw transcript into a 30-day content distribution engine. Your first real agentic workflow &mdash; end-to-end, no hand-holding.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">Module 01 &mdash; Live Now</p>
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-sm font-black text-white">3</span>
              <h3 className="mt-2 text-lg font-bold text-white">Connect Live Data &amp; Ship</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Integrate Serper.dev for real-time web awareness. Ground every agent output in current facts, then deploy to your actual business workflow.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Module 02 &mdash; Live Now</p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <a
              href={nav.pricing}
              className="inline-flex items-center rounded-2xl bg-cyan-500 px-8 py-4 text-base font-bold uppercase tracking-[0.1em] text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:scale-[1.02]"
            >
              Start Step 1 Today
            </a>
          </div>
        </section>

        {/* PRICING CTA */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
          <div className="rounded-3xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(6,182,212,0.10),rgba(16,185,129,0.06),transparent_60%)] p-10 text-center md:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Your Investment</p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
              Build one workflow. Then decide.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Choose the billing option that fits how you buy. Then move directly into account
              creation and checkout without a free-account detour slowing conversion.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-2xl font-black text-cyan-300">$29.99</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Monthly or $19.99/mo annually</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-2xl font-black text-emerald-300">50+</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Hours of advanced builds</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-2xl font-black text-white">14-Day</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Money-back guarantee</p>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href={nav.pricing}
                className="inline-flex items-center rounded-2xl bg-cyan-500 px-8 py-4 text-base font-bold uppercase tracking-[0.1em] text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:scale-[1.02]"
              >
                View Plans
              </a>
              <a
                href={nav.signup}
                className="inline-flex items-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold uppercase tracking-[0.1em] text-white transition-all hover:border-white/25 hover:bg-white/10"
              >
                Start With Pricing
              </a>
            </div>
          </div>
        </section>
        {/* LEAD MAGNET */}
        <section className="relative z-10 mx-auto max-w-md px-6 pb-24">
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur text-center">
            <h3 className="text-xl font-bold text-white">{topWorkflowsLeadMagnet.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{topWorkflowsLeadMagnet.description}</p>
            <div className="mt-5">
              <LeadMagnetForm source="homepage_inline" theme="dark" />
            </div>
            <p className="mt-3 text-xs text-slate-500">No spam. Unsubscribe anytime.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {homepageFaqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-bold text-white">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href={nav.faq} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              View the full FAQ page \u2192
            </a>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
            Deploy Your First Agent
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            The cohort is small on purpose. Get in, run the script, and ship something real this week.
          </p>
          <div className="mt-8">
            <a
              href={nav.pricing}
              className="inline-flex items-center rounded-2xl bg-cyan-500 px-10 py-4 text-lg font-bold uppercase tracking-[0.1em] text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:scale-[1.02]"
            >
              Start Building Today
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 border-t border-white/10 px-6 py-10 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AI Integration Course. Built by humans, powered by agents.</p>
          <p className="mt-2 text-xs text-slate-600">San Diego, California &mdash; AI consulting, workshops, and integration training</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
            <a href={nav.courses} className="hover:text-cyan-300 transition-colors">Curriculum</a>
            <a href={nav.blogs} className="hover:text-cyan-300 transition-colors">Blog</a>
            <a href={nav.library} className="hover:text-cyan-300 transition-colors">Library</a>
            <a href={nav.solutions} className="hover:text-cyan-300 transition-colors">Industries</a>
            <a href={nav.local} className="hover:text-cyan-300 transition-colors">SD Workshops</a>
            <a href={nav.about} className="hover:text-cyan-300 transition-colors">About</a>
            <a href={nav.contact} className="hover:text-cyan-300 transition-colors">Contact</a>
            <a href={nav.terms} className="hover:text-cyan-300 transition-colors">Terms</a>
            <a href={nav.privacy} className="hover:text-cyan-300 transition-colors">Privacy</a>
          </div>
        </footer>

        {/* FLOATING MOBILE CTA — Audit Section 6 UX recommendation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur md:hidden">
          <a
            href={nav.pricing}
            className="flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 text-sm font-bold uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-400"
          >
            Get Started &mdash; Monthly $29.99
          </a>
        </div>

        <FeedbackDrawer />
        <ExitIntentLeadMagnet source="homepage_exit_intent" />
      </div>
    </>
  );
};

export default HomePage;
