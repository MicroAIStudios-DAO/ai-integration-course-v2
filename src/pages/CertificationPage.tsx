import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { saveCertificate, CertRecord } from '../firebaseService';
import { trackCertificateGenerated } from '../utils/analytics';

// Tiers that are allowed to generate certificates
const CERTIFICATE_TIERS = new Set(['pro', 'corporate', 'founding']);

/** Deterministic-but-unique cert ID derived from user UID + timestamp */
const generateCertId = (uid: string): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const fragment = uid.slice(-6).toUpperCase();
  return `AIC-${ts}-${fragment}`;
};

const COURSE_NAME = 'AI Integration Mastery';

const CertificationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    loading,
    subscriptionTier,
  } = usePremiumAccess();

  const [certId] = useState<string>(() =>
    currentUser ? generateCertId(currentUser.uid) : ''
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCert, setSavedCert] = useState<CertRecord | null>(null);

  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const canGenerate =
    !loading && currentUser && CERTIFICATE_TIERS.has(subscriptionTier);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [loading, currentUser, navigate]);

  const handleGenerate = useCallback(async () => {
    if (!currentUser || !canGenerate) return;
    setError(null);
    setGenerating(true);
    try {
      const cert: CertRecord = {
        certId,
        courseName: COURSE_NAME,
        issuedAt: new Date().toISOString(),
        tier: subscriptionTier,
      };
      await saveCertificate(currentUser.uid, cert);
      trackCertificateGenerated(certId, currentUser.uid, subscriptionTier);
      setSavedCert(cert);
      setGenerated(true);
    } catch (err) {
      console.error('[Certification] Failed to save certificate:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save certificate. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  }, [currentUser, canGenerate, certId, subscriptionTier]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // LinkedIn "Add to Profile" deep-link
  const linkedInUrl = savedCert
    ? (() => {
        const params = new URLSearchParams({
          startTask: 'CERTIFICATION_NAME',
          name: COURSE_NAME,
          organizationName: 'MicroAI Studios',
          issueYear: String(new Date().getFullYear()),
          issueMonth: String(new Date().getMonth() + 1),
          certId: savedCert.certId,
          certUrl: `https://aiintegrationcourse.com/verify?cert=${savedCert.certId}`,
        });
        return `https://www.linkedin.com/profile/add?${params.toString()}`;
      })()
    : '';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!currentUser) return null;

  // ── Not eligible (free / explorer tier) ──────────────────────────────────
  if (!canGenerate) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">AI Certification</h1>
        <p className="mt-3 text-slate-600">
          Certificates are available for <strong>Pro</strong> and{' '}
          <strong>Enterprise</strong> members. Upgrade your plan to earn a
          verifiable credential for <em>{COURSE_NAME}</em>.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Upgrade to Pro
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    );
  }

  // ── Main certification UI ─────────────────────────────────────────────────
  return (
    <>
      {/* Print-only certificate styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-print-area,
          #certificate-print-area * { visibility: visible !important; }
          #certificate-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #fff !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-3xl space-y-8">
        {/* Page header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">AI Certification</h1>
          <p className="mt-2 text-slate-500">
            Generate your professional certificate for{' '}
            <span className="font-medium text-indigo-600">{COURSE_NAME}</span>.
          </p>
        </div>

        {/* Certificate preview */}
        <div
          id="certificate-print-area"
          className="relative overflow-hidden rounded-2xl border-4 border-indigo-600 bg-white p-10 shadow-xl"
          aria-label="Certificate preview"
        >
          {/* Decorative top bar */}
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-800" />

          {/* Logo / issuer */}
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              MicroAI Studios™
            </span>
          </div>

          {/* Certificate body */}
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
              Certificate of Completion
            </p>
            <h2 className="mt-4 text-4xl font-extrabold text-slate-900 font-headings">
              {currentUser.displayName || currentUser.email || 'Graduate'}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              has successfully completed the course
            </p>
            <h3 className="mt-2 text-2xl font-bold text-indigo-700">
              {COURSE_NAME}
            </h3>
            <p className="mt-6 text-sm text-slate-500">
              Completed on{' '}
              <span className="font-semibold text-slate-700">
                {completionDate}
              </span>
            </p>
          </div>

          {/* Signature row */}
          <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-6">
            <div className="text-left">
              <p className="text-base font-bold italic text-slate-700">
                MicroAI Studios
              </p>
              <p className="text-xs text-slate-400">Course Instructor</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Certificate ID</p>
              <p className="font-mono text-xs font-semibold text-slate-600">
                {certId}
              </p>
            </div>
          </div>

          {/* Decorative bottom bar */}
          <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-indigo-800 via-blue-500 to-indigo-600" />
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-4">
          {error && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          {!generated ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {generating ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    Generate Certificate
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500">
                This will record your certificate in our system with a unique ID.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Certificate generated and saved! Cert ID:{' '}
                <span className="font-mono">{certId}</span>
              </p>

              {/* Download as PDF */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download PDF
                </button>

                {/* LinkedIn share */}
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0077b5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#006097] transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Add to LinkedIn
                </a>
              </div>

              {/* LinkedIn badge snippet */}
              <details className="rounded-lg border border-slate-200 bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 select-none">
                  LinkedIn Badge Code Snippet
                </summary>
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="mb-2 text-xs text-slate-500">
                    Copy this HTML snippet to embed your LinkedIn badge on a
                    personal website or portfolio:
                  </p>
                  <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap break-all select-all">
{`<a href="${linkedInUrl}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Certified-AI%20Integration%20Mastery-0077b5?logo=linkedin&style=for-the-badge" alt="AI Integration Mastery Certificate" />
</a>`}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            to="/profile"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to Profile
          </Link>
          <Link
            to="/courses"
            className="text-sm font-medium text-slate-500 hover:underline"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    </>
  );
};

export default CertificationPage;
