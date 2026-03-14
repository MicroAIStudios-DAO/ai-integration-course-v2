import React from 'react';
import CourseSchema from '../components/seo/CourseSchema';
import SEO from '../components/SEO';
import { homepageFaqItems } from '../content/marketingPages';

const FAQPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Answers to common questions about Gemini API integration, AI automation, non-coder workflows, and what you build inside AI Integration Course."
        url="/faq"
        keywords={['AI course FAQ', 'Gemini API with Python', 'AI for business automation', 'non-coder AI course']}
      />
      <CourseSchema includeFaqSchema faqItems={homepageFaqItems} />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">FAQ</p>
            <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">Frequently asked questions</h1>
            <div className="mt-8 space-y-4">
              {homepageFaqItems.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <summary className="cursor-pointer text-lg font-semibold text-slate-950">{item.question}</summary>
                  <p className="mt-3 leading-relaxed text-slate-700">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;
