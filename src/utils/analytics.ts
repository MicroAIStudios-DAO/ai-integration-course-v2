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
 * - Sign-up / Welcome Page conversion (AW-17956658756/YJI_CJzD95EcEMS8s_JC)
 *   Fires on /welcome page load to track successful signups
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
const GOOGLE_ADS_SIGNUP_LABEL = 'YJI_CJzD95EcEMS8s_JC';
// Pro_Trial_Value secondary conversion label — create this action in Google Ads:
//   Goals → Conversions → New conversion action → Website
//   Name: Pro_Trial_Value | Category: Lead | Value: Use value from tag | Count: One
//   Set as: Secondary action (avoids double-counting with trial_start primary)
// After creating, replace the placeholder below with the actual label from Google Ads:
const GOOGLE_ADS_PRO_TRIAL_LABEL = 'wFMCIPj_5gcEMS8s_JC'; // Pro_Trial_Value — $119.94 lead value (50% of annual)

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Initialize GA4 + Google Ads tracking
 * Call this once in App.tsx or index.tsx
 */
export const initGA4 = (): void => {
  // Check if already initialized
  if (typeof window !== 'undefined' && !window.gtag) {
    // Add gtag script (use GA4 ID as primary; Google Ads config piggybacks)
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());

    // Configure GA4
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
    });

    // Configure Google Ads conversion tracking (remarketing + conversion linker)
    window.gtag('config', GOOGLE_ADS_ID);

    console.log('[Analytics] GA4 initialized:', GA4_MEASUREMENT_ID);
    console.log('[Analytics] Google Ads initialized:', GOOGLE_ADS_ID);
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

/**
 * Track Google Ads conversion for paid subscriptions.
 * IMPORTANT: Do NOT fire this for Explorer trial starts.
 * Only fire for actual paid conversions (Pro, Corporate).
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
 * Track Pro trial start as a secondary Google Ads conversion with predictive lead value.
 *
 * ONLY fires for Pro plan (planKey === 'pro') — NOT Explorer, NOT Corporate.
 *
 * Rationale: Pro annual ($239.88/yr) trials have high purchase intent.
 * Seeding the Google Ads algorithm with $119.94 (50% of annual price) gives
 * Maximize Conversion Value a real signal to optimize against during the
 * 7-day trial window, instead of waiting for the Day-7 rebill to confirm value.
 *
 * This is a SECONDARY conversion action — it does NOT replace trial_start.
 * It runs alongside trial_start on the same page load for Pro trials only.
 *
 * Google Ads setup required (one-time):
 *   Goals → Conversions → New conversion action → Website
 *   Name: Pro_Trial_Value
 *   Category: Lead (NOT Purchase — this is a predictive signal, not a charge)
 *   Value: Use different values for each conversion
 *   Count: One (one per trial start, not per session)
 *   Attribution: Data-driven (or Last click if DDA unavailable)
 *   Set as: Secondary action (prevents double-counting in bid strategy)
 *   After creating: replace GOOGLE_ADS_PRO_TRIAL_LABEL with the new label above.
 */
export const trackProTrialValue = (transactionId: string): void => {
  const PRO_TRIAL_LEAD_VALUE = 119.94; // 50% of $239.88 annual price
  if (typeof window !== 'undefined' && window.gtag) {
    // Primary: fire Google Ads secondary conversion event.
    // transaction_id (mapped to order_id) is passed to Google Ads for deduplication:
    // if the /payment-success page reloads or the user navigates back, Google Ads
    // will deduplicate on this ID and count only one conversion per Stripe session.
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PRO_TRIAL_LABEL}`,
      value: PRO_TRIAL_LEAD_VALUE,
      currency: 'USD',
      transaction_id: transactionId, // Stripe session_id — prevents duplicate counting
    });
    // Secondary: fire named GA4 event for audience segmentation and reporting
    window.gtag('event', 'Pro_Trial_Value', {
      value: PRO_TRIAL_LEAD_VALUE,
      currency: 'USD',
      plan: 'pro',
      transaction_id: transactionId,
      event_category: 'conversion',
      event_label: 'pro_trial_lead_value',
    });
    console.log('[Analytics] Pro_Trial_Value fired:', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PRO_TRIAL_LABEL}`,
      value: PRO_TRIAL_LEAD_VALUE,
      currency: 'USD',
      transaction_id: transactionId,
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
  planName: string = 'Pro AI Architect',
  planId: string = 'pro'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: price,
      items: [
        {
          item_id: planId,
          item_name: planName,
          price: price,
          quantity: 1,
        },
      ],
    });
    console.log('[Analytics] begin_checkout:', { price, currency, planName });
  }
};

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
  subscription_status?: 'free' | 'trial' | 'pro' | 'corporate';
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
  trackGoogleAdsSignupConversion,
  trackProTrialValue,
  trackViewPricing,
  trackBeginCheckout,
  trackPurchase,
  trackLessonStart,
  trackLessonComplete,
  trackVideoProgress,
  trackCTAClick,
  setUserProperties,
  trackAudienceEvent,
  trackError,
};

export default analytics;
