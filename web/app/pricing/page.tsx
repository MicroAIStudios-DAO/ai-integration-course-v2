import CheckoutButton from '@/components/CheckoutButton';

export default function PricingPage() {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_123';
  return (
    <div>
      <h1>Premium Access</h1>
      <p>Unlock premium lessons, videos, and advanced guides.</p>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, width: 320 }}>
          <h2>Free</h2>
          <ul>
            <li>Intro + Setup</li>
            <li>Community access</li>
          </ul>
        </div>
        <div style={{ border: '2px solid black', borderRadius: 8, padding: 16, width: 320 }}>
          <h2>Premium</h2>
          <ul>
            <li>All premium lessons</li>
            <li>Full video library</li>
            <li>Priority updates</li>
          </ul>
          <CheckoutButton priceId={priceId} />
        </div>
      </div>
    </div>
  );
}

