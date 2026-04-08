import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
import type { PlanKey } from '../config/pricing';

const INTENDED_PLAN_STORAGE_KEY = 'intended_plan';

export const isPlanKey = (value: unknown): value is PlanKey =>
  value === 'explorer' || value === 'pro' || value === 'corporate';

export const getStoredPlanKey = (): PlanKey | null => {
  const rawValue = sessionStorage.getItem(INTENDED_PLAN_STORAGE_KEY);
  return isPlanKey(rawValue) ? rawValue : null;
};

export const storePlanKey = (planKey: PlanKey): void => {
  sessionStorage.setItem(INTENDED_PLAN_STORAGE_KEY, planKey);
};

export const clearStoredPlanKey = (): void => {
  sessionStorage.removeItem(INTENDED_PLAN_STORAGE_KEY);
};

export const startCheckoutForPlan = async (planKey: PlanKey): Promise<void> => {
  storePlanKey(planKey);

  if (auth.currentUser) {
    await auth.currentUser.getIdToken();
  }

  const origin = window.location.origin;
  const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionV2');
  const result = await createCheckoutSession({
    planKey,
    successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
    cancelUrl: `${origin}/pricing?plan=${planKey}`,
  });

  const data = result.data as { url?: string };
  if (!data?.url) {
    throw new Error('Unexpected response from checkout. Please try again.');
  }

  window.location.assign(data.url);
};
