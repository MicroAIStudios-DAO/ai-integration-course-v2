/**
 * First-touch attribution capture.
 *
 * Persists UTM / gclid / referrer / landing-page to sessionStorage on the first
 * page load of a session so the values survive client-side navigation and are
 * carried into checkout + account creation. Previously `getStoredAttribution`
 * in utils/checkout.ts read these keys but nothing ever wrote them, so all
 * organic/campaign attribution was lost through the funnel.
 *
 * First-touch semantics: a key is only written if not already present, so the
 * original entry source wins over later internal navigations.
 */

export const ATTRIBUTION_KEYS = [
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of ATTRIBUTION_KEYS) {
      const val = params.get(key);
      if (val && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, val);
      }
    }
    if (!sessionStorage.getItem('landing_page')) {
      sessionStorage.setItem('landing_page', window.location.pathname + window.location.search);
    }
    if (!sessionStorage.getItem('landing_referrer') && document.referrer) {
      sessionStorage.setItem('landing_referrer', document.referrer);
    }
  } catch {
    /* sessionStorage blocked (private mode / cookies disabled) — non-fatal */
  }
}

export function getStoredAttribution(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const key of ATTRIBUTION_KEYS) {
      const v = sessionStorage.getItem(key);
      if (v) out[key] = v;
    }
  } catch {
    /* ignore */
  }
  return out;
}
