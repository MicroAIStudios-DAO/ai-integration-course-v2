import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
import type { PlanKey } from '../config/pricing';
import { generateLeadId, storeLeadId, getStoredLeadId, clearLeadData } from './leadId';
import { getStoredAttribution } from './attribution';

const INTENDED_PLAN_STORAGE_KEY = 'intended_plan';

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

export interface StartCheckoutOptions {
  seatCount?: number;
  /** Email captured from the lead-capture gate (anonymous flow). */
  email?: string;
  phone?: string;
  smsConsent?: boolean;
  marketingConsent?: boolean;
  leadSource?: string;
  offerType?: string;
  /**
   * Skip the /checkout/start email gate even when anonymous. Used by the gate
   * page itself after it has captured the email, to avoid a redirect loop.
   */
  skipLeadGate?: boolean;
}

/**
 * Start Stripe Checkout for a plan.
 *
 * Email-first lead gate: an anonymous visitor with no captured email is routed
 * to /checkout/start so a recoverable lead is written BEFORE Stripe. Without it,
 * abandoned guest checkouts leave no contactable record — the historical
 * 4-leads-vs-69-sessions gap that starved the abandonment-recovery sequence.
 * Logged-in users (email known) and calls that already carry an email proceed
 * directly to Stripe.
 */
export const startCheckoutForPlan = async (planKey: PlanKey, options?: StartCheckoutOptions): Promise<void> => {
  storePlanKey(planKey);

  if (auth.currentUser?.isAnonymous) {
    await signOut(auth);
  }

  const isLoggedIn = Boolean(auth.currentUser && !auth.currentUser.isAnonymous);
  const email = (options?.email || (isLoggedIn ? auth.currentUser?.email : '') || '').trim().toLowerCase();

  if (!email && !options?.skipLeadGate) {
    // Route anonymous, email-less visitors through the lead-capture gate first.
    const params = new URLSearchParams({ plan: planKey, ...getStoredAttribution() });
    if (typeof options?.seatCount === 'number') params.set('seatCount', String(options.seatCount));
    window.location.assign(`/checkout/start?${params.toString()}`);
    return;
  }

  if (isLoggedIn) {
    await auth.currentUser!.getIdToken();
  }

  // Generate and store a lead_id before redirecting to Stripe — a hard link
  // between the browser session and the Stripe checkout, so returning users are
  // matched without relying on email normalization.
  const leadId = generateLeadId();
  storeLeadId(leadId);

  const origin = window.location.origin;
  const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionV2');
  const attribution = getStoredAttribution();

  // client_reference_id (Firebase UID) when logged in — gives the webhook an
  // immediate user match without email normalization or lead_id fallback.
  const clientReferenceId = auth.currentUser?.uid || undefined;

  const result = await createCheckoutSession({
    planKey,
    ...(typeof options?.seatCount === 'number' ? { seatCount: options.seatCount } : {}),
    ...(email ? { email } : {}),
    ...(options?.phone ? { phone: options.phone } : {}),
    ...(typeof options?.smsConsent === 'boolean' ? { smsConsent: options.smsConsent } : {}),
    ...(typeof options?.marketingConsent === 'boolean' ? { marketingConsent: options.marketingConsent } : {}),
    ...(options?.leadSource ? { leadSource: options.leadSource } : {}),
    ...(options?.offerType ? { offerType: options.offerType } : {}),
    successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
    cancelUrl: `${origin}/pricing?plan=${planKey}`,
    leadId, // Passed to Stripe metadata for server-side correlation
    ...(clientReferenceId ? { clientReferenceId } : {}),
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
