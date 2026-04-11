import React, { useState } from 'react';
import { PlanKey, getPlan } from '../../config/pricing';
import { trackBeginCheckout } from '../../utils/analytics';
import { startCheckoutForPlan } from '../../utils/checkout';

interface SubscribeButtonProps {
  /** Trusted plan key — server resolves this to a Stripe price ID */
  planKey: PlanKey;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

const SubscribeButton: React.FC<SubscribeButtonProps> = ({
  planKey,
  buttonText,
  className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const plan = getPlan(planKey);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      trackBeginCheckout(
        plan.analyticsValue,
        'USD',
        plan.name,
        planKey
      );

      await startCheckoutForPlan(planKey);
      return;
    } catch (e: any) {
      console.error('[Checkout] Error:', e);
      alert(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Redirecting to checkout...
        </span>
      ) : (
        buttonText || plan.ctaText
      )}
    </button>
  );
};

export default SubscribeButton;
