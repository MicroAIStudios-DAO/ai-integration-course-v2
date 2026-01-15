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
      const callable = httpsCallable<any, { url: string }>(functions, 'createCheckoutSession');
      const res = await callable({ priceId });
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

