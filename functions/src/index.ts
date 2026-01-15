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
export { createCheckoutSession, stripeWebhook } from './stripe';

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
