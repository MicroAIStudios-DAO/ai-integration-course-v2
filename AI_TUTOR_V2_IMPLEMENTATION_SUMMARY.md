# AI Tutor v2.0 — Adaptive Learning Engine: Implementation Summary

**Commit:** `0cff635` on `main`  
**Files Changed:** 17 (2,872 insertions, 53 deletions)  
**Status:** Committed locally, ready for push to `MicroAIStudios-DAO/ai-integration-course-v2`

---

## Architecture Overview

The implementation transforms the AI Tutor from a stateless RAG responder into a **stateful agentic engine** that knows each student personally and adapts in real-time. The v1 tutor is preserved untouched as a legacy fallback.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT JOURNEY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /diagnostic ──→ INTAKE ──→ PATH_GENERATION ──→ /dashboard           │
│                                                       │               │
│                                                       ▼               │
│  /lab/:labId ──→ LAB_OBSERVATION ──→ INTERVENTION / CHALLENGE_MODE   │
│       │                                                               │
│       ├── Flowise Workspace (iframe)                                 │
│       ├── ProofGuard Auditor (API polling)                           │
│       └── AI Mentor (AITutorV2 in lab mode)                          │
│                                                                       │
│  /courses/.../lessons/:id ──→ LESSON_ASSIST (Socratic + adaptive)    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files Created (New)

| File | Purpose |
|------|---------|
| `functions/src/tutorEngine.ts` | The complete v2 backend: LangGraph state machine, Gemini 1.5 Pro integration, intake processing, path generation, proactive coaching, competency tracking |
| `prompts/tutor_v2_system.txt` | Socratic mentor system prompt with industry-adaptive rules |
| `src/types/adaptiveLearning.ts` | Shared TypeScript types + static curriculum Knowledge Graph definition |
| `src/context/AdaptiveLearningContext.tsx` | React context provider managing StudentProfile, CompetencyGraph, and LabTelemetry state |
| `src/components/AITutorV2.tsx` | Adaptive tutor component with state indicator, intake flow, streaming, proactive interventions |
| `src/components/lab/GovernanceLab.tsx` | Split-pane lab layout: lesson content (left) + tabbed workspace (right: Flowise / ProofGuard / Mentor) |
| `src/components/CompetencyDashboard.tsx` | Visual knowledge graph showing mastered/available/locked nodes with progress bars |
| `src/pages/IntakeDiagnostic.tsx` | Dedicated page for the 3-minute Genesis diagnostic |
| `src/pages/DashboardPage.tsx` | Student learning dashboard with quick actions and path overview |
| `src/pages/GovernanceLabPage.tsx` | Route wrapper that loads lab config from Firestore and renders GovernanceLab |

---

## Files Modified (Conflict Resolution)

| File | Change | Conflict Risk |
|------|--------|---------------|
| `functions/src/index.ts` | Added `export { tutorV2 } from './tutorEngine'` below existing `tutor` export | None — additive only |
| `firebase.json` | Added `/api/tutor-v2` rewrite before `/api/tutor`; updated CSP for Flowise/ProofGuard/Gemini | Low — order matters, v1 route unchanged |
| `firestore.rules` | Added `tutorConversations` subcollection rules under users; added `labs` collection | None — new paths only |
| `src/App.tsx` | Added imports + routes for `/diagnostic`, `/dashboard`, `/lab/:labId` | None — additive only |
| `.env.example` | Appended v2 environment variables section | None — additive only |
| `ai_tutor_spec.md` | Replaced with v2.0 spec (v1 preserved in git history) | Intentional — spec superseded |

---

## State Machine Logic

```
┌──────────┐     No StudentProfile     ┌────────────────┐
│  REQUEST  │ ─────────────────────────→ │     INTAKE      │
└──────────┘                            └────────────────┘
      │                                         │
      │  Has StudentProfile                     │ Profile JSON detected
      │                                         ▼
      │                                 ┌────────────────┐
      │  No CompetencyGraph ───────────→│ PATH_GENERATION │
      │                                 └────────────────┘
      │                                         │
      │  Has path + no lab telemetry            │
      ▼                                         ▼
┌──────────────┐                        ┌────────────────┐
│ LESSON_ASSIST │                        │ Save to Firestore│
└──────────────┘                        └────────────────┘
      │
      │  Lab telemetry present
      ▼
┌──────────────────┐
│  LAB_OBSERVATION  │
└──────────────────┘
      │                          │
      │ 3+ failures              │ 50%+ faster than avg
      ▼                          ▼
┌──────────────┐         ┌────────────────┐
│ INTERVENTION  │         │ CHALLENGE_MODE  │
└──────────────┘         └────────────────┘
```

---

## Firestore Schema Extensions

### `users/{uid}` (new fields merged)

```json
{
  "studentProfile": {
    "technicalVector": "medium",
    "industryContext": "Audio Production",
    "governancePosture": "velocity-focused",
    "preferredAnalogies": ["audio engineering", "signal routing"],
    "createdAt": "2026-06-07T...",
    "updatedAt": "2026-06-07T..."
  },
  "competencyGraph": {
    "nodes": [
      { "nodeId": "ai-fundamentals", "title": "...", "status": "mastered", "score": 100, "attempts": 2, "lastAttemptAt": "..." },
      { "nodeId": "prompt-engineering", "title": "...", "status": "available", "score": 0, "attempts": 0, "lastAttemptAt": null }
    ],
    "currentPathIds": ["ai-fundamentals", "prompt-engineering", "flowise-basics", "governance-lab-intro", "..."],
    "updatedAt": "2026-06-07T..."
  }
}
```

### `users/{uid}/tutorConversations` (new subcollection)

```json
{ "role": "user", "content": "How does RAG work?", "timestamp": "..." }
{ "role": "assistant", "content": "Think of RAG like...", "timestamp": "..." }
```

### `labs/{labId}` (new collection)

```json
{
  "labId": "governance-lab-intro",
  "lessonId": "courses/ai-101/modules/governance/lessons/trust-anchor",
  "title": "The Trust-Anchor Architecture",
  "description": "Deploy a basic agent and hook it into ProofGuard for tamper-proof audit trails.",
  "flowiseUrl": "https://flowise.aiintegrationcourse.com",
  "proofguardApiUrl": "https://proofguard.aiintegrationcourse.com/api",
  "premium": true
}
```

---

## Deployment Steps

```bash
# 1. Set the Gemini API key in Firebase Functions secrets
firebase functions:secrets:set GEMINI_API_KEY

# 2. Push to GitHub (requires auth)
git push origin main

# 3. Deploy functions
firebase deploy --only functions

# 4. Deploy Firestore rules
firebase deploy --only firestore:rules

# 5. Deploy hosting (includes CSP updates)
firebase deploy --only hosting

# 6. Seed the labs collection (one-time)
# Use the Firebase console or a script to create lab documents

# 7. Verify
curl -X POST https://us-central1-ai-integra-course-v2.cloudfunctions.net/tutorV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -d '{"question": "Hello", "isIntake": true}'
```

---

## What This Enables (The Flywheel)

1. **Student enrolls** → hits `/diagnostic` → 3-minute chat builds their `StudentProfile`
2. **Personalized path generated** → Knowledge Graph nodes unlocked based on profile
3. **Lessons adapt** → AI Mentor uses industry analogies (audio engineer gets "patch bay" metaphors)
4. **Labs verify** → GovernanceLab split-pane: build in Flowise, verify with ProofGuard, get coached by Mentor
5. **Proactive coaching** → Frustration trigger (3 failures) or Boredom trigger (50% faster) auto-intervenes
6. **Competency tracked** → Nodes auto-unlock as scores hit 80%+
7. **Certification earned** → ProofGuard-attested, blockchain-verifiable credential
8. **HubSpot segmented** → Governance Score feeds CRM for advanced track marketing

---

## Backward Compatibility Guarantee

| Component | v1 Status | v2 Status |
|-----------|-----------|-----------|
| `/api/tutor` endpoint | Unchanged, operational | New endpoint at `/api/tutor-v2` |
| `AITutor.tsx` component | Untouched | New `AITutorV2.tsx` alongside |
| `prompts/tutor_system.txt` | Preserved | New `prompts/tutor_v2_system.txt` |
| Existing routes | All preserved | 3 new routes added |
| Firestore schema | No fields removed | New fields merged via `{ merge: true }` |
| Stripe/HubSpot/Churn functions | Completely unaffected | No changes |

---

## Next Steps (Post-Deployment)

1. **Wrap `App.tsx` with `<AdaptiveLearningProvider>`** — needs to be inside `AuthProvider`
2. **Conditionally render `AITutorV2` in `LessonPage.tsx`** when `StudentProfile` exists
3. **Seed `labs` collection** with initial lab configurations for the Authentic AI Agent track
4. **Deploy FlowiseAI** to `flowise.aiintegrationcourse.com` (Cloud Run or Railway)
5. **Connect ProofGuard API** at `proofguard.aiintegrationcourse.com`
6. **Add HubSpot property** `governanceScore` and trigger workflow on score > 80
