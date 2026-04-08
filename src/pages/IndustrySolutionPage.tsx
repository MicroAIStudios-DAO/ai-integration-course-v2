import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { industryPages } from '../content/marketingPages';

const IndustrySolutionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const industry = industryPages.find((item) => item.slug === slug);

  if (!industry) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Industry page not found</h1>
          <p className="mt-4 text-slate-700">The requested industry page does not exist.</p>
          <Link to="/solutions" className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white">
            Back to industry pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title={industry.title}
        description={industry.description}
        url={`/solutions/${industry.slug}`}
        type="article"
        author="Blaine Casey"
        keywords={industry.keywords}
      />
      <div className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">{industry.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold">{industry.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">{industry.description}</p>
          <p className="mt-4 text-sm text-slate-400">Audience: {industry.audience}</p>

          <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <h2 className="text-xl font-bold text-white">Recommended first workflows</h2>
            <ul className="mt-4 space-y-2 text-slate-200">
              {industry.workflows.map((workflow) => (
                <li key={workflow} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                  <span>{workflow}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 space-y-8">
            {industry.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold text-white">{section.heading}</h2>
                <p className="mt-3 leading-relaxed text-slate-300">{section.body}</p>
                {section.bullets && (
                  <ul className="mt-4 space-y-2 text-slate-300">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-xl font-bold text-white">Turn this into a controlled pilot</h2>
            <p className="mt-2 text-slate-300">
              The course is designed to help teams move from idea to pilot without skipping retrieval, tool validation, review ownership, or rollout metrics.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
                See pricing
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

export default IndustrySolutionPage;
