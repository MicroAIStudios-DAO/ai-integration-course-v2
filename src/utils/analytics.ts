/**
 * GA4 Analytics Utility for AI Integration Course
 * 
 * Events tracked per Gemini Growth Audit:
 * - sign_up: User registration (method: Google/Email)
 * - view_item: Pricing page load (currency, value)
 * - begin_checkout: Click "Upgrade" (price, currency, items)
 * - purchase: Stripe webhook / Success page (transaction_id, value, tax)
 * - lesson_start: Video play (lesson_id, module)
 * - lesson_complete: Button click / Video end (lesson_id)
 * 
 * Audience Segments:
 * - Window Shoppers: Viewed Pricing > 0 AND Checkout = 0
 * - Cart Abandoners: Checkout > 0 AND Purchase = 0
 * - Zombie Users: Purchase > 0 AND Lesson Start = 0 (30d)
 */

// GA4 Measurement ID
const GA4_MEASUREMENT_ID = 'G-15SDDF1S5S';

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Initialize GA4 tracking
 * Call this once in App.tsx or index.tsx
 */
export const initGA4 = (): void => {
  // Check if already initialized
  if (typeof window !== 'undefined' && !window.gtag) {
    // Add gtag script
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
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
    });

    console.log('[Analytics] GA4 initialized:', GA4_MEASUREMENT_ID);
  }
};

// Legacy aliases for backward compatibility
export const initGA = initGA4;
export const logPageView = () => trackPageView(window.location.pathname);
export const logEvent = (category: string, action: string, label?: string) => {
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
 * Track pricing page view (view_item event)
 * Also triggers Firebase function for churn tracking
 * Trigger: Pricing Page Load
 */
export const trackViewPricing = (
  currency: string = 'USD',
  value: number = 49,
  itemName: string = 'Pro Plan'
): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: currency,
      value: value,
      items: [
        {
          item_id: 'pro_monthly',
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
 * Trigger: Click "Upgrade" or "Start Building Now"
 */
export const trackBeginCheckout = (
  price: number,
  currency: string = 'USD',
  planName: string = 'Pro Plan',
  planId: string = 'pro_monthly'
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
 * Track successful purchase
 * Trigger: Stripe Webhook / Payment Success Page
 * NOTE: Prefer server-side tracking for accuracy
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  tax: number = 0,
  planName: string = 'Pro Plan',
  planId: string = 'pro_monthly'
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
  trackPageView,
  trackCustomEvent,
  trackSignUp,
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
