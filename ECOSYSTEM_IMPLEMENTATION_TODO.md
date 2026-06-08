# AIIntegrationCourse.com Ecosystem Transformation TODO

This document tracks the end-to-end implementation of the "Build-and-Verify" platform architecture, shifting the course from static content to a live, stateful, agentic environment.

## Phase 1: Frontend Architecture & State Management (In Progress)

**Goal:** Wrap the existing application in the Adaptive Learning context and upgrade the core lesson viewing experience.

- [x] Create `AdaptiveLearningContext.tsx` and types.
- [x] Create `AITutorV2.tsx` (LangGraph UI).
- [x] Create `GovernanceLabPremium.tsx` (Split-pane lab UI).
- [x] Create `ProofGuardAuditor.tsx` and `AITutorChat.tsx` lab components.
- [x] **TODO 1.1:** Wrap `src/App.tsx` with `<AdaptiveLearningProvider>`. *(Done: wrapped in index.tsx inside AuthProvider)*
- [x] **TODO 1.2:** Modify `src/pages/LessonPage.tsx` to conditionally render `GovernanceLabPremium` when the lesson has an associated lab configuration. *(Done: renders when `lesson.labId` is set)*

## Phase 2: Backend Infrastructure & Integrations

**Goal:** Establish the backend routes, proxy functions, and database seeds required for the premium labs.

- [x] Create `functions/src/tutorEngine.ts` (LangGraph logic).
- [x] Update `firebase.json` with `/api/tutor-v2` rewrite and CSP headers.
- [x] **TODO 2.1:** Create `functions/src/proofguardProxy.ts` to securely route `/api/proofguard/attest` calls to the MicroAIStudios-DAO backend, injecting the server-side API key. *(Done)*
- [x] **TODO 2.2:** Update `functions/src/index.ts` to export the new `proofguardProxy` function. *(Done)*
- [x] **TODO 2.3:** Write a Node.js seed script (`scripts/seed-labs.js`) to populate the `labs` Firestore collection with the initial "Authentic AI Agent" curriculum data. *(Done: 4 labs seeded)*

## Phase 3: CRM & Marketing Automation (HubSpot)

**Goal:** Connect the student's in-lab performance (Governance Score) to the CRM for targeted upselling and certification tracking.

- [x] **TODO 3.1:** Update `functions/src/hubspotSync.ts` to sync the `cqsScore` (from `labTelemetry`) to a custom property in HubSpot. *(Done: `onAttestationCreated` trigger + 5 custom properties)*
- [x] **TODO 3.2:** Document the HubSpot Workflow configuration required to trigger an email sequence when `Governance Score > 90` (invitation to the advanced track). *(Done: `docs/HUBSPOT_GOVERNANCE_WORKFLOW.md`)*

## Phase 4: Infrastructure Provisioning (Flowise)

**Goal:** Establish the pattern for provisioning isolated Flowise workspaces for students.

- [ ] **TODO 4.1:** Document the cloud architecture (e.g., Railway/Render/GCP) for deploying multi-tenant Flowise instances (`https://flowise.{tenantId}.aiintegrationcourse.com`).
- [ ] **TODO 4.2:** Create a Firebase function hook that triggers on user creation (or premium subscription) to call the infrastructure API and spin up their Flowise container.

## Phase 5: Verification & Certification

**Goal:** Finalize the credentialing system.

- [x] Create `CompetencyDashboard.tsx`.
- [ ] **TODO 5.1:** Update the existing Certification page to pull the blockchain-anchored `attestationHash` from the student's `competencyGraph` data.
- [ ] **TODO 5.2:** Implement Open Badge 2.0 metadata formatting in the certificate generation logic.
