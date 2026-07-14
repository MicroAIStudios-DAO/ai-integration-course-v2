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

// Import and export the tutor function (v1 legacy — stateless RAG)
export { tutor } from './tutor';

// Import and export the AI Tutor v2.0 Adaptive Learning Engine (LangGraph + Gemini)
export { tutorV2 } from './tutorEngine';

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
  onAttestationCreated,
  syncLeadToHubSpot,
} from './hubspotSync';

// ProofGuard AI attestation proxy — securely routes lab audit requests (HTTP endpoint)
export { proofguardAttest } from './proofguardProxy';

// ProofGuard Attestation Bridge — Callable function with competency graph write-back
export { attestAgent } from './proofguardBridge';

// Flowise Multi-Tenant Provisioning — creates isolated workspaces for students
export { provisionFlowiseWorkspace } from './flowiseProvisioning';

// Certification — blockchain-anchored certificates with Open Badge 2.0
export { issueCertificate, verifyCertificate } from './certification';

// Fix 2: Guest Checkout Linker — email normalization + lead_id linking on user creation
export { linkGuestCheckoutOnUserCreate, linkCheckoutByLeadId } from './guestCheckoutLinker';

// Fix 3: Atomic Provisioning — Firestore transaction-based session attachment
export { attachCheckoutSessionAtomicV2, verifyProvisioningState } from './atomicProvisioning';

// Fix 4: Stripe Reconciliation Cron — safety net for webhook failures (runs every 6 hours)
export { reconcileStripePayments } from './cron/reconcileStripe';

// First-party revenue & funnel dashboard (admin-gated) — MRR from Stripe
export { getRevenueDashboardV2 } from './revenueDashboard';

// ─── Phase 3: Advanced Ecosystem Modules ─────────────────────────────────────

// Pinecone Vector DB RAG Lab — semantic search + embedding pipeline
export { pineconeQuery, pineconeIngest, pineconeCompare } from './pineconeLab';

// MCP Protocol Server — Model Context Protocol tools for AI agent integration
export { mcpListTools, mcpCallTool, mcpEndpoint } from './mcpServer';

// Circle.so Community — SSO bridge + space access management
export { circleSSO, circleGetSpaces, circleSyncMember } from './circleCommunity';

// Vanta Compliance & AI Governance — enterprise compliance check engine
export { complianceCheck, complianceReport, complianceFrameworks } from './vantaCompliance';
