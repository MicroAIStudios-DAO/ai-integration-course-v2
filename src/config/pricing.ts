export type CheckoutPlanKey = 'pro_monthly' | 'pro_annual' | 'beta_monthly';

export interface CheckoutPlanDefinition {
  key: CheckoutPlanKey;
  priceId: string;
  amount: number;
  name: string;
  intervalLabel: string;
}

const proMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_PRO_MONTHLY ||
  process.env.REACT_APP_STRIPE_PRICE_ID ||
  'price_1SmgMKKnsQ10RdBLEWL2w8e4';

const proAnnualPriceId =
  process.env.REACT_APP_STRIPE_PRICE_PRO_ANNUAL ||
  'price_pro_annual';

const betaMonthlyPriceId =
  process.env.REACT_APP_STRIPE_PRICE_BETA_MONTHLY ||
  '';

export const checkoutPlans: Record<CheckoutPlanKey, CheckoutPlanDefinition> = {
  pro_monthly: {
    key: 'pro_monthly',
    priceId: proMonthlyPriceId,
    amount: 49,
    name: 'Pro Plan',
    intervalLabel: 'month',
  },
  pro_annual: {
    key: 'pro_annual',
    priceId: proAnnualPriceId,
    amount: 39,
    name: 'Pro Annual',
    intervalLabel: 'month',
  },
  beta_monthly: {
    key: 'beta_monthly',
    priceId: betaMonthlyPriceId,
    amount: 29.99,
    name: 'Paid Beta',
    intervalLabel: 'month',
  },
};

export const getCheckoutPlan = (key: CheckoutPlanKey): CheckoutPlanDefinition => checkoutPlans[key];

export const formatPlanPrice = (amount: number): string =>
  Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
