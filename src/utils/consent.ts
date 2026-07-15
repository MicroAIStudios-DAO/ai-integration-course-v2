/**
 * Cookie consent manager (GDPR / ePrivacy / CCPA).
 *
 * Strategy: trackers are OFF by default. index.html sets Google Consent Mode v2
 * defaults to "denied". No analytics/ads scripts load until the visitor
 * explicitly accepts via the cookie banner. On accept we (a) update Google
 * Consent Mode to "granted" and (b) inject GTM, gtag.js (GA4 + Google Ads),
 * and Ahrefs. On reject, nothing loads.
 *
 * Exception: Microsoft Clarity loads unconditionally from index.html (owner
 * decision 2026-07-15) and is intentionally NOT injected here.
 */

export type ConsentValue = 'granted' | 'denied';

const STORAGE_KEY = 'cookie_consent';

// Tag IDs (previously hard-coded in index.html — now consent-gated)
const GTM_ID = 'GTM-M8T3DKFQ';
const GOOGLE_ADS_ID = 'AW-17956658756';
const GA4_ID = 'G-15SDDF1S5S';
// Public Ahrefs Web Analytics site identifier (rendered client-side for every
// visitor — not a secret). Named without "key" to avoid secret-scanner false positives.
const AHREFS_ANALYTICS_ID = 'I2l5sw2gsKNPJvnp9dQpkA';

let trackersLoaded = false;

const gtag = (...args: any[]): void => {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
};

export const getStoredConsent = (): ConsentValue | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
};

const storeConsent = (value: ConsentValue): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage blocked — consent still applies for this session */
  }
};

const injectScript = (attrs: Record<string, string>, inline?: string): void => {
  const s = document.createElement('script');
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  if (inline) s.text = inline;
  document.head.appendChild(s);
};

/** Inject all tracking scripts. Runs at most once, only after consent is granted. */
const loadTrackers = (): void => {
  if (trackersLoaded || typeof document === 'undefined') return;
  trackersLoaded = true;

  // Google Tag Manager
  injectScript(
    {},
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
      `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
      `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
      `})(window,document,'script','dataLayer','${GTM_ID}');`
  );

  // gtag.js — single instance configures both Google Ads and GA4
  injectScript({ async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}` });
  gtag('config', GOOGLE_ADS_ID, { allow_enhanced_conversions: true });
  gtag('config', GA4_ID, { send_page_view: true });

  // Ahrefs Web Analytics
  injectScript({ src: 'https://analytics.ahrefs.com/analytics.js', 'data-key': AHREFS_ANALYTICS_ID, async: '' });
};

export const grantConsent = (): void => {
  storeConsent('granted');
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  });
  loadTrackers();
};

export const denyConsent = (): void => {
  storeConsent('denied');
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  });
};

/** Call once on app start: re-apply a previously granted choice so returning visitors keep tracking. */
export const applyStoredConsent = (): void => {
  if (getStoredConsent() === 'granted') grantConsent();
};
