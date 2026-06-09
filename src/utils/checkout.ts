import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
import type { PlanKey } from '../config/pricing';
import { generateLeadId, storeLeadId, getStoredLeadId, clearLeadData } from './leadId';

const INTENDED_PLAN_STORAGE_KEY = 'intended_plan';

const ATTRIBUTION_KEYS = ['gclid', 'utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'] as const;

export type CheckoutSessionSummary = {
  sessionId: string;
  email: string;
  displayName: string | null;
  planKey: PlanKey;
  planName: string;
  status: string;
  seatCount: number;
  analyticsValue: number;
  existingAccount: boolean;
  attachedUid: string | null;
  isAttachedToCurrentUser: boolean;
  requiresLogin: boolean;
};

export const isPlanKey = (value: unknown): value is PlanKey =>
  value === 'explorer' || value === 'pro' || value === 'pro_trial' || value === 'corporate';

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

const getStoredAttribution = (): Record<string, string> => {
  const attrs: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const val = sessionStorage.getItem(key);
    if (val) attrs[key] = val;
  }
  return attrs;
};

export const startCheckoutForPlan = async (planKey: PlanKey, options?: { seatCount?: number }): Promise<void> => {
  storePlanKey(planKey);

  if (auth.currentUser?.isAnonymous) {
    await signOut(auth);
  }

  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    await auth.currentUser.getIdToken();
  }

  // Fix 2: Generate and store a lead_id before redirecting to Stripe.
  // This creates a hard link between the browser session and the Stripe checkout,
  // bypassing email matching entirely when the user returns to create an account.
  const leadId = generateLeadId();
  storeLeadId(leadId);

  const origin = window.location.origin;
  const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionV2');
  const attribution = getStoredAttribution();

  const result = await createCheckoutSession({
    planKey,
    ...(typeof options?.seatCount === 'number' ? { seatCount: options.seatCount } : {}),
    successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
    cancelUrl: `${origin}/pricing?plan=${planKey}`,
    leadId, // Passed to Stripe metadata for server-side correlation
    ...attribution,
  });

  const data = result.data as { url?: string };
  if (!data?.url) {
    throw new Error('Unexpected response from checkout. Please try again.');
  }

  window.location.assign(data.url);
};

export const getCheckoutSessionIdFromSearch = (search: string): string | null => {
  const rawValue = new URLSearchParams(search).get('checkout_session_id') || new URLSearchParams(search).get('session_id');
  return rawValue ? rawValue.trim() : null;
};

export const fetchCheckoutSessionSummary = async (sessionId: string): Promise<CheckoutSessionSummary> => {
  const getCheckoutSessionSummaryCall = httpsCallable(functions, 'getCheckoutSessionSummaryV2');
  const result = await getCheckoutSessionSummaryCall({ sessionId });
  return result.data as CheckoutSessionSummary;
};

export const attachCheckoutSessionToCurrentUser = async (
  sessionId: string,
  displayName?: string
): Promise<{ success: boolean; attachedUid: string; planKey: PlanKey; status: string }> => {
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }

  // Fix 2 + Fix 3: Use the atomic attach function and pass lead_id if available.
  // The atomic version wraps session attachment + premium grant in a single
  // Firestore transaction — no partial states possible.
  const leadId = getStoredLeadId();
  const attachCheckoutSessionCall = httpsCallable(functions, 'attachCheckoutSessionAtomicV2');
  const result = await attachCheckoutSessionCall({
    sessionId,
    displayName,
    ...(leadId ? { leadId } : {}),
  });

  // Clear lead data after successful link
  clearLeadData();

  return result.data as { success: boolean; attachedUid: string; planKey: PlanKey; status: string };
};
