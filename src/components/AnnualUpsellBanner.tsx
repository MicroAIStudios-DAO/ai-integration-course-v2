import React, { useEffect, useState } from 'react';
import { trackAnnualUpsellClick } from '../utils/analytics';

/**
 * Section 12 — Annual Upsell In-App Banner
 * Shown to monthly subscribers after 30 days on dashboard.
 * Dismissed state persisted to localStorage.
 */

interface AnnualUpsellBannerProps {
  subscriptionTier?: string;
  billingInterval?: string;
  subscriptionStartedAt?: Date | null;
}

const PRICING_URL = 'https://aiintegrationcourse.com/pricing';
const UTM = '?plan=pro&utm_source=in_app_banner&utm_medium=dashboard&utm_campaign=annual_upsell_day30';
const DISMISS_KEY = 'annual_upsell_banner_dismissed_v1';

const AnnualUpsellBanner: React.FC<AnnualUpsellBannerProps> = ({
  subscriptionTier,
  billingInterval,
  subscriptionStartedAt,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      billingInterval !== 'month' ||
      !subscriptionStartedAt ||
      localStorage.getItem(DISMISS_KEY)
    ) return;

    const daysSinceStart =
      (Date.now() - new Date(subscriptionStartedAt).getTime()) / (24 * 60 * 60 * 1000);

    if (daysSinceStart >= 30) {
      setVisible(true);
    }
  }, [billingInterval, subscriptionStartedAt]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  const handleUpgrade = () => {
    trackAnnualUpsellClick(subscriptionTier || 'explorer', 'dashboard');
    window.location.href = `${PRICING_URL}${UTM}`;
  };

  return (
    <div
      role="banner"
      aria-label="Annual plan upgrade offer"
      style={{
        background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)',
        color: '#ffffff',
        padding: '14px 20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '200px' }}>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>
          Save $120 — switch to annual billing
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#a7f3d0',
            marginTop: '2px',
          }}
        >
          You've been building for 30 days. Lock in $19.99/month — same access, $120 back.
        </span>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={handleUpgrade}
          style={{
            background: '#10b981',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Switch to Annual →
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss upgrade banner"
          style={{
            background: 'transparent',
            color: '#a7f3d0',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default AnnualUpsellBanner;
