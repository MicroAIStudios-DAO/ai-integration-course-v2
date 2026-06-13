import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { trackFreeStarterOptIn } from '../utils/analytics';
import { BRAND } from '../config/brand';

const LINKEDIN_URL = 'https://www.linkedin.com/in/blainecasey';

const CASE_STUDIES = [
  {
    title: 'Marketing Agency — Client Onboarding Automation',
    result: 'Reduced manual onboarding time from 4 hours to 22 minutes using a Gemini-powered intake bot and Zapier workflow.',
    industry: 'Marketing Agency',
  },
  {
    title: 'E-Commerce Brand — Customer Service Email Bot',
    result: 'Automated a large share of tier-1 support email responses with a fine-tuned bot, freeing 15+ hours per week for a 3-person team.',
    industry: 'E-Commerce',
  },
  {
    title: 'SaaS Startup — AI Readiness Assessment',
    result: 'Delivered a structured AI readiness report identifying 6 automatable workflows, prioritised by ROI, in a single sprint.',
    industry: 'SaaS',
  },
];

const AboutPage: React.FC = () => {
  const handleFreeStarterOptIn = () => {
    trackFreeStarterOptIn('about_browse_free_lessons', '/courses');
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="About Blaine Casey — AI Integration Course Instructor"
        description="Blaine Casey is an AI Solutions Architect and the instructor behind AI Integration Course. Learn about his verified industry experience, real client case studies, and the methodology behind practical AI automation training for marketing agencies, SaaS teams, and operators."
        url="/about"
        keywords={[
          'Blaine Casey AI instructor',
          'AI integration course for marketing agencies',
          'how to automate client onboarding with AI',
          'AI automation training San Diego',
          'practical AI course for business owners',
          'AI Integration Course instructor credentials',
        ]}
        author="Blaine Casey"
      />

      <div className="mx-auto max-w-5xl px-4 py-14">

        {/* ── Hero Bio Card ── */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            About the Instructor
          </p>

          <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-start">
            {/* Avatar placeholder — swap src for a real headshot */}
            <div className="flex-shrink-0">
              <div className="h-36 w-36 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-extrabold shadow-lg select-none">
                BC
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-headings font-extrabold text-slate-950">
                Blaine Casey
              </h1>
              <p className="mt-1 text-base font-semibold text-cyan-700">
                AI Solutions Architect · Founder, {BRAND.ventureName} · San Diego, CA
              </p>

              {/* Credential badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Google Cloud Certified',
                  'Firebase App Developer',
                  'Gemini API Practitioner',
                  '10+ Years Software Engineering',
                  'Shipped 30+ AI Workflows',
                ].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-lg leading-relaxed text-slate-700">
                Blaine Casey has spent over a decade building software systems that ship — not decks that impress. He founded {BRAND.ventureName} to close the gap between AI hype and real operational leverage for founders, operators, and developers who need results in weeks, not quarters.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                His methodology is implementation-first: identify the workflow, define the tool contract, add human review checkpoints, then deploy something that earns its keep. Every lesson in AI Integration Course is drawn from a real client engagement or internal build — not recycled YouTube content.
              </p>

              {/* Verifiable links */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004182] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn Profile
                </a>

              </div>
            </div>
          </div>
        </div>

        {/* ── Why This Platform Exists ── */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-headings font-bold text-slate-950">
            Why AI Integration Course exists
          </h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            Most AI education teaches you how tools work. This course teaches you how to make them work <em>for your specific operation</em>. The curriculum was built backwards from the question: "What does a founder or operator need to deploy in the next 14 days to get a measurable return?" Every module answers that question with a concrete build path, not a lecture.
          </p>
          <p className="mt-4 leading-relaxed text-slate-700">
            The platform is also built to stay current. AI tooling evolves monthly. The curriculum is reviewed and updated on the same cadence, and every lesson notes the last-updated date so you always know you are learning against the current state of the ecosystem — not a snapshot from 18 months ago.
          </p>
        </div>

        {/* ── Verified Case Studies ── */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-headings font-bold text-slate-950">
            Verified client outcomes
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            The following results are drawn from real engagements. Industry and company names are anonymised at client request.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {CASE_STUDIES.map((cs) => (
              <div key={cs.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                  {cs.industry}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900">{cs.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{cs.result}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Methodology ── */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Implementation-First',
              body: 'Every lesson ends with a deployable artefact — a bot, a workflow, a prompt template, or a checklist — not a quiz.',
            },
            {
              title: 'Specific Tooling',
              body: 'Gemini API, Firebase, Zapier, OpenAI, and n8n. No vague "use AI" advice. Exact tool contracts and code snippets.',
            },
            {
              title: 'Always Updated',
              body: 'Curriculum reviewed monthly. Each lesson shows its last-updated date. You will never pay for stale content.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-950">
            Ready to build your first AI automation?
          </h2>
          <p className="mt-3 text-slate-700">
            Join founders, operators, and developers building real AI workflows with a structured, build-first path. 14-Day Build Guarantee.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-700 transition-colors"
            >
              See the course plan →
            </Link>
            <Link
              to="/courses"
              onClick={handleFreeStarterOptIn}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Browse free lessons
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
