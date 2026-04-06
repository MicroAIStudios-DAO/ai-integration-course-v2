export type CheckoutPlanKey = 'explorer_monthly' | 'pro_annual' | 'corporate_monthly' | 'pro_monthly' | 'beta_monthly';

export interface CheckoutPlanDefinition {
  key: CheckoutPlanKey;
  priceId: string;
  /** The amount the customer sees per month (for display purposes) */
  displayMonthlyPrice: number;
  /** The actual amount charged per billing cycle */
  chargeAmount: number;
  /** Original/anchor price to show as slashed (optional) */
  anchorPrice?: number;
  /** Backward-compat alias — returns displayMonthlyPrice */
  amount: number;
  name: string;
  intervalLabel: string;
  billingNote?: string;
}

// -------------------------------------------------------------------
// Price IDs — resolved from environment, with Stripe-created fallbacks
// -------------------------------------------------------------------
const explorerMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_EXPLORER_MONTHLY ||
  'price_1TJKN0KnsQ10RdBLouqbpgBK';

const proAnnualPriceId =
  process.env.REACT_APP_STRIPE_PRICE_PRO_ANNUAL ||
  'price_1TJKN0KnsQ10RdBLZx1iXlTA';

const corporateMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_CORPORATE_MONTHLY ||
  'price_1TJKN1KnsQ10RdBLppS1qfoy';

// Legacy — keep for backward compatibility with existing subscribers
const proMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_PRO_MONTHLY ||
  process.env.REACT_APP_STRIPE_PRICE_ID ||
  'price_1SmgMKKnsQ10RdBLEWL2w8e4';

const betaMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_BETA_MONTHLY || '';

// -------------------------------------------------------------------
// Plan definitions
// -------------------------------------------------------------------
export const checkoutPlans: Record<CheckoutPlanKey, CheckoutPlanDefinition> = {
  explorer_monthly: {
    key: 'explorer_monthly',
    priceId: explorerMonthlyPriceId,
    displayMonthlyPrice: 29.99,
    chargeAmount: 29.99,
    amount: 29.99,
    name: 'Explorer',
    intervalLabel: 'month',
    billingNote: 'Billed monthly',
  },
  pro_annual: {
    key: 'pro_annual',
    priceId: proAnnualPriceId,
    displayMonthlyPrice: 19.99,
    chargeAmount: 239.88,
    anchorPrice: 49,
    amount: 19.99,
    name: 'Pro',
    intervalLabel: 'year',
    billingNote: 'Paid annually',
  },
  corporate_monthly: {
    key: 'corporate_monthly',
    priceId: corporateMonthlyPriceId,
    displayMonthlyPrice: 149,
    chargeAmount: 149,
    amount: 149,
    name: 'Corporate',
    intervalLabel: 'month',
    billingNote: 'Per team · up to 25 seats',
  },
  // Legacy plans — kept for existing subscriber compatibility
  pro_monthly: {
    key: 'pro_monthly',
    priceId: proMonthlyPriceId,
    displayMonthlyPrice: 49,
    chargeAmount: 49,
    amount: 49,
    name: 'Pro (Monthly)',
    intervalLabel: 'month',
  },
  beta_monthly: {
    key: 'beta_monthly',
    priceId: betaMonthlyPriceId,
    displayMonthlyPrice: 29.99,
    chargeAmount: 29.99,
    amount: 29.99,
    name: 'Paid Beta',
    intervalLabel: 'month',
  },
};

export const getCheckoutPlan = (key: CheckoutPlanKey): CheckoutPlanDefinition =>
  checkoutPlans[key];

export const formatPlanPrice = (amount: number): string =>
  Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);

/**
 * Returns the conversion value for Google Ads tracking.
 * Uses the actual charge amount, not the display monthly price.
 */
export const getConversionValue = (key: CheckoutPlanKey): number => {
  const plan = checkoutPlans[key];
  return plan?.chargeAmount ?? 0;
};
