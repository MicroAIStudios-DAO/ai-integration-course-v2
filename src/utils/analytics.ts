/**
 * GA4 + Google Ads Analytics Utility for AI Integration Course
 * 
 * Events tracked per Gemini Growth Audit:
 * - sign_up: User registration (method: Google/Email)
 * - view_item: Pricing page load (currency, value)
 * - begin_checkout: Click "Upgrade" (price, currency, items)
 * - purchase: Stripe webhook / Success page (transaction_id, value, tax)
 * - lesson_start: Video play (lesson_id, module)
 * - lesson_complete: Button click / Video end (lesson_id)
 * 
 * Google Ads Conversion Tracking:
 * - Account creation conversion (AW-17956658756/YJI_CJzD95EcEMS8s_JC)
 *   Fires after checkout account creation to track completed signups
 * 
 * Audience Segments:
 * - Window Shoppers: Viewed Pricing > 0 AND Checkout = 0
 * - Cart Abandoners: Checkout > 0 AND Purchase = 0
 * - Zombie Users: Purchase > 0 AND Lesson Start = 0 (30d)
 */

// GA4 Measurement ID
const GA4_MEASUREMENT_ID = 'G-15SDDF1S5S';

// Google Ads Conversion ID and Labels
const GOOGLE_ADS_ID = 'AW-17956658756';
// SECONDARY: fires on account creation (signup after checkout). Demoted from primary
// so Smart Bidding optimizes toward actual revenue (purchase), not shallow signups.
const GOOGLE_ADS_SIGNUP_LABEL = 'YJI_CJzD95EcEMS8s_JC';
// PRIMARY: fires on verified paid subscription (PaymentSuccessPage).
// This is the conversion action Google Ads should optimize toward with tROAS/value-based bidding.
// TODO: Create this conversion action in Google Ads → Goals → Conversions → New:
//   Name: Paid_Subscription  |  Category: Purchase  |  Value: Use different values  |  Count: One
//   Set as: PRIMARY action  |  Attribution: Data-driven
//   Then paste the label here:
const GOOGLE_ADS_PURCHASE_LABEL = 'wFMCIPj_5gcEMS8s_JC'; // Repurposed from Pro_Trial_Value (no trials exist)

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Initialize GA4 + Google Ads tracking
 * gtag.js is loaded once in index.html with both AW- and G- configs.
 * This function ensures the gtag reference is available for SPA use.
 */
export const initGA4 = (): void => {
  if (typeof window !== 'undefined') {
    // gtag.js is loaded in index.html — just ensure the function reference exists
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
    console.log('[Analytics] GA4 + Google Ads ready:', GA4_MEASUREMENT_ID, GOOGLE_ADS_ID);
  }
};

// Legacy aliases for backward compatibility
export const initGA = initGA4;
export const logPageView = () => trackPageView(window.location.pathname);
export const logEvent = (category: string, action: string, label?: string) => {
  trackCustomEvent(category, action, label);
};
export const trackEvent = (action: string, category: string, label?: string) => {
  trackCustomEvent(category, action, label);
};

/**
 * Track page views (automatic with config, but can be called manually for SPAs)
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
};

/**
 * Track custom events (legacy support)
 */
export const trackCustomEvent = (category: string, action: string, label?: string): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};

/**
 * Track user sign up
 * Trigger: On Auth Success (Firebase Auth callback)
 */
export const trackSignUp = (method: 'Google' | 'Email' | 'GitHub' | string): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
    console.log('[Analytics] sign_up:', method);
  }
};

export const trackFreeStarterOptIn = (
  source: string,
  destination: string = '/courses'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'free_starter_optin', {
      source,
      destination,
    });
    console.log('[Analytics] free_starter_optin:', { source, destination });
  }
};

/**
 * Track Google Ads conversion for completed account creation.
 * Use this after the user finishes signup so trials and paid enrollments both count
 * as successful account creation without relying on a page-load destination rule.
 *
 * Conversion ID: AW-17956658756
 * Conversion Label: YJI_CJzD95EcEMS8s_JC
 */
export const trackGoogleAdsSignupConversion = (
  value: number = 239.88,
  currency: string = 'USD'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_SIGNUP_LABEL}`,
      value: value,
      currency: currency,
    });
    console.log('[Analytics] Google Ads conversion fired:', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_SIGNUP_LABEL}`,
      value,
      currency,
    });
  }
};

/**
 * Track paid subscription as the PRIMARY Google Ads conversion with actual plan value.
 *
 * Fires on PaymentSuccessPage AFTER the checkout session is verified as completed.
 * This is the conversion action Google Ads should optimize with tROAS / value-based bidding.
 *
 * Enhanced conversions: passes the subscriber's email so Google can match the
 * ad click → conversion even when cookies are blocked or cross-device.
 * Google hashes the email client-side before sending it to their servers.
 *
 * transaction_id (Stripe session ID) deduplicates if the user reloads the page.
 */
export const trackGoogleAdsPurchaseConversion = (
  transactionId: string,
  value: number,
  email: string,
  currency: string = 'USD'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Set enhanced conversion data (plain-text email; Google hashes it client-side)
    if (email) {
      window.gtag('set', 'user_data', { email: email.trim().toLowerCase() });
    }

    // Fire the Google Ads purchase conversion
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value,
      currency,
      transaction_id: transactionId,
    });

    console.log('[Analytics] Google Ads purchase conversion fired:', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value,
      currency,
      transaction_id: transactionId,
      enhanced_conversions: Boolean(email),
    });
  }
};

/**
 * Track pricing page view (view_item event)
 * Also triggers Firebase function for churn tracking
 * Trigger: Pricing Page Load
 */
export const trackViewPricing = (
  currency: string = 'USD',
  value: number = 239.88,
  itemName: string = 'Pro AI Architect'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: currency,
      value: value,
      items: [
        {
          item_id: 'pro',
          item_name: itemName,
          price: value,
          quantity: 1,
        },
      ],
    });
    console.log('[Analytics] view_item (pricing):', { currency, value, itemName });
  }
};

/**
 * Track checkout initiation (begin_checkout)
 * Trigger: Click "Start Free Trial", "Start Building Now", or "Start Team Plan"
 */
export const trackBeginCheckout = (
  price: number,
  currency: string = 'USD',
  planName: string = 'Annual',
  planId: string = 'pro',
  quantity: number = 1
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    const payload = {
      currency: currency,
      value: price,
      plan_id: planId,
      plan_name: planName,
      items: [
        {
          item_id: planId,
          item_name: planName,
          price: quantity > 0 ? Number((price / quantity).toFixed(2)) : price,
          quantity,
        },
      ],
    };

    window.gtag('event', 'begin_checkout', payload);
    window.gtag('event', 'checkout_initiated', payload);
    console.log('[Analytics] checkout_initiated:', { price, currency, planName, planId });
  }
};

export const trackCheckoutInitiated = trackBeginCheckout;

/**
 * Track successful purchase (paid conversions only — NOT trials)
 * Trigger: Stripe Webhook / Payment Success Page
 * NOTE: Prefer server-side tracking for accuracy.
 * Explorer trial starts should fire trial_start, not purchase.
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  tax: number = 0,
  planName: string = 'Pro AI Architect',
  planId: string = 'pro'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      tax: tax,
      items: [
        {
          item_id: planId,
          item_name: planName,
          price: value,
          quantity: 1,
        },
      ],
    });
    console.log('[Analytics] purchase:', { transactionId, value, currency, tax });
  }
};

/**
 * Track lesson start
 * Trigger: Video Play / Lesson Page Load
 */
export const trackLessonStart = (
  lessonId: string,
  lessonTitle: string,
  moduleId: string,
  moduleTitle: string,
  courseId?: string
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'lesson_start', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      module_id: moduleId,
      module_title: moduleTitle,
      course_id: courseId || 'default',
    });
    console.log('[Analytics] lesson_start:', { lessonId, lessonTitle, moduleId });
  }
};

/**
 * Track lesson completion
 * Trigger: Button Click / Video End
 */
export const trackLessonComplete = (
  lessonId: string,
  lessonTitle: string,
  moduleId: string,
  completionMethod: 'video_end' | 'button_click' | 'auto' = 'auto'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'lesson_complete', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      module_id: moduleId,
      completion_method: completionMethod,
    });
    console.log('[Analytics] lesson_complete:', { lessonId, completionMethod });
  }
};

export const trackLesson1Completed = (
  lessonId: string,
  lessonTitle: string,
  moduleId: string,
  completionMethod: 'video_end' | 'button_click' | 'auto' = 'auto'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'lesson_1_completed', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      module_id: moduleId,
      completion_method: completionMethod,
    });
    console.log('[Analytics] lesson_1_completed:', { lessonId, completionMethod });
  }
};

/**
 * Track video progress (for engagement metrics)
 */
export const trackVideoProgress = (
  lessonId: string,
  percentComplete: number,
  videoTitle: string
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track at 25%, 50%, 75%, 100% milestones
    const milestones = [25, 50, 75, 100];
    if (milestones.includes(percentComplete)) {
      window.gtag('event', 'video_progress', {
        lesson_id: lessonId,
        video_title: videoTitle,
        percent_complete: percentComplete,
      });
    }
  }
};

export const trackAITutorQueried = (
  lessonId: string,
  premium: boolean = false
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ai_tutor_queried', {
      lesson_id: lessonId,
      premium,
    });
    console.log('[Analytics] ai_tutor_queried:', { lessonId, premium });
  }
};

/**
 * Track CTA clicks for A/B testing
 */
export const trackCTAClick = (
  ctaName: string,
  ctaLocation: string,
  ctaVariant?: string
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
      cta_variant: ctaVariant || 'default',
    });
    console.log('[Analytics] cta_click:', { ctaName, ctaLocation });
  }
};

/**
 * Set user properties for audience segmentation
 */
export const setUserProperties = (properties: {
  user_id?: string;
  subscription_status?: 'free' | 'explorer' | 'pro' | 'corporate' | 'trial';
  signup_date?: string;
  last_lesson_date?: string;
  lessons_completed?: number;
}): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', properties);
    
    // Also set user_id if provided
    if (properties.user_id) {
      window.gtag('config', GA4_MEASUREMENT_ID, {
        user_id: properties.user_id,
      });
    }
  }
};

/**
 * Track custom events for audience building
 */
export const trackAudienceEvent = (
  audienceType: 'window_shopper' | 'cart_abandoner' | 'zombie_user' | 'engaged_user',
  additionalParams?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `audience_${audienceType}`, {
      ...additionalParams,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Track errors for debugging
 */
export const trackError = (
  errorType: string,
  errorMessage: string,
  errorLocation: string
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: `${errorType}: ${errorMessage}`,
      fatal: false,
      error_location: errorLocation,
    });
  }
};

// Export all functions as named object for convenience
const analytics = {
  initGA4,
  initGA,
  logPageView,
  logEvent,
  trackEvent,
  trackPageView,
  trackCustomEvent,
  trackSignUp,
  trackFreeStarterOptIn,
  trackGoogleAdsSignupConversion,
  trackGoogleAdsPurchaseConversion,
  trackViewPricing,
  trackBeginCheckout,
  trackCheckoutInitiated,
  trackPurchase,
  trackLessonStart,
  trackLessonComplete,
  trackLesson1Completed,
  trackVideoProgress,
  trackAITutorQueried,
  trackCTAClick,
  setUserProperties,
  trackAudienceEvent,
  trackError,
};

export default analytics;
