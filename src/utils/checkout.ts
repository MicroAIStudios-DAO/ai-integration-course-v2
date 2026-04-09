import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
import type { PlanKey } from '../config/pricing';

const INTENDED_PLAN_STORAGE_KEY = 'intended_plan';

// P0 FIX: Attribution param keys captured from landing page URL
const ATTRIBUTION_KEYS = ['gclid', 'utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'] as const;

export const isPlanKey = (value: unknown): value is PlanKey =>
  value === 'explorer' || value === 'pro' || value === 'corporate';

export const getStoredPlanKey = (): PlanKey | null => {
  const rawValue = sessionStorage.getItem(INTENDED_PLAN_STORAGE_KEY);
  return isPlanKey(rawValue) ? rawValue : null;
};

export const getPlanKeyFromSearch = (search: string): PlanKey | null => {
  const rawValue = new URLSearchParams(search).get('plan');
  return isPlanKey(rawValue) ? rawValue : null;
};

export const storePlanKey = (planKey: PlanKey): void => {
  sessionStorage.setItem(INTENDED_PLAN_STORAGE_KEY, planKey);
};

export const clearStoredPlanKey = (): void => {
  sessionStorage.removeItem(INTENDED_PLAN_STORAGE_KEY);
};

/** Read stored attribution params from sessionStorage (set by landing page) */
const getStoredAttribution = (): Record<string, string> => {
  const attrs: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const val = sessionStorage.getItem(key);
    if (val) attrs[key] = val;
  }
  return attrs;
};

export const startCheckoutForPlan = async (planKey: PlanKey): Promise<void> => {
  storePlanKey(planKey);

  if (auth.currentUser) {
    await auth.currentUser.getIdToken();
  }

  const origin = window.location.origin;
  const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionV2');

  // P0 FIX: Pass attribution params to the backend so they are stored in
  // Stripe session metadata — enabling Google Ads to attribute conversions
  // back to the originating campaign, keyword, and ad group.
  const attribution = getStoredAttribution();

  const result = await createCheckoutSession({
    planKey,
    successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
    cancelUrl: `${origin}/pricing?plan=${planKey}`,
    ...attribution,
  });

  const data = result.data as { url?: string };
  if (!data?.url) {
    throw new Error('Unexpected response from checkout. Please try again.');
  }

  window.location.assign(data.url);
};
