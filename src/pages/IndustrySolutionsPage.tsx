import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { industryPages } from '../content/marketingPages';

const IndustrySolutionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="AI Integration by Industry"
        description="Industry-specific AI integration pages for real estate, e-commerce, and law firms. See where AI automation creates operational leverage without breaking review and quality controls."
        url="/solutions"
        keywords={['AI integration by industry', 'AI for real estate', 'AI for e-commerce', 'AI for law firms']}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Industry Pages</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold">AI integration patterns for real businesses</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            These pages are built for high-intent searchers who already know the business context. Each page maps common workflow pain, the safest first automation pilot, and the rollout logic the course teaches.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {industryPages.map((industry) => (
            <article key={industry.slug} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{industry.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold text-white">{industry.title}</h2>
              <p className="mt-3 text-slate-300 leading-relaxed">{industry.summary}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-400">
                {industry.workflows.slice(0, 3).map((workflow) => (
                  <li key={workflow} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                    <span>{workflow}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  to={`/solutions/${industry.slug}`}
                  className="inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  View industry page
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndustrySolutionsPage;
