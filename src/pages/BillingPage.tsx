/**
 * /billing — Billing Management Page
 * Spec §14: Redirects authenticated users to Stripe Billing Portal.
 *
 * Entry points:
 *   - Dunning email "Update Payment Method" CTA
 *   - Profile page "Manage Subscription" button
 *   - Direct URL /billing
 *
 * Behavior:
 *   1. Check auth state
 *   2. If unauthenticated → redirect to /login?next=/billing
 *   3. Call createBillingPortalSession Firebase callable
 *   4. Redirect to Stripe portal URL
 *   5. On return, redirect to /profile
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate(`/login?next=/billing`, { replace: true });
        return;
      }

      try {
        setStatus('redirecting');
        const functions = getFunctions();
        const createPortalSession = httpsCallable<
          { returnUrl?: string },
          { url: string }
        >(functions, 'createBillingPortalSession');

        const returnUrl =
          searchParams.get('return_url') ||
          `${window.location.origin}/profile?tab=billing`;

        const result = await createPortalSession({ returnUrl });
        window.location.href = result.data.url;
      } catch (err: any) {
        console.error('[BillingPage] Portal session error:', err);
        setStatus('error');
        setErrorMessage(
          err?.message?.includes('No billing account')
            ? 'No billing account found. If you recently subscribed, please wait a moment and try again.'
            : 'Could not open billing portal. Please contact info@aiintegrationcourse.com.'
        );
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        {status === 'loading' || status === 'redirecting' ? (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid #374151',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#9ca3af', fontSize: '15px' }}>
              {status === 'loading' ? 'Checking your account…' : 'Opening billing portal…'}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '12px' }}>
              Could not open billing portal
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
              {errorMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="mailto:info@aiintegrationcourse.com"
                style={{
                  padding: '10px 20px',
                  background: '#1f2937',
                  color: '#d1d5db',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Contact Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
