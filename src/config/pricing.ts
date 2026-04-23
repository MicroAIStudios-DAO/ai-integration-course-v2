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
  /** Legacy field kept for compatibility with older trial-aware code paths */
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
      { text: 'Core subscription access', included: true, bold: true },
      { text: 'Premium curriculum unlocks immediately', included: true },
      { text: 'All premium lessons and useful builds', included: true },
      { text: 'AI Tutor - 24/7 Personalized Help', included: true },
      { text: 'Guided build system and templates', included: true },
      { text: 'Community access', included: true },
      { text: 'Live Q&A archive', included: true },
      { text: 'Annual launch discount', included: false },
      { text: 'Enterprise team controls', included: false },
    ],
  },
  pro: {
    key: 'pro',
    name: 'Annual',
    tagline: 'Save $120/year vs monthly billing',
    displayPrice: 239.88,
    intervalLabel: '/year',
    billingInterval: 'year',
    monthlyEquivalent: 19.99,
    anchorMonthlyPrice: 29.99,
    trialDays: 0,
    seatCount: 1,
    ctaText: 'Lock In $19.99/mo',
    featured: true,
    analyticsValue: 239.88,
    features: [
      { text: 'Everything in Monthly', included: true, bold: true },
      { text: 'Save $120/year — locked in for 12 months', included: true, bold: true },
      { text: 'Effective rate of $19.99/month', included: true },
      { text: 'Premium curriculum unlocks immediately', included: true },
      { text: 'AI Tutor - 24/7 Personalized Help', included: true },
      { text: 'Guided build system and templates', included: true },
      { text: 'Community access', included: true },
      { text: 'Live Q&A archive', included: true },
      { text: 'Priority update access during launch', included: true },
      { text: 'Enterprise team controls', included: false },
    ],
  },
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

export const planKeys: PlanKey[] = ['explorer', 'pro', 'corporate'];

/** Format price for display — integers show without decimals */
export const formatPlanPrice = (amount: number): string =>
  Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);

// Legacy exports for backward compatibility during migration
export type CheckoutPlanKey = PlanKey;
export const getCheckoutPlan = getPlan;
export const checkoutPlans = plans;
