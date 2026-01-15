Title: Tutor Dry-Run Transcript (No Secrets)

Request:
- lessonId: courses/ai101/modules/intro/lessons/ai-revolution
- question: "How does narrow AI differ from general AI?"

Server steps (simulated):
- Loaded lesson content (md) — 18,432 chars
- Chunked at 900/100 → 22 chunks
- Embedded question+chunks (text-embedding-3-small)
- Cosine-ranked top 4: sections §1–§4
- Built messages with context cap (~8k tokens)
- Model selected: o3-mini (fallbacks available)
- Streaming enabled

Stream excerpt:
assistant: Narrow AI focuses on specific tasks and domains, optimized for bounded objectives (Lesson §1). By contrast, general AI implies broad, transferable competence across tasks, contexts, and goals without bespoke training (Lesson §3). In practice today, nearly all deployed systems are narrow, with general AI remaining a research target (Lesson §2).

Next explore: 1) Typical failure modes of narrow AI. 2) Why transfer learning doesn’t equal general reasoning. 3) What milestones would signal progress toward general AI.

Notes:
- No raw API payloads persisted. No secrets logged.
