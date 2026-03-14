import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { resourceLibraryItems } from '../content/marketingPages';

const ResourceLibraryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="AI Integration Library"
        description="Permanent guides for AI operators and developers: RAG for small business, function calling with Gemini, and model comparison workflows for automation teams."
        url="/library"
        keywords={[
          'AI integration library',
          'RAG for small business',
          'Gemini function calling',
          'OpenAI vs Anthropic automation'
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Resource Library</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">Long-tail guides for business owners and developers building with AI</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">
            This library is built for the two audiences that matter most to AI integration: the operator looking for a practical business outcome and the developer looking for a stable implementation path.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {resourceLibraryItems.map((resource) => (
            <article key={resource.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{resource.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{resource.title}</h2>
              <p className="mt-3 text-slate-700 leading-relaxed">{resource.summary}</p>
              <p className="mt-4 text-sm text-slate-500">Best for: {resource.audience}</p>
              <div className="mt-6">
                <Link
                  to={`/library/${resource.slug}`}
                  className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Read guide
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceLibraryPage;
