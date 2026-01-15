Title: Embedded AI Tutor — Design and Implementation Plan

Overview
- Goal: Add a production-ready AI Tutor embedded at the bottom of each lesson page that answers student questions using the active lesson’s content as ground truth, with low-cost OpenAI models.
- Stack: CRA + Firebase Hosting + Firestore + Cloud Functions (Node 20). Endpoint exposed via Firebase rewrite at `/api/tutor`.
- Keys: Read from `$HOME/Desktop/env1.txt` when present (KEY=VALUE lines). Expect `OPENAI_API_KEY` and optional `OPENAI_TUTOR_MODEL`. Never log or commit secrets.

Server
- Location: `functions/src/tutor.ts` exported as `exports.tutor` via `functions/src/index.ts` using HTTPS v2 `onRequest`.
- Input: JSON `{ lessonId: string, question: string }`.
- Lesson fetch: Load only the active lesson from Firestore path `courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`. Use `md` or `html` field as canonical text.
- Chunking: 600–1,000 chars length with 100 char overlap (default 900/100). Normalize whitespace.
- Embeddings: Use `text-embedding-3-small` for both question and chunk texts. Rank with cosine similarity; select top 4.
- Context cap: Trim concatenated context to ~8k tokens equivalent (≈32k chars) before the chat call.
- Model fallback: Default from `OPENAI_TUTOR_MODEL || 'o3-mini'`, then fall back to `'gpt-4o-mini'`, then `'gpt-3.5-turbo'` if previous fails.
- System prompt: Enforce accuracy, cite lesson sections with the provided section markers, refuse medical/finance/legal advice, and end with 2–3 follow‑up suggestions.
- Cost guard: Estimate tokens by chars/4 and bound the prompt + max output to remain under $0.01/request. If needed, reduce chunk count or truncate sections. Conservative caps for all models.
- Streaming: Use OpenAI streaming; forward deltas to the client as a plain text stream. Do not persist raw API responses.
- Usage logging: Increment a counter only (no text) under Firestore `metrics/tutor` doc (or in‑memory fallback if Firestore unavailable).
- Optional cache: Store/reuse per‑lesson embeddings at `indexes/lesson_<id>_embeddings.json` in Firebase Storage. Cache format includes chunk text + embedding arrays. Do not store in Firestore docs.

Client
- Component: `src/components/AITutor.tsx` with input, Ask button, typing indicator, streaming bubbles, inline citation text (e.g., “Lesson §2.3”), Copy answer, Report issue, and Switch to human support mailto link.
- Premium banner: Show a gentle banner when the lesson is premium and the user lacks access (nudges Stripe subscribe flow).
- Mounting: Already mounted in `src/pages/LessonPage.tsx` under the lesson content.

Data and Rules
- Migration: Keep earlier migration approach with exactly two free lessons: “The AI Revolution: An Introductory Overview” and “Future Trends and Next Frontiers in AI Investments”. Remove bogus lessons named `embeddings`, `intro`, `setup`, `stripe`. Do not create a top‑level `embeddings` lesson.
- Rules: `premium_rules.rules` ensures premium lesson reads require an active subscription claim; free lessons readable by anyone.
- Slugs: Normalize slugs and dedupe duplicates. Prefer first occurrence then delete others.

QA
- Type‑strict build and basic unit tests (`tests/tutor.spec.ts`) mocking OpenAI calls and verifying chunking/cosine ranking + cost guard decisions.
- Ensure Stripe checkout/webhooks finish the subscription claim path that powers premium gating (no raw secrets in repo).
- Normalize routes/slugs, dedupe lesson listings, show “Free” badge only on the two free lessons, and add footer © 2025 MicroAI Studios™ — All rights reserved.

Video Assist
- Tool: `tools/scan_videos.py` (already present). Scans `$HOME` for common video formats and fuzzy‑matches to lesson titles (threshold ≥ 0.10). Writes `tools/suggested_lesson_video_matches.json`. Does not move large files.

Deliverables (Plan Phase)
- Server: `functions/src/tutor.ts`, `functions/src/index.ts`, `functions/tsconfig.json`, `functions/package.json` updates.
- Client: `src/components/AITutor.tsx` enhancements only.
- Prompt: `prompts/tutor_system.txt`.
- Embedding helper: `scripts/embed_lesson.ts` (optional admin precompute).
- Rules: `premium_rules.rules` patch.
- Tests: `tests/tutor.spec.ts` with mocked OpenAI.
- Wiring: Lesson template integration confirmed.
- Docs: README tutor section + dry‑run transcript.

Execution Guard
- Do not deploy or run migrations yet. Wait for exact input: CONFIRM LAUNCH.

