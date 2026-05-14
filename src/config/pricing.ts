/**
 * Client-side pricing config
 *
 * IMPORTANT: This file is for DISPLAY ONLY.
 * The server (functions/src/stripe.ts PLAN_CONFIG) is the authority
 * for Stripe price IDs, trial eligibility, and billing intervals.
 * The client never sends a price ID — only a planKey.
 *
 * Offer architecture (per CRO brief v2):
 *   Primary CTA  → pro_trial  ($1 today, 7-day trial, then $29.99/month)
 *   Secondary CTA → pro       ($239/year, best value)
 *   Hidden/de-emphasized → explorer (monthly, post-trial renewal path)
 *   Enterprise → corporate
 */

export type PlanKey = 'explorer' | 'pro' | 'pro_trial' | 'corporate';

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  /** Short tagline for the card */
  tagline: string;
  /** Price displayed in the hero of the card */
  displayPrice: number;
  /** '/month' or '/year' */
  intervalLabel: string;
  /** Billing interval for context copy */
  billingInterval: 'month' | 'year';
  /** If annual, the monthly equivalent shown as supporting copy */
  monthlyEquivalent?: number;
  /** Strikethrough anchor price (marketing) */
  anchorMonthlyPrice?: number;
  /** Trial days — 7 for pro_trial, 0 for all others */
  trialDays: number;
  /** Number of seats included */
  seatCount: number;
  /** CTA button text */
  ctaText: string;
  /** Whether this is the featured/recommended plan */
  featured: boolean;
  /** Analytics value in USD (per billing interval) */
  analyticsValue: number;
  /** Feature list for the pricing card */
  features: Array<{ text: string; included: boolean; bold?: boolean }>;
}

export const plans: Record<PlanKey, PlanDefinition> = {
  // ── PRIMARY OFFER ────────────────────────────────────────────────────────────
  pro_trial: {
    key: 'pro_trial',
    name: 'Pro Trial',
    tagline: '7 days of full access, then $29.99/month unless cancelled before renewal.',
    displayPrice: 1,
    intervalLabel: ' today',
    billingInterval: 'month',
    trialDays: 7,
    seatCount: 1,
    ctaText: 'Start My $1 Trial',
    featured: true,
    analyticsValue: 1,
    features: [
      { text: 'Full course access during trial', included: true, bold: true },
      { text: 'Templates, prompts, and playbooks', included: true },
      { text: 'Quick-start implementation path', included: true },
      { text: 'AI Tutor — 24/7 personalized help', included: true },
      { text: '14-Day Build Guarantee', included: true, bold: true },
      { text: 'Instant unlock after checkout', included: true },
      { text: 'Cancel before day 8 in 2 clicks', included: true },
    ],
  },

  // ── BEST VALUE OFFER ─────────────────────────────────────────────────────────
  pro: {
    key: 'pro',
    name: 'Pro Annual — Best Value',
    tagline: "That's just $19.99/month equivalent. Save $120 vs monthly.",
    displayPrice: 239,
    intervalLabel: '/year',
    billingInterval: 'year',
    monthlyEquivalent: 19.99,
    anchorMonthlyPrice: 29.99,
    trialDays: 0,
    seatCount: 1,
    ctaText: 'Get Annual Access',
    featured: false,
    analyticsValue: 239,
    features: [
      { text: 'Full annual access', included: true, bold: true },
      { text: 'Lowest effective price — $19.99/month', included: true, bold: true },
      { text: 'Templates, prompts, and playbooks', included: true },
      { text: 'All updates during membership', included: true },
      { text: 'AI Tutor — 24/7 personalized help', included: true },
      { text: '14-Day Build Guarantee', included: true },
      { text: 'Priority update access', included: true },
    ],
  },

  // ── POST-TRIAL RENEWAL PATH (de-emphasized on pricing page) ─────────────────
  explorer: {
    key: 'explorer',
    name: 'Monthly',
    tagline: 'Core subscription billed month to month',
    displayPrice: 29.99,
    intervalLabel: '/month',
    billingInterval: 'month',
    trialDays: 0,
    seatCount: 1,
    ctaText: 'Start Monthly',
    featured: false,
    analyticsValue: 29.99,
    features: [
      { text: 'Full course access', included: true, bold: true },
      { text: 'Templates, prompts, and playbooks', included: true },
      { text: 'AI Tutor — 24/7 personalized help', included: true },
      { text: 'Guided build system', included: true },
      { text: 'Community access', included: true },
      { text: 'Live Q&A archive', included: true },
      { text: '14-Day Build Guarantee', included: true },
    ],
  },

  // ── ENTERPRISE ───────────────────────────────────────────────────────────────
  corporate: {
    key: 'corporate',
    name: 'Enterprise',
    tagline: '$14.99 per seat with a 5-seat minimum',
    displayPrice: 74.95,
    intervalLabel: '/month',
    billingInterval: 'month',
    trialDays: 0,
    seatCount: 5,
    ctaText: 'Set Up Team Access',
    featured: false,
    analyticsValue: 74.95,
    features: [
      { text: 'Everything in Annual', included: true, bold: true },
      { text: '$14.99 per seat, minimum 5 seats', included: true, bold: true },
      { text: 'Shared workflow libraries', included: true },
      { text: 'Team progress dashboard', included: true },
      { text: 'Priority support', included: true },
      { text: 'Audited agent templates for teams', included: true },
      { text: 'Onboarding and implementation support', included: true },
    ],
  },
};

export const getPlan = (key: PlanKey): PlanDefinition => plans[key];

/** Primary display order: trial first, then annual, monthly de-emphasized */
export const planKeys: PlanKey[] = ['pro_trial', 'pro', 'explorer', 'corporate'];

/** Format price for display — integers show without decimals */
export const formatPlanPrice = (amount: number): string =>
  Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);

// Legacy exports for backward compatibility during migration
export type CheckoutPlanKey = PlanKey;
export const getCheckoutPlan = getPlan;
export const checkoutPlans = plans;
