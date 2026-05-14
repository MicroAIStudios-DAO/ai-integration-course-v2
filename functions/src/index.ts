/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions/v2";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// Set global options for all v2 functions
setGlobalOptions({
  maxInstances: 10,
  serviceAccount: "firebase-app-hosting-compute@ai-integra-course-v2.iam.gserviceaccount.com",
});

// Import and export the tutor function
export { tutor } from './tutor';

// Import and export the reCAPTCHA verification function
export { verifyRecaptcha } from './recaptcha';

// Import and export Stripe functions
export {
  onUserCreateV2,
  createCheckoutSessionV2,
  getCheckoutSessionSummaryV2,
  attachCheckoutSessionToUserV2,
  stripeWebhookV2,
  validateIdMappingV2,
  backfillStripeCustomersV2,
} from './stripe';

// Import and export churn recovery functions
export {
  identifyChurnRiskUsersV2,
  processChurnRecoveryEmailV2,
  trackPricingPageViewV2,
  trackCheckoutStartV2,
  trackLessonStartV2,
  manualChurnRecoveryRunV2,
} from './churn';

// Import and export admin lesson functions
export { addLessonToFirestoreV2, listCoursesAndModulesV2 } from './adminLessons';

// Founding member access + feedback
export { claimBetaTesterV2, redeemFoundingCodeV2, submitFeedbackV2 } from './founding';

// Import and export Beta Testing functions
export { userJotToGithub, githubToUserJot, betaTesterSync } from './beta-testing';

// Lead magnet capture
export { submitLeadMagnetV2 } from './leadMagnet';

// Spec §14: Billing portal — Stripe Customer Portal session creation
export { createBillingPortalSession } from './billingPortal';

// Email queue delivery
export { processEmailQueueV2, drainPendingEmailQueueV2 } from './email';

// Lifecycle email queueing
export { queueLifecycleEmailCadenceV2 } from './emailLifecycle';

// HubSpot CRM sync — mirrors leads and subscription events to HubSpot contacts
export {
  onLeadCreated,
  onLeadUpdated,
  onUserSubscriptionUpdated,
  syncLeadToHubSpot,
} from './hubspotSync';

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
