import React, { useEffect, useState } from 'react';
import LeadMagnetForm from './LeadMagnetForm';
import {
  topWorkflowsLeadMagnet,
  topWorkflowsLeadMagnetClaimedKey,
  topWorkflowsLeadMagnetDismissedKey,
} from '../../content/leadMagnets';

interface ExitIntentLeadMagnetProps {
  source: string;
}

const EXIT_ARM_DELAY_MS = 5000;

const ExitIntentLeadMagnet: React.FC<ExitIntentLeadMagnetProps> = ({ source }) => {
  const [isOpen, setIsOpen] = useState(false);

  const dismissForSession = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(topWorkflowsLeadMagnetDismissedKey, '1');
  };

  const markClaimed = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(topWorkflowsLeadMagnetClaimedKey, '1');
    window.sessionStorage.setItem(topWorkflowsLeadMagnetDismissedKey, '1');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const hasClaimed =
      window.localStorage.getItem(topWorkflowsLeadMagnetClaimedKey) === '1';
    const dismissedThisSession =
      window.sessionStorage.getItem(topWorkflowsLeadMagnetDismissedKey) === '1';

    if (hasClaimed || dismissedThisSession) {
      return undefined;
    }

    const pointerIsFine = window.matchMedia('(pointer: fine)').matches;
    let armed = false;

    const armTimer = window.setTimeout(() => {
      armed = true;
    }, EXIT_ARM_DELAY_MS);

    const openModal = () => {
      if (!armed) return;
      dismissForSession();
      setIsOpen(true);
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (!pointerIsFine || isOpen) return;
      if (event.clientY > 24) return;
      if (event.relatedTarget) return;
      openModal();
    };

    const handleScroll = () => {
      if (pointerIsFine || isOpen) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollProgress = window.scrollY / scrollHeight;
      if (scrollProgress >= 0.45) {
        openModal();
      }
    };

    document.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Close guide overlay"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-0 md:grid-cols-[1.05fr,0.95fr]">
          <div className="border-b border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-950 to-slate-950 p-8 md:border-b-0 md:border-r">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Before you leave
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              {topWorkflowsLeadMagnet.title}
            </h2>
            <p className="mt-4 text-slate-300">{topWorkflowsLeadMagnet.description}</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {topWorkflowsLeadMagnet.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Instant Access
                </p>
                <h3 className="mt-2 text-xl font-semibold">Unlock the workflow guide</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/5"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Get the same workflow shortlist we use to identify fast-return automation pilots.
            </p>
            <div className="mt-6">
              <LeadMagnetForm source={source} theme="dark" onSuccess={markClaimed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentLeadMagnet;
