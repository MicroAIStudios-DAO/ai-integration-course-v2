import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes this one of the better AI courses online for real business use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most AI courses online teach the tools — how to prompt ChatGPT, how to use Gemini, how to call an API. This course teaches integration: prompt patterns, RAG, function calling, and workflow automation, wrapped around a live AI tutor grounded in the course content so answers stay in context.'
      }
    },
    {
      '@type': 'Question',
      name: 'Are there free AI courses online I can try before paying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The free tier includes the foundational lessons of Module 1 with no credit card required. You can decide whether the pedagogy fits before moving to premium or founding-member access.'
      }
    },
    {
      '@type': 'Question',
      name: 'How does this compare to Coursera, DataCamp, and Udemy AI courses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Coursera and DataCamp are strong for foundational ML theory and certifications. Udemy is a marketplace with variable quality. This course is opinionated and outcome-focused: it teaches AI integration for one workflow at a time, with a tutor that answers questions in the context of the current lesson.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do I need a technical background to take this AI course online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The course is built for both non-coders (business owners, operators, investors) and developers. Lessons alternate between conceptual grounding and hands-on setup, and the AI tutor rewrites explanations at the level the learner asks for.'
      }
    },
    {
      '@type': 'Question',
      name: 'What tools and models does the course cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'OpenAI, Anthropic Claude, and Google Gemini for model work; embedding models for RAG; function-calling patterns that apply across providers. The Resource Library also covers model selection tradeoffs directly.'
      }
    }
  ]
};

const COMPARISON = [
  { feature: 'Focus', us: 'Ship AI in one workflow', them: 'Certifications and theory' },
  { feature: 'Feedback loop', us: 'RAG-grounded AI tutor', them: 'Forum threads or none' },
  { feature: 'Operational content', us: 'Cost, monitoring, deployment', them: 'Ends at the model' },
  { feature: 'Free tier', us: 'Real lessons, no card', them: 'Preview clips only' },
  { feature: 'Pricing model', us: 'Founding + premium', them: 'Per-course or per-seat sub' }
];

const AICoursesOnlinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="AI Courses Online: Ship Real AI in Your Business (Not Just Certs)"
        description="Most AI courses online teach you about AI. This one teaches you to integrate it into workflows and investments — with an AI tutor, 39 lessons, and founding-member access."
        url="/ai-courses-online"
        keywords={[
          'AI courses online',
          'best AI courses online',
          'online AI course',
          'AI integration course',
          'free AI courses online',
          'AI course for business owners'
        ]}
        author="Blaine Casey"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-14">
        {/* Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">AI Courses Online</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold sm:text-5xl">
            AI courses online — built to deploy, not just to watch
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            The market is full of AI courses online. Most of them teach the tools and hand you a certificate at the end. This one is structured around a different outcome: at the end of the curriculum you can point at a workflow in your business or research process that is running with AI in it. 39 lessons, 7 modules, an AI tutor grounded in the course content, and a founding-member track.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Start the free tier
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              See premium options
            </Link>
          </div>
        </div>

        {/* Why most fail */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Why most AI courses online fail once the video ends</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            You have probably taken one of these already. It walks through ChatGPT, then Claude, then Gemini. Each demo is impressive. Then the course ends, you go back to your day-to-day, and you cannot point at a single business task that is now different because of what you learned.
          </p>
          <p className="mt-4 text-slate-300 leading-relaxed">
            The gap is not information. The gap is <strong className="text-white">integration</strong>: connecting a model to a real workflow, deciding when to use RAG versus fine-tuning, routing model output to a downstream action, and keeping the whole thing affordable at scale. That is what this course teaches, and it is what almost every other AI course online skips.
          </p>
        </section>

        {/* What integration actually means */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">What "AI integration" actually means for a small business or investor</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Integration means the model produces work that hits your existing systems automatically. For a small business, that might be a support triage flow that reads inbound tickets, classifies them, drafts a response, and posts to your helpdesk queue for human review. For an investor, that might be a research pipeline that ingests SEC filings, extracts a specific pattern, and writes a summary card into your CRM.
          </p>
          <p className="mt-4 text-slate-300 leading-relaxed">
            In both cases, the AI is a component in a workflow — not a standalone tool a human has to babysit. Building that reliably is what the course teaches. If you want to see the underlying technique first, read our{' '}
            <Link to="/library/rag-for-small-business" className="text-cyan-300 hover:text-cyan-200 underline">RAG for small business primer</Link>{' '}
            or the{' '}
            <Link to="/library/function-calling-with-gemini-1-5-pro" className="text-cyan-300 hover:text-cyan-200 underline">function-calling deep dive</Link>.
          </p>
        </section>

        {/* Structure */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">How the course is structured</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Seven modules, 39 lessons, one AI tutor grounded in the course itself. Modules move from foundations to prompt engineering to RAG to function calling to workflow automation to production ops to investment applications. Every subscriber can ask the tutor questions and get answers pulled from the current lesson context — not generic model output.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">39 lessons, sequenced</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">Each unlocks the next. Skip-friendly if you already know a topic.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">AI tutor with RAG</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">Ask questions and the tutor cites the lesson content directly.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">Resource library</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">Deep dives on RAG, function calling, and model selection.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Open the curriculum
            </Link>
            <Link to="/tutor" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Meet the AI tutor
            </Link>
          </div>
        </section>

        {/* Free vs premium */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Free vs premium — what you can try today</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Free tier</p>
              <h3 className="mt-2 text-xl font-bold text-white">Real lessons, no credit card</h3>
              <p className="mt-3 text-slate-300 leading-relaxed">The foundational lessons of Module 1 are free so you can test the pedagogy before you decide.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Premium and founding</p>
              <h3 className="mt-2 text-xl font-bold text-white">Full curriculum + AI tutor</h3>
              <p className="mt-3 text-slate-200 leading-relaxed">All 39 lessons, RAG-based AI tutor, resource library, and priority updates. Founding-member pricing is locked for the life of the plan.</p>
            </div>
          </div>
          <div className="mt-6">
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Compare pricing
            </Link>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">This course vs the big AI course platforms</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Coursera, DataCamp, Udemy, and edX all have serious AI content. They also all optimize for a different job — usually credentialing or breadth. Here is where the difference shows up:
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 pr-4 font-semibold text-white">Dimension</th>
                  <th className="py-3 pr-4 font-semibold text-cyan-300">This course</th>
                  <th className="py-3 font-semibold text-slate-300">Coursera / DataCamp / Udemy</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white">{row.feature}</td>
                    <td className="py-3 pr-4 text-slate-200">{row.us}</td>
                    <td className="py-3 text-slate-400">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm text-slate-400">
            Not a takedown — the big platforms are the right choice for certifications and breadth. This course is the right choice when the goal is one shipped workflow, not a resume line.
          </p>
        </section>

        {/* Who this is for */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Who this course is for</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            The pedagogy is industry-neutral. The first pilot changes based on where you operate — see the industry pages for a concrete first-workflow recommendation:
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/solutions/real-estate" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">Real estate operators</p>
              <p className="mt-1 text-sm text-slate-300">Listings, lead qualification</p>
            </Link>
            <Link to="/solutions/e-commerce" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">E-commerce owners</p>
              <p className="mt-1 text-sm text-slate-300">Descriptions, support triage</p>
            </Link>
            <Link to="/solutions/law-firms" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">Law firms</p>
              <p className="mt-1 text-sm text-slate-300">Doc review, client intake</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 space-y-6">
            {FAQ_SCHEMA.mainEntity.map((q, i) => (
              <div key={i}>
                <h3 className="text-lg font-bold text-white">{q.name}</h3>
                <p className="mt-2 text-slate-300 leading-relaxed">{q.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-10 rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Pick the AI course online that ships</h2>
          <p className="mt-3 text-slate-200">Preview Module 1 free. Upgrade when the pedagogy clicks.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Start the free tier
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoursesOnlinePage;
