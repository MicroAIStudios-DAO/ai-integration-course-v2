/**
 * Fix 2 (Frontend): Lead ID — localStorage Fallback for Guest Checkout
 * 
 * Before redirecting to Stripe, we generate a unique lead_id and store it
 * in localStorage. This ID is also passed as Stripe metadata. When the user
 * returns and creates an account, we pass this lead_id to the server to
 * create a hard cryptographic link — bypassing email matching entirely.
 * 
 * This handles the case where:
 * - User checks out with blaine@gmail.com
 * - But creates their Firebase account with blaine.casey@gmail.com
 * - The lead_id links them regardless of email mismatch
 */

const LEAD_ID_KEY = 'aicourse_lead_id';
const LEAD_SESSION_KEY = 'aicourse_lead_session_id';

/**
 * Generate a cryptographically random lead ID.
 * Format: lead_{timestamp}_{random} for debugging + uniqueness.
 */
export function generateLeadId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  return `lead_${timestamp}_${random}`;
}

/**
 * Store the lead_id in localStorage before redirecting to Stripe.
 * Call this in `startCheckoutForPlan()` before the redirect.
 */
export function storeLeadId(leadId: string): void {
  try {
    localStorage.setItem(LEAD_ID_KEY, leadId);
  } catch {
    // localStorage unavailable (private browsing, storage full)
    // Fall back to sessionStorage
    try {
      sessionStorage.setItem(LEAD_ID_KEY, leadId);
    } catch {
      // Both unavailable — the email matching will still work as fallback
      console.warn('[LeadID] Storage unavailable. Email matching will be used as fallback.');
    }
  }
}

/**
 * Retrieve the stored lead_id after the user returns from Stripe.
 * Returns null if no lead_id was stored (user cleared storage, etc.)
 */
export function getStoredLeadId(): string | null {
  try {
    return localStorage.getItem(LEAD_ID_KEY) || sessionStorage.getItem(LEAD_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the Stripe session ID alongside the lead_id for correlation.
 * Called when the checkout session is created (before redirect).
 */
export function storeLeadSessionId(sessionId: string): void {
  try {
    localStorage.setItem(LEAD_SESSION_KEY, sessionId);
  } catch {
    try {
      sessionStorage.setItem(LEAD_SESSION_KEY, sessionId);
    } catch {
      // Silent fail
    }
  }
}

/**
 * Get the stored session ID for the current lead.
 */
export function getStoredLeadSessionId(): string | null {
  try {
    return localStorage.getItem(LEAD_SESSION_KEY) || sessionStorage.getItem(LEAD_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear all lead tracking data after successful account linking.
 */
export function clearLeadData(): void {
  try {
    localStorage.removeItem(LEAD_ID_KEY);
    localStorage.removeItem(LEAD_SESSION_KEY);
    sessionStorage.removeItem(LEAD_ID_KEY);
    sessionStorage.removeItem(LEAD_SESSION_KEY);
  } catch {
    // Silent fail
  }
}

/**
 * Check if the current user has a pending lead_id that needs linking.
 * Used on signup/login pages to trigger the linkCheckoutByLeadId callable.
 */
export function hasPendingLeadLink(): boolean {
  return getStoredLeadId() !== null;
}
