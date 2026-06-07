# AI Tutor & Adaptive Learning Engine Specification

**Version:** 2.0 (The "Premium" Agentic Upgrade)  
**Architecture:** LangGraph state-machine with Gemini 1.5 Pro streaming.  
**Supersedes:** AI Tutor v1.0 (stateless RAG responder — preserved as legacy fallback)

---

## 1. Core Philosophy: The Agentic Curriculum

The curriculum is no longer a fixed list of videos. It is a **Knowledge Graph**. The AI Tutor acts as the "Pathfinder," dynamically assembling the syllabus based on an initial diagnostic and continuously adjusting based on the student's lab performance.

The v1 tutor (OpenAI-based stateless RAG) remains operational at `/api/tutor` for backward compatibility. The v2 engine operates at `/api/tutor-v2` and is the default for all students with a `StudentProfile`.

---

## 2. The Intake Diagnostic (The "Genesis State")

Before taking the first lesson, the student interacts with the AI Tutor for a 3-minute conversational diagnostic. The tutor evaluates:

| Dimension | Low | Medium | High |
|-----------|-----|--------|------|
| **Technical Vector** | No-code/Flowise only | Some API/scripting | Python/TypeScript fluent |
| **Industry Context** | General | Domain-specific | Deep vertical expertise |
| **Governance Posture** | Velocity-focused (ship fast) | Balanced | Risk-averse (enterprise/legal) |

**Output:** A JSON `StudentProfile` saved to Firestore at `users/{uid}.studentProfile`, which acts as the system prompt context for all future interactions.

---

## 3. Dynamic DAG Pathing Logic

Based on the `StudentProfile`, the engine highlights nodes on the Knowledge Graph.

**Example A (The Non-Technical Founder):** Bypasses the "Deploying Vector Databases" node entirely. The path routes them directly to "Flowise Prompt Chaining" and emphasizes the "Governance Lab" to ensure their no-code tools are compliant.

**Example B (The Audio/Media Engineer):** The AI Tutor automatically rewrites lesson analogies. When explaining "Model Context Protocol (MCP)," the tutor compares it to routing an audio signal path through a patch bay into an amplifier, ensuring the concept clicks instantly.

**Curriculum Nodes (Knowledge Graph):**

| Node ID | Title | Prerequisites | Tech Level |
|---------|-------|---------------|------------|
| ai-fundamentals | AI Fundamentals & Landscape | None | Low |
| prompt-engineering | Prompt Engineering Mastery | ai-fundamentals | Low |
| flowise-basics | Flowise: Visual Agent Building | prompt-engineering | Low |
| api-integration | API Integration & MCP Protocol | prompt-engineering | Medium |
| vector-databases | Vector Databases & RAG Architecture | api-integration | High |
| langchain-orchestration | LangChain/LangGraph Orchestration | api-integration | High |
| governance-lab-intro | Governance Lab: Trust-Anchor Architecture | flowise-basics OR langchain-orchestration | Low |
| proofguard-attestation | ProofGuard: Attestation & Audit Trails | governance-lab-intro | Medium |
| compliance-automation | Automating IMDA/AICM Compliance | proofguard-attestation | Medium |
| capstone-project | Capstone: Build a Governed Agent | compliance-automation | Medium |

---

## 4. Proactive Coaching Triggers (LangGraph State)

The Tutor runs in the background of the `GovernanceLab.tsx` and triggers interventions based on telemetry:

**The "Frustration" Trigger:** If the student fails a ProofGuard audit 3 times in a row, the Tutor intervenes: *"I see your agent is failing the PII redaction check. Let's look at the Flowise node where you parse the user input. Try adding a Regex filter here."*

**The "Boredom" Trigger:** If the student completes a lab 50% faster than average, the Tutor offers a "Challenge Mode" (e.g., *"Great job. Now, can you make this agent self-correct using a reflection loop?"*).

**State Machine Transitions:**

```
INTAKE → PATH_GENERATION → LESSON_ASSIST ↔ LAB_OBSERVATION
                                              ↓
                                         INTERVENTION / CHALLENGE_MODE
```

---

## 5. Required Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| LLM Engine | Gemini 1.5 Pro | Deep context window retention of student's entire history |
| Orchestration | LangGraph-style state machine | Handle state routing: Intake → Path_Generation → Lab_Observation → Intervention |
| Database | Firestore (extended schema) | `studentProfile`, `competencyGraph`, `tutorConversations` subcollection |
| Streaming | Chunked transfer encoding | Real-time response delivery to frontend |
| Frontend | React + TypeScript | `AITutorV2.tsx`, `GovernanceLab.tsx`, `CompetencyDashboard.tsx` |
| Auth | Firebase Auth + ID tokens | Secure per-student state access |

---

## 6. Firestore Schema Extensions

### users/{uid} (merged fields)

```typescript
{
  // ... existing user fields ...
  studentProfile: {
    technicalVector: 'low' | 'medium' | 'high',
    industryContext: string,
    governancePosture: 'risk-averse' | 'balanced' | 'velocity-focused',
    preferredAnalogies: string[],
    createdAt: ISO8601,
    updatedAt: ISO8601,
  },
  competencyGraph: {
    nodes: CompetencyNode[],
    currentPathIds: string[],
    updatedAt: ISO8601,
  }
}
```

### users/{uid}/tutorConversations (subcollection)

```typescript
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: Firestore.Timestamp,
}
```

---

## 7. API Endpoints

| Endpoint | Function | Auth | Purpose |
|----------|----------|------|---------|
| `/api/tutor` | `tutor` (v1) | Optional | Legacy stateless RAG — backward compatible |
| `/api/tutor-v2` | `tutorV2` | Required (Bearer token) | Adaptive Learning Engine — stateful |

### v2 Request Body

```json
{
  "lessonId": "courses/ai-101/modules/core/lessons/prompt-engineering",
  "question": "How does RAG work?",
  "labTelemetry": { ... },  // Optional: sent from GovernanceLab
  "isIntake": false          // Optional: true during diagnostic
}
```

---

## 8. Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AITutorV2.tsx` | `src/components/AITutorV2.tsx` | Adaptive tutor with state indicator, intake flow, proactive coaching |
| `GovernanceLab.tsx` | `src/components/lab/GovernanceLab.tsx` | Split-pane lab layout (lesson + Flowise + ProofGuard + Mentor) |
| `CompetencyDashboard.tsx` | `src/components/CompetencyDashboard.tsx` | Visual knowledge graph with progress tracking |
| `IntakeDiagnostic.tsx` | `src/pages/IntakeDiagnostic.tsx` | Dedicated page for the Genesis diagnostic |
| `DashboardPage.tsx` | `src/pages/DashboardPage.tsx` | Student learning dashboard with quick actions |
| `GovernanceLabPage.tsx` | `src/pages/GovernanceLabPage.tsx` | Route wrapper that loads lab config |

---

## 9. Backward Compatibility

The v2 engine is designed to coexist with v1:

- `AITutor.tsx` (v1 component) remains untouched and continues to work at `/api/tutor`
- `AITutorV2.tsx` is a NEW component mounted alongside or replacing v1 based on student state
- The `LessonPage.tsx` can conditionally render v2 when a `StudentProfile` exists
- All existing Stripe, HubSpot, and churn recovery functions are unaffected
- The `functions/src/index.ts` exports both `tutor` (v1) and `tutorV2` (v2)

---

## 10. Environment Variables (New)

```bash
# Required for v2 engine
GEMINI_API_KEY=...                    # Google AI Studio API key for Gemini 1.5 Pro

# Optional frontend override
VITE_TUTOR_V2_URL=https://us-central1-ai-integra-course-v2.cloudfunctions.net/tutorV2
```

---

## 11. Conflict Resolution Log

| File | Conflict | Resolution |
|------|----------|------------|
| `functions/src/index.ts` | New export added | Added `tutorV2` export below existing `tutor` export |
| `firebase.json` | New rewrite needed | Added `/api/tutor-v2` rewrite BEFORE `/api/tutor` |
| `src/App.tsx` | New routes needed | Added `/diagnostic`, `/dashboard`, `/lab/:labId` routes |
| `ai_tutor_spec.md` | v1 spec superseded | This file now contains v2 spec; v1 spec preserved in git history |
| `AI_TUTOR_IMPLEMENTATION.md` | Documents v1 only | Preserved as-is; v2 implementation documented separately |
| `prompts/tutor_system.txt` | v1 prompt | Preserved; v2 uses `prompts/tutor_v2_system.txt` |
| `src/components/AITutor.tsx` | v1 component | Preserved untouched; v2 is `AITutorV2.tsx` |

---

## 12. Execution Guard

**Status**: Implementation complete. Ready for deployment.

Deploy sequence:
1. Set `GEMINI_API_KEY` in Firebase Functions secrets: `firebase functions:secrets:set GEMINI_API_KEY`
2. Deploy functions: `firebase deploy --only functions`
3. Deploy hosting: `firebase deploy --only hosting`
4. Verify `/api/tutor-v2` responds to authenticated POST requests
5. Verify `/diagnostic` page loads and intake conversation works
