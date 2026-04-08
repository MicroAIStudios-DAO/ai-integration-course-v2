/**
 * Client-side pricing config
 *
 * IMPORTANT: This file is for DISPLAY ONLY.
 * The server (functions/src/stripe.ts PLAN_CONFIG) is the authority
 * for Stripe price IDs, trial eligibility, and billing intervals.
 * The client never sends a price ID — only a planKey.
 */

export type PlanKey = 'explorer' | 'pro' | 'corporate';

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
  /** Trial length in days (0 = no trial) */
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
  explorer: {
    key: 'explorer',
    name: 'Explorer',
    tagline: 'Start with a 7-day trial',
    displayPrice: 29.99,
    intervalLabel: '/month',
    billingInterval: 'month',
    trialDays: 7,
    seatCount: 1,
    ctaText: 'Start 7-Day Trial',
    featured: false,
    analyticsValue: 29.99,
    features: [
      { text: '7-day full-access trial', included: true, bold: true },
      { text: 'All Premium Lessons (50+ hours)', included: true },
      { text: 'AI Tutor - 24/7 Personalized Help', included: true },
      { text: 'Build Your First Bot - Guided Project', included: true },
      { text: 'Certificate of Completion', included: true },
      { text: 'Community Access', included: true },
      { text: 'Shared workflow libraries', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro AI Architect',
    tagline: 'Best value for serious builders',
    displayPrice: 239.88,
    intervalLabel: '/year',
    billingInterval: 'year',
    monthlyEquivalent: 19.99,
    anchorMonthlyPrice: 39.99,
    trialDays: 0,
    seatCount: 1,
    ctaText: 'Start Building Now',
    featured: true,
    analyticsValue: 239.88,
    features: [
      { text: 'All Premium Lessons (50+ hours)', included: true, bold: true },
      { text: 'AI Tutor - 24/7 Personalized Help', included: true },
      { text: 'Build Your First Bot - Guided Project', included: true },
      { text: 'Certificate of Completion', included: true },
      { text: 'Private Community Access', included: true },
      { text: 'Monthly Live Q&A Sessions', included: true },
      { text: 'Monthly content updates included', included: true },
      { text: 'Shared workflow libraries', included: false },
    ],
  },
  corporate: {
    key: 'corporate',
    name: 'Team AI Standard',
    tagline: 'Standardize your team\'s AI operations',
    displayPrice: 149.00,
    intervalLabel: '/month',
    billingInterval: 'month',
    trialDays: 0,
    seatCount: 5,
    ctaText: 'Start Team Plan',
    featured: false,
    analyticsValue: 149.00,
    features: [
      { text: 'Everything in Pro AI Architect', included: true, bold: true },
      { text: 'Up to 5 team seats', included: true, bold: true },
      { text: 'Shared workflow libraries', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team progress dashboard', included: true },
      { text: 'Audited, high-performance agent templates', included: true },
      { text: 'Onboarding & implementation support', included: true },
    ],
  },
};

export const getPlan = (key: PlanKey): PlanDefinition => plans[key];

export const planKeys: PlanKey[] = ['explorer', 'pro', 'corporate'];

/** Format price for display — integers show without decimals */
export const formatPlanPrice = (amount: number): string =>
  Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);

// Legacy exports for backward compatibility during migration
export type CheckoutPlanKey = PlanKey;
export const getCheckoutPlan = getPlan;
export const checkoutPlans = plans;
