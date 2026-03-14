import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="Contact"
        description="Contact AI Integration Course for support, launch questions, and implementation-focused training inquiries."
        url="/contact"
        keywords={['AI Integration Course contact', 'AI automation training support', 'AI course help']}
      />
      <div className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Contact</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">Questions about the course or rollout path?</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">
            For support, account issues, or pre-purchase questions, use the support address below. If you are comparing plans, start with the pricing page and the library guides first so the question is concrete.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-bold text-slate-950">Support Email</h2>
            <a href="mailto:support@aiintegrationcourse.com" className="mt-3 inline-flex text-lg font-semibold text-cyan-700 hover:text-cyan-800">
              support@aiintegrationcourse.com
            </a>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
              See pricing
            </Link>
            <Link to="/library" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100">
              Read the library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
