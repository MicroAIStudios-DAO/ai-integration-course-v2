/**
 * /checkout/start — Pre-Checkout Lead Capture Page
 * Spec §4: Capture email before redirecting to Stripe Checkout.
 *
 * Fields:
 *   required: email
 *   optional: phone, sms_consent, marketing_consent
 *   hidden: all UTM params, referrer, experiment bucket, selected offer
 *
 * Behavior:
 *   1. Submit to POST /api/checkout/session (createCheckoutSessionV2 Firebase callable)
 *   2. Backend upserts lead record in Firestore
 *   3. Backend creates Stripe Checkout Session with customer_email pre-filled
 *   4. Frontend redirects to session.url
 *
 * Source-aware headline copy (Spec §13 Hot Sauce):
 *   utm_source=google  → "You searched for AI automation. Here's the fastest path."
 *   utm_source=linkedin → "The AI workflows you've been reading about. Now built by you."
 *   utm_source=email   → "You've been thinking about this. Here's the $1 way to find out."
 *   utm_source=reddit  → "No hype. Just a structured path to building real AI workflows."
 *   default            → "Start building AI workflows that actually save time."
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useReCaptcha } from '../hooks/useReCaptcha';
import {
  trackLeadCaptured,
  trackCheckoutStarted,
  trackPricingCtaClick,
} from '../utils/analytics';

type OfferType = 'trial_7d_usd1' | 'annual_usd239';

interface CheckoutSessionRequest {
  offerType: OfferType;
  email: string;
  phone?: string;
  smsConsent: boolean;
  marketingConsent: boolean;
  leadSource: string;
  utm: Record<string, string>;
  referrer: string;
  experimentBucket: string;
}

interface CheckoutSessionResponse {
  leadId: string;
  checkoutSessionId: string;
  url: string;
}

const SOURCE_HEADLINES: Record<string, string> = {
  google: "You searched for AI automation. Here's the fastest path to actually using it.",
  cpc: "You searched for AI automation. Here's the fastest path to actually using it.",
  linkedin: "The AI workflows you've been reading about. Now built by you, in a week.",
  email: "You've been thinking about this. Here's the $1 way to find out if it's worth it.",
  reddit: "No hype. Just a structured path to building real AI workflows.",
  sms: "Your trial is still open. One click to get back in.",
};

const DEFAULT_HEADLINE = "Start building AI workflows that actually save time. $1 for 7 days.";

const OFFER_LABELS: Record<OfferType, { cta: string; subtext: string; badge: string }> = {
  trial_7d_usd1: {
    cta: 'Start My $1 Trial →',
    subtext: '$1 today · 7-day trial · then $29.99/month · cancel anytime',
    badge: 'Most Popular',
  },
  annual_usd239: {
    cta: 'Get Annual Access →',
    subtext: '$239/year · save $120 vs monthly · 14-Day Build Guarantee',
    badge: 'Best Value',
  },
};

const CheckoutStartPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // navigate is reserved for future use (e.g. post-checkout redirect fallback)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  const offerParam = searchParams.get('offer') as OfferType | null;
  const offerType: OfferType = offerParam === 'annual_usd239' ? 'annual_usd239' : 'trial_7d_usd1';

  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const utmContent = searchParams.get('utm_content') || '';
  const utmTerm = searchParams.get('utm_term') || '';
  const experimentBucket = searchParams.get('exp') || '';
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  const headline = SOURCE_HEADLINES[utmSource] || DEFAULT_HEADLINE;
  const offerLabel = OFFER_LABELS[offerType];

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { executeAndVerify, isLoaded: recaptchaLoaded } = useReCaptcha();

  useEffect(() => {
    emailRef.current?.focus();
    // Intentionally run once on mount — utmSource is a URL param that never changes
    trackPricingCtaClick('checkout_start_cta', utmSource || 'direct');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only effect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // reCAPTCHA Enterprise — protect checkout lead capture from bots
    try {
      if (recaptchaLoaded) {
        const verification = await executeAndVerify('CHECKOUT');
        if (verification !== null && !verification.success) {
          setError('Security check failed. If you are human, please try again or contact info@aiintegrationcourse.com.');
          setLoading(false);
          return;
        }
      }
    } catch (recaptchaError) {
      // reCAPTCHA failed to load (e.g. ad blocker) — allow the attempt, log for monitoring.
      console.warn('reCAPTCHA verification failed on checkout start, proceeding:', recaptchaError);
    }

    try {
      const functions = getFunctions();
      const createSession = httpsCallable<CheckoutSessionRequest, CheckoutSessionResponse>(
        functions,
        'createCheckoutSessionV2'
      );

      const payload: CheckoutSessionRequest = {
        offerType,
        email: normalizedEmail,
        phone: phone.trim() || undefined,
        smsConsent,
        marketingConsent,
        leadSource: utmSource ? `${utmSource}_${utmMedium}` : 'pricing_primary',
        utm: {
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          content: utmContent,
          term: utmTerm,
        },
        referrer,
        experimentBucket,
      };

      trackLeadCaptured({
        email: normalizedEmail,
        offerType,
        leadSource: payload.leadSource,
        utm: payload.utm,
      });

      const result = await createSession(payload);
      const { url, checkoutSessionId: _checkoutSessionId } = result.data;
      void _checkoutSessionId; // reserved for future analytics use

      const checkoutPrice = offerType === 'annual_usd239' ? 239 : 1;
      const checkoutPlanName = offerType === 'annual_usd239' ? 'Pro AI Architect Annual' : 'Pro AI Architect Trial';
      const checkoutPlanId = offerType === 'annual_usd239' ? 'pro_annual' : 'pro_trial';
      trackCheckoutStarted(checkoutPrice, 'USD', checkoutPlanName, checkoutPlanId);

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Checkout session creation failed:', err);
      setError(
        err?.message?.includes('rate')
          ? 'Too many attempts. Please wait a moment and try again.'
          : 'Something went wrong. Please try again or contact info@aiintegrationcourse.com.'
      );
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span
            style={{
              background: '#10b981',
              color: '#000',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '999px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {offerLabel.badge}
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          {headline}
        </h1>

        {/* Subtext */}
        <p
          style={{
            color: '#9ca3af',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          {offerLabel.subtext}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', color: '#d1d5db', fontSize: '13px', marginBottom: '6px' }}
            >
              Email address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone (optional) */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="phone"
              style={{ display: 'block', color: '#d1d5db', fontSize: '13px', marginBottom: '6px' }}
            >
              Phone <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional — for SMS reminders)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* SMS Consent */}
          {phone && (
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '12px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>
                I agree to receive SMS messages from AI Integration Course at the number above. Message
                &amp; data rates may apply. Reply STOP to unsubscribe.
              </span>
            </label>
          )}

          {/* Marketing Consent */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '24px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              style={{ marginTop: '2px', flexShrink: 0 }}
            />
            <span style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>
              Send me course updates, workflow templates, and AI tips. Unsubscribe anytime.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#7f1d1d',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* CTA Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#065f46' : '#10b981',
              color: '#000000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Preparing your checkout…' : offerLabel.cta}
          </button>
        </form>

        {/* Trust signals */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          {['🔒 256-bit SSL', '✅ 14-Day Guarantee', '↩ Cancel anytime'].map((item) => (
            <span key={item} style={{ color: '#6b7280', fontSize: '12px' }}>
              {item}
            </span>
          ))}
        </div>

        {/* Already have account */}
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', marginTop: '16px' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#10b981', textDecoration: 'none' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutStartPage;
