import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CheatSheetLandingPage: React.FC = () => {
  useEffect(() => {
    // Dynamically load HubSpot form script
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/v2.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).hbspt) {
        (window as any).hbspt.forms.create({
          region: 'na1', // Change if your HubSpot region is different
          portalId: 'YOUR_PORTAL_ID', // REPLACE WITH YOUR HUBSPOT PORTAL ID
          formId: 'YOUR_FORM_ID',     // REPLACE WITH YOUR HUBSPOT FORM ID
          target: '#hubspot-form-container',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      <SEO
        title="2026 AI Coding Stack Cheat Sheet"
        description="Get the exact Cursor + Claude Code + Gemini workflow top developers use to ship real work faster."
        url="/cheat-sheet"
        type="website"
        keywords={['AI coding stack', 'Cursor vs Claude', 'AI developer workflow']}
      />

      <div className="mx-auto max-w-6xl px-6 py-20 md:py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Copy */}
          <div>
            <p className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium tracking-wide text-cyan-400">
              Free Developer Resource
            </p>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              The 2026 AI Coding <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                Stack Cheat Sheet
              </span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-300 md:text-xl">
              Stop using AI like a fancy autocomplete. Get the exact hybrid stack and prompts top developers use to move from "AI helps me code" to "AI does real work while I direct it."
            </p>

            <ul className="mb-10 space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <svg className="h-6 w-6 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>The exact decision framework for when to use <strong>Cursor</strong> vs <strong>Claude Code</strong> vs <strong>Gemini</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-6 w-6 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>The 3 "Master Prompts" that force the AI to plan, execute, and self-correct.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-6 w-6 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>How to build the <strong>n8n glue layer</strong> to automate your workflow.</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 blur-2xl"></div>
            <div className="relative rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl md:p-10">
              <h3 className="mb-6 text-2xl font-bold text-white">Where should we send it?</h3>
              
              {/* HubSpot Form Container */}
              <div id="hubspot-form-container" className="min-h-[200px]">
                <p className="text-sm text-slate-400">Loading form...</p>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                By downloading, you agree to receive occasional updates about AI automation. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheatSheetLandingPage;
