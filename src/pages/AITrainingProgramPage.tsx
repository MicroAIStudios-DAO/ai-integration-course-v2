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
      name: 'What is an AI training program and how is it different from an AI course?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An AI training program is a structured learning path with milestones, capstone work, and team-ready outcomes — not a single video series. Most standalone AI courses end when the last video plays; a training program is designed so that at the end you can actually ship an AI-integrated workflow.'
      }
    },
    {
      '@type': 'Question',
      name: 'How long does this AI training program take to complete?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The full curriculum is 39 lessons across 7 modules. A focused learner working 3–4 hours per week finishes the core path in 8–10 weeks. Founding members and premium subscribers keep access after that so teams can revisit specific modules as they scale.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you offer team pricing for the AI training program?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Founding-member access covers group licensing at a flat rate, and premium tier pricing is per-seat. The Pricing page has the current options, or contact us for teams above five seats.'
      }
    },
    {
      '@type': 'Question',
      name: 'What will I actually be able to build after finishing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A working prompt-engineering system for one repeatable workflow in your business, a RAG-based knowledge assistant scoped to your own content, and a function-calling pipeline that routes AI output to a real downstream action like an email, a CRM update, or a spreadsheet write.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is coding experience required?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The training program is designed for both non-coders (business owners, operators, investors) and developers. Lessons alternate between conceptual grounding and hands-on setup, and the AI tutor answers questions in the context of the current lesson.'
      }
    }
  ]
};

const MODULES = [
  { n: 1, title: 'Foundations of AI Integration', focus: 'What models can and cannot do, prompt patterns, tool selection' },
  { n: 2, title: 'Prompt Engineering for Real Workflows', focus: 'From ad-hoc prompts to reusable, versioned system prompts' },
  { n: 3, title: 'Retrieval-Augmented Generation (RAG)', focus: 'Grounding AI in your own documents, embeddings, chunking, retrieval quality' },
  { n: 4, title: 'Function Calling and Tool Use', focus: 'Turning AI output into real actions in downstream systems' },
  { n: 5, title: 'Workflow Automation with AI', focus: 'End-to-end automation of a single business process, with review checkpoints' },
  { n: 6, title: 'Deployment, Monitoring, and Cost Control', focus: 'Shipping to production, tracking usage, keeping the bill sane' },
  { n: 7, title: 'AI for Investment and Research', focus: 'Applying the same patterns to research, screening, and decision workflows' }
];

const AITrainingProgramPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="AI Training Program for Teams and Solo Operators"
        description="A structured AI training program teaching real integration — prompt engineering, RAG, function calling, workflow automation — with tier-gated lessons and a live AI tutor."
        url="/ai-training-program"
        keywords={[
          'AI training program',
          'AI training for business',
          'corporate AI training',
          'AI integration training',
          'AI upskilling program',
          'team AI training'
        ]}
        author="Blaine Casey"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-14">
        {/* Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">AI Training Program</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold sm:text-5xl">
            An AI training program that ends with you actually using AI
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Most AI training programs stop at the theory. This one is built so that at the end of the curriculum you can point to a workflow in your business — or your research process — that is now running with AI in the loop. 39 lessons, 7 modules, an AI tutor grounded in the course itself, and a founding-member track for teams that want to lock in access.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              See pricing and team options
            </Link>
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Preview the curriculum
            </Link>
          </div>
        </div>

        {/* Why programs fail */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Why most AI training programs never translate to shipped work</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Three failure modes account for almost every abandoned AI training program we have seen:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span><strong className="text-white">Tool tours instead of workflows.</strong> The program shows how to use ChatGPT, Claude, and Gemini one by one, but never walks through a single end-to-end workflow that produces business value.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span><strong className="text-white">No feedback loop.</strong> There is nowhere to ask context-specific questions, so learners get stuck at the first real-world edge case and quietly drop off.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span><strong className="text-white">Missing the ops layer.</strong> The program teaches the model but not the deployment, cost, and monitoring realities of running AI in a real business.</span></li>
          </ul>
          <p className="mt-5 text-slate-300 leading-relaxed">
            This program is structured to close all three gaps. Every module ends with something concrete you can point at, the AI tutor is trained on the course content so questions get grounded answers, and Module 6 is dedicated to the operational reality of running AI in production.
          </p>
        </section>

        {/* Curriculum grid */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">The 7-module AI training curriculum</h2>
          <p className="mt-3 text-slate-300">
            Sequenced so that each module unlocks the next. You can start on the free tier at Module 1 and move up when you are ready.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {MODULES.map((m) => (
              <div key={m.n} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Module {m.n}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{m.focus}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Open the full curriculum
            </Link>
          </div>
        </section>

        {/* AI Tutor differentiator */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">The AI tutor is not ChatGPT with a wrapper</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Every subscriber gets access to a retrieval-augmented AI tutor grounded in the actual course content. When you ask a question mid-lesson, the tutor pulls the relevant lesson passages first and answers in context — so you do not get generic model-hallucinated advice that contradicts what you just learned.
          </p>
          <p className="mt-4 text-slate-300 leading-relaxed">
            The RAG architecture behind the tutor is the same one Module 3 teaches you to build. If you want the technical breakdown, our <Link to="/library/rag-for-small-business" className="text-cyan-300 hover:text-cyan-200 underline">RAG for small business guide</Link> walks through the pattern end-to-end.
          </p>
        </section>

        {/* Team pricing */}
        <section className="mt-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-8">
          <h2 className="text-2xl font-bold">Team access and founding-member pricing</h2>
          <p className="mt-4 text-slate-200 leading-relaxed">
            The training program is designed for both solo operators and teams. Premium subscriptions are per-seat; founding-member access covers group licensing at a flat rate and locks in the current price for the life of the plan.
          </p>
          <ul className="mt-4 space-y-2 text-slate-200">
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span>Free tier: preview the first module before committing.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span>Premium: full curriculum, AI tutor, resource library.</span></li>
            <li className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /><span>Founding member: group access, priority support, locked pricing.</span></li>
          </ul>
          <div className="mt-6">
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Compare plans
            </Link>
          </div>
        </section>

        {/* Outcomes */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">What a graduate can actually build</h2>
          <p className="mt-3 text-slate-300">
            Three concrete outcomes learners have built while working through the training program:
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">A prompt system for one workflow</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">A versioned, reusable prompt for one repeatable business task — email triage, listing writeups, contract summarization — that a non-technical teammate can run.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">A RAG assistant on your own content</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">An AI assistant grounded in your own documents — SOPs, product docs, case files, research notes — so answers cite your material instead of guessing.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-lg font-bold text-white">A function-calling pipeline</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">AI output routed to a real downstream action — a CRM update, a Slack message, a Google Sheet row — so the model does not just talk, it moves the workflow forward.</p>
            </div>
          </div>
        </section>

        {/* Industry lenses */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-bold">Same curriculum, different first pilots</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            The training program is industry-neutral, but the first pilot workflow changes based on the operator. See the industry pages for the concrete first-pilot recommendation in your field:
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/solutions/real-estate" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">Real estate</p>
              <p className="mt-1 text-sm text-slate-300">Listing writeups and lead qualification</p>
            </Link>
            <Link to="/solutions/e-commerce" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">E-commerce</p>
              <p className="mt-1 text-sm text-slate-300">Product descriptions and support triage</p>
            </Link>
            <Link to="/solutions/law-firms" className="rounded-xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <p className="font-bold text-white">Law firms</p>
              <p className="mt-1 text-sm text-slate-300">Document review and client-intake drafting</p>
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
          <h2 className="text-2xl font-bold">Ready to start the training program?</h2>
          <p className="mt-3 text-slate-200">Preview the first module free, then move up when it clicks.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/courses" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Start with Module 1
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              Go premium
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITrainingProgramPage;
