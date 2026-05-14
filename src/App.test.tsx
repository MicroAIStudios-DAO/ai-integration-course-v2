import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./components/UserJotWidget', () => ({
  UserJotWidget: () => null
}));

// Full analytics mock — covers all named exports and the default export object.
// Pre-existing failure was missing trackEvent (and others); now exhaustive.
vi.mock('./utils/analytics', () => ({
  initGA4: vi.fn(),
  initGA: vi.fn(),
  logPageView: vi.fn(),
  logEvent: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  trackCustomEvent: vi.fn(),
  trackSignUp: vi.fn(),
  trackFreeStarterOptIn: vi.fn(),
  trackGoogleAdsSignupConversion: vi.fn(),
  trackGoogleAdsPurchaseConversion: vi.fn(),
  trackViewPricing: vi.fn(),
  trackBeginCheckout: vi.fn(),
  trackCheckoutInitiated: vi.fn(),
  trackPurchase: vi.fn(),
  trackLessonStart: vi.fn(),
  trackLessonComplete: vi.fn(),
  trackLesson1Completed: vi.fn(),
  trackVideoProgress: vi.fn(),
  trackAITutorQueried: vi.fn(),
  trackCTAClick: vi.fn(),
  setUserProperties: vi.fn(),
  trackAudienceEvent: vi.fn(),
  trackError: vi.fn(),
  trackTrialConverted: vi.fn(),
  trackSubscriptionCancelled: vi.fn(),
  trackDunningEmailClicked: vi.fn(),
  trackBillingPortalOpened: vi.fn(),
  trackExitIntentShown: vi.fn(),
  trackExitIntentEmailCaptured: vi.fn(),
  default: {
    initGA4: vi.fn(),
    initGA: vi.fn(),
    logPageView: vi.fn(),
    logEvent: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackCustomEvent: vi.fn(),
    trackSignUp: vi.fn(),
    trackFreeStarterOptIn: vi.fn(),
    trackGoogleAdsSignupConversion: vi.fn(),
    trackGoogleAdsPurchaseConversion: vi.fn(),
    trackViewPricing: vi.fn(),
    trackBeginCheckout: vi.fn(),
    trackCheckoutInitiated: vi.fn(),
    trackPurchase: vi.fn(),
    trackLessonStart: vi.fn(),
    trackLessonComplete: vi.fn(),
    trackLesson1Completed: vi.fn(),
    trackVideoProgress: vi.fn(),
    trackAITutorQueried: vi.fn(),
    trackCTAClick: vi.fn(),
    setUserProperties: vi.fn(),
    trackAudienceEvent: vi.fn(),
    trackError: vi.fn(),
    trackTrialConverted: vi.fn(),
    trackSubscriptionCancelled: vi.fn(),
    trackDunningEmailClicked: vi.fn(),
    trackBillingPortalOpened: vi.fn(),
    trackExitIntentShown: vi.fn(),
    trackExitIntentEmailCaptured: vi.fn(),
  },
}));

vi.mock('./pages/HomePage', () => ({
  default: () => <main>Mock Home Page</main>
}));

test('renders app root route', () => {
  render(<App />);
  expect(screen.getByText(/Mock Home Page/i)).toBeInTheDocument();
});

test('renders router without crashing', () => {
  render(<App />);
  expect(screen.getByText(/Mock Home Page/i)).toBeInTheDocument();
});
