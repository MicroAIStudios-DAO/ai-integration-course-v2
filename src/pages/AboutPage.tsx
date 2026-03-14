import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const GITHUB_REPO_URL = 'https://github.com/MicroAIStudios-DAO/ai-integration-course-v2';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="About Blaine Casey"
        description="Meet Blaine Casey and the AI Integration Course mission: practical AI implementation for operators, business owners, and developers shipping real workflows."
        url="/about"
        keywords={['Blaine Casey', 'AI Integration Course instructor', 'AI automation training', 'San Diego AI training']}
        author="Blaine Casey"
      />
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">About the Instructor</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">Blaine Casey builds AI systems that are meant to ship</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">
            AI Integration Course exists for founders, operators, and developers who are done collecting theory and want a practical path to deployment. The teaching style is implementation-first: identify the workflow, define the tool contract, add review points, then ship something useful.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-950">Project Themes</h2>
              <p className="mt-3 text-slate-700">Customer service email bots, FAQ copilots, reporting workflows, AI readiness assessments, and practical tool-calling systems.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-950">Who This Serves</h2>
              <p className="mt-3 text-slate-700">Business owners who need leverage, operators who need cleaner workflows, and developers who want a stable integration pattern instead of prompt theater.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-bold text-slate-950">Local Angle</h2>
              <p className="mt-3 text-slate-700">The course also speaks directly to San Diego and Southern California teams looking for AI implementation training without generic enterprise fluff.</p>
            </div>
          </div>

          <section className="mt-10 rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
            <h2 className="text-2xl font-bold text-slate-950">Proof of competence matters</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              In AI education, people buy the operator as much as the curriculum. That is why the site emphasizes real build paths, deploy checklists, and a live AI-enhanced course experience instead of generic motivational copy.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                View GitHub repository
              </a>
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100">
                See the course plan
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
