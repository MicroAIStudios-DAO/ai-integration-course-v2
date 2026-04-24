import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { trackCTAClick } from '../utils/analytics';

/**
 * Section 6: Exit-Intent / Onsite Rescue
 * Triggers on mouse-leave (desktop) or back-button intent (mobile).
 * Two variants:
 *   - Pricing page: "Wait — want the lowest-risk way to start?"
 *   - Checkout page: "Still deciding?"
 * "Send me my secure link" captures email and fires an immediate rescue email.
 * Suppressed if user has already purchased (localStorage flag).
 */

interface ExitIntentModalProps {
  variant?: 'pricing' | 'checkout';
  onClose?: () => void;
}

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  variant = 'pricing',
  onClose,
}) => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [sending, setSending] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    // Do not show if user already purchased
    if (localStorage.getItem('aic_purchased') === 'true') return;
    // Do not show if already dismissed in this session
    if (sessionStorage.getItem('exit_modal_dismissed') === 'true') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown.current) {
        hasShown.current = true;
        setVisible(true);
        if (typeof window !== 'undefined') {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'exit_intent_triggered', variant });
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [variant]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('exit_modal_dismissed', 'true');
    onClose?.();
  };

  const handleSendLink = async () => {
    if (!email || !email.includes('@')) return;
    setSending(true);
    try {
      // Fire the "send me my secure link" rescue email via the backend
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('../config/firebase');
      const functions = getFunctions(app);
      const sendRescueLink = httpsCallable(functions, 'sendRescueLink');
      await sendRescueLink({
        email,
        resumeUrl: `${window.location.origin}/pricing?utm_source=exit_modal&utm_medium=email&utm_campaign=exit_intent_rescue`,
        planKey: sessionStorage.getItem('intended_plan') || 'pro_trial',
      });
      setLinkSent(true);
      // Push to dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'rescue_link_requested',
        email_captured: true,
        variant,
      });
    } catch {
      // Fail silently — do not block the user
      setLinkSent(true);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl"
          aria-label="Close"
        >
          ×
        </button>

        {variant === 'pricing' ? (
          <>
            {/* PRICING PAGE EXIT MODAL — Exact brief copy */}
            <h2 className="text-xl font-bold text-white mb-3">
              Wait — want the lowest-risk way to start?
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              Start full access for $1 today. Build something real this week. Cancel before renewal if it's not for you.
            </p>

            <Link
              to="/start-trial?utm_source=exit_modal&utm_medium=onsite&utm_campaign=exit_intent_pricing"
              onClick={() => {
                trackCTAClick('exit_modal_trial', 'exit_intent_modal', 'trial');
                handleClose();
              }}
              className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl text-center mb-4 transition-colors"
            >
              Start 7-Day Trial for $1
            </Link>

            {/* "Send me my secure link" rescue */}
            {!linkSent ? (
              <div>
                <p className="text-xs text-gray-500 text-center mb-2">
                  Or — send me my secure access link
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendLink}
                    disabled={sending}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-400 text-center">
                ✓ Your secure link is on its way. Check your inbox.
              </p>
            )}
          </>
        ) : (
          <>
            {/* CHECKOUT EXIT RESCUE — Exact brief copy */}
            <h2 className="text-xl font-bold text-white mb-3">
              Still deciding?
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              You don't need to commit big to start. Use the $1 trial and decide after you've actually seen the inside.
            </p>
            <Link
              to="/start-trial?utm_source=exit_modal&utm_medium=onsite&utm_campaign=exit_intent_checkout"
              onClick={() => {
                trackCTAClick('exit_modal_checkout_trial', 'exit_intent_modal', 'trial');
                handleClose();
              }}
              className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl text-center transition-colors"
            >
              Start My $1 Trial
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ExitIntentModal;
