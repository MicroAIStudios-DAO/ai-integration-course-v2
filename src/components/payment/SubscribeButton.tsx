import React from 'react';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { functions } from '../../config/firebase';

interface SubscribeButtonProps {
  priceId?: string;
  buttonText?: string;
  className?: string;
}

const SubscribeButton: React.FC<SubscribeButtonProps> = ({ 
  priceId,
  buttonText = "Subscribe Now",
  className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
}) => {
  const { currentUser } = useAuth();
  const handleClick = async () => {
    try {
      if (!currentUser) { alert('Please log in first.'); return; }
      const origin = window.location.origin;
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({
        priceId: priceId || "default_price_id",
        successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/payment-cancel`
      });
      const data = result.data as { url?: string };
      if (data?.url) { window.location.href = data.url; return; }
      alert('Unexpected response from checkout');
    } catch (e:any) {
      alert(e?.message || 'Stripe error');
    }
  };

  return (
    <div>
      <button onClick={handleClick} className={className}>
        {buttonText}
      </button>
      {/* Placeholder for error messages or login prompts */}
    </div>
  );
};

export default SubscribeButton;
