import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * CSP-safe beta feedback entrypoint.
 *
 * Instead of injecting third-party widget scripts (which may use inline handlers
 * blocked by nonce-based CSP), we open feedback in an isolated iframe modal.
 */
export function UserJotWidget() {
  const { currentUser } = useAuth();
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [betaCohort, setBetaCohort] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setIsBetaTester(false);
      setBetaCohort(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setIsBetaTester(userData.isBetaTester === true);
          setBetaCohort(userData.betaCohort || null);
        } else {
          setIsBetaTester(false);
          setBetaCohort(null);
        }
      },
      (error) => {
        console.error('Error fetching beta tester status:', error);
        setIsBetaTester(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const feedbackUrl = useMemo(() => {
    const base = process.env.REACT_APP_USERJOT_FEEDBACK_URL;
    if (!base || !currentUser) {
      return null;
    }

    try {
      const url = new URL(base);
      if (currentUser.email) {
        url.searchParams.set('email', currentUser.email);
      }
      if (currentUser.displayName) {
        url.searchParams.set('name', currentUser.displayName);
      }
      if (betaCohort) {
        url.searchParams.set('cohort', betaCohort);
      }
      return url.toString();
    } catch (error) {
      console.error('Invalid REACT_APP_USERJOT_FEEDBACK_URL:', error);
      return null;
    }
  }, [currentUser, betaCohort]);

  if (!isBetaTester || !currentUser || !feedbackUrl) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-cyan-700"
          onClick={() => setIsOpen(true)}
        >
          Beta Feedback
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Beta Feedback</h2>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            <iframe
              src={feedbackUrl}
              title="Beta Feedback Form"
              className="h-[75vh] w-full"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}
    </>
  );
}
