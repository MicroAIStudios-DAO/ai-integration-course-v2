import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { resourceLibraryItems } from '../content/marketingPages';

const ResourceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const resource = resourceLibraryItems.find((item) => item.slug === slug);

  if (!resource) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Guide not found</h1>
          <p className="mt-4 text-slate-700">The requested library page does not exist.</p>
          <Link to="/library" className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title={resource.title}
        description={resource.description}
        url={`/library/${resource.slug}`}
        type="article"
        author="Blaine Casey"
        keywords={resource.keywords}
      />
      <div className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{resource.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">{resource.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">{resource.description}</p>
          <p className="mt-4 text-sm text-slate-500">Audience: {resource.audience}</p>

          <div className="mt-10 space-y-8">
            {resource.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold text-slate-950">{section.heading}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{section.body}</p>
                {section.bullets && (
                  <ul className="mt-4 space-y-2 text-slate-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-600" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
            <h2 className="text-xl font-bold text-slate-950">Want the implementation version?</h2>
            <p className="mt-2 text-slate-700">
              Use this guide as the strategy layer, then use the course to turn it into a real workflow with prompts, tool calls, guardrails, and rollout steps.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                See pricing
              </Link>
              <Link to="/courses" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100">
                View curriculum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
