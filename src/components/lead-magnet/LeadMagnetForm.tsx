import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { topWorkflowsLeadMagnet } from '../../content/leadMagnets';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

interface LeadMagnetFormProps {
  source: string;
  theme?: 'dark' | 'light';
  onSuccess?: () => void;
}

const LeadMagnetForm: React.FC<LeadMagnetFormProps> = ({
  source,
  theme = 'dark',
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadPath, setDownloadPath] = useState(topWorkflowsLeadMagnet.downloadPath);

  const isDark = theme === 'dark';
  const isSubmitting = status === 'submitting';

  const inputClassName = isDark
    ? 'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50'
    : 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20';

  const buttonClassName = isDark
    ? 'w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70'
    : 'w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70';

  const helpTextClassName = isDark ? 'text-slate-400' : 'text-slate-500';
  const successTextClassName = isDark ? 'text-emerald-300' : 'text-emerald-700';
  const errorTextClassName = isDark ? 'text-rose-300' : 'text-rose-700';
  const linkClassName = isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-800';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    try {
      const submitLeadMagnet = httpsCallable(functions, 'submitLeadMagnetV2');
      const result = await submitLeadMagnet({
        email,
        source,
        leadMagnetId: topWorkflowsLeadMagnet.id,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });

      const data = result.data as { downloadPath?: string } | undefined;
      setDownloadPath(data?.downloadPath || topWorkflowsLeadMagnet.downloadPath);
      setStatus('success');
      setEmail('');
      onSuccess?.();
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message || 'Unable to unlock the guide right now. Please try again.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          className={inputClassName}
          disabled={isSubmitting}
        />
        <button type="submit" className={buttonClassName} disabled={isSubmitting}>
          {isSubmitting ? 'Unlocking...' : topWorkflowsLeadMagnet.ctaLabel}
        </button>
      </form>

      {status === 'success' && (
        <div className={`mt-3 space-y-2 text-sm ${successTextClassName}`}>
          <p>Access unlocked. Use the guide below.</p>
          <a
            href={downloadPath}
            target="_blank"
            rel="noreferrer"
            className={`font-semibold underline underline-offset-4 ${linkClassName}`}
          >
            Open "Top 5 AI Automation Workflows for 2026"
          </a>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <p role="alert" className={`mt-3 text-sm ${errorTextClassName}`}>
          {errorMessage}
        </p>
      )}

      <p className={`mt-3 text-xs ${helpTextClassName}`}>
        {topWorkflowsLeadMagnet.instantAccessLabel}
      </p>
    </div>
  );
};

export default LeadMagnetForm;
