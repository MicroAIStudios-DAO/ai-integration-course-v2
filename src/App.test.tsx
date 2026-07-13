import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    loading: false,
    logout: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

vi.mock('./pages/NewLandingPage', () => ({
  default: () => <main>Mock Paid Traffic Landing Page</main>
}));

vi.mock('./pages/PaidTrafficLandingPage', () => ({
  default: () => <main>Mock Paid Traffic Landing Page</main>
}));

// Routes are lazy-loaded behind <Suspense>, so the page content resolves
// asynchronously after the fallback — use findBy* (async) rather than getBy*.
test('renders app root route', async () => {
  render(
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  );
  expect(await screen.findByText(/Mock Paid Traffic Landing Page/i)).toBeInTheDocument();
});

test('renders router without crashing', async () => {
  render(
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  );
  expect(await screen.findByText(/Mock Paid Traffic Landing Page/i)).toBeInTheDocument();
});


