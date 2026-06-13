import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStoredConsent, grantConsent, denyConsent, applyStoredConsent } from '../utils/consent';

/**
 * GDPR / ePrivacy / CCPA cookie consent banner.
 * Trackers stay off (Consent Mode default = denied in index.html) until the visitor
 * accepts here. Shown to everyone; choice persists in localStorage.
 */
const ConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Re-apply a prior "granted" choice for returning visitors; show banner only if undecided.
    applyStoredConsent();
    setVisible(getStoredConsent() === null);
  }, []);

  if (!visible) return null;

  const accept = () => {
    grantConsent();
    setVisible(false);
  };

  const reject = () => {
    denyConsent();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-5"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-amber-500/30 bg-slate-950/95 backdrop-blur-md shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 text-sm text-slate-300 leading-relaxed">
            <p className="font-semibold text-white mb-1">We value your privacy</p>
            <p>
              We use cookies and similar tools for analytics, advertising, and to improve your
              experience. Nothing non-essential runs until you accept. See our{' '}
              <Link to="/privacy" className="text-amber-400 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <button
              onClick={reject}
              className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-200 text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Reject non-essential
            </button>
            <button
              onClick={accept}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
