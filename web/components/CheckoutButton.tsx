"use client";
import { getFirebase } from '@/lib/firebase';
import { useState } from 'react';

type Props = { priceId: string };

export default function CheckoutButton({ priceId }: Props) {
  const { functions, httpsCallable } = getFirebase();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const callable = httpsCallable<any, { url: string }>(functions, 'createCheckoutSessionV2');
      const res = await callable({
        priceId,
        successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/payment-cancel`
      });
      const url = (res.data as any)?.url;
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
      alert('Failed to start checkout.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={startCheckout} disabled={loading}>
      {loading ? 'Redirecting…' : 'Upgrade to Premium'}
    </button>
  );
}
