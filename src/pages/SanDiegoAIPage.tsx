import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const SanDiegoAIPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="AI Workshops in San Diego"
        description="AI integration training for San Diego and Southern California teams that want practical automation workflows, pilot planning, and implementation-focused education."
        url="/ai-workshops-san-diego"
        keywords={['AI workshops San Diego', 'AI training Southern California', 'AI integration San Diego']}
        author="Blaine Casey"
      />
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Local SEO Landing Page</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold">AI workshops and implementation training for San Diego teams</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            If your team is based in San Diego or Southern California and you want practical AI integration training, the course is structured around the exact gap most teams have: they know the tools exist, but they do not have a reliable rollout path.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h2 className="text-xl font-bold text-white">Operational Focus</h2>
              <p className="mt-3 text-slate-300">Map one repetitive workflow, define the automation boundary, and build a version the team can actually review and trust.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h2 className="text-xl font-bold text-white">Team Enablement</h2>
              <p className="mt-3 text-slate-300">Useful for founders, ops leads, and technical builders who need a shared implementation language instead of abstract AI hype.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h2 className="text-xl font-bold text-white">Pilot Mindset</h2>
              <p className="mt-3 text-slate-300">The emphasis is on one controlled pilot first, then expansion only after the workflow proves itself on speed, quality, and review coverage.</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <h2 className="text-2xl font-bold text-white">Suggested entry points</h2>
            <ul className="mt-4 space-y-2 text-slate-200">
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" /><span>Read the resource library to choose the right workflow model.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" /><span>Use the industry pages to see the safest first pilot for your team.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" /><span>Move into the paid curriculum when the team is ready to build.</span></li>
            </ul>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to="/solutions" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
                Explore industry pages
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanDiegoAIPage;
