# Engineering Curriculum Build Plan (Option B Migration Asset)

Owner decision (Aug 2026): **Option A shipped now** — the site sells the real
applied curriculum. This document is the build plan for the engineering
modules so the brand can deliberately migrate to Option B ("Systems-First AI
Engineering School") once the content exists. The four retired homepage
modules become the internal build targets — they were good product design,
just unshipped.

## Assets that already exist (build on these, don't restart)

| Asset | Where | Reuse as |
|---|---|---|
| Founders Lesson: Content Architect | M1 (public preview) | E1 capstone seed |
| Founders Lesson: Informed Architect (search-grounded agents) | M2 (public preview) | E2 core lessons |
| Founders Lesson: Persistent Memory (Vector DB Integration) | M3 | E3 core lessons |
| Founders Lesson: Governed Agents (Guardrails & Output Control) | M4 | E4 core lessons |
| Founders Lesson: Deployment Pipeline (Script → Production) | M5 | E1/E4 lessons |
| Forge sandbox + Pinecone/MCP/Governance lab routes | app | E1–E4 hands-on environments |
| Technical blog posts (8) | /blogs | lesson source material (see mapping) |
| Module projects (Helpdesk, Deal Underwriter, Strategy Brief, Creative Brief) | M3–M7 | applied electives under Option B |

## Target: four engineering modules (the old homepage promise, made real)

### E1 — Foundation & Serverless Environments (~6 lessons + 1 sandbox build)
Sandbox workspace setup, API key/config hygiene, rate-limit defenses,
first programmatic workflow script, deploy to the Forge.
- Source material: Deployment Pipeline founders lesson; blog
  `api-based-ai-automation-guide`; existing M1 technical content.
- Build: "first deployed workflow" sandbox project (exists in spirit as the
  Content Architect Day-1 win — extend it).

### E2 — The Informed Architect & Agentic Decoders (~6 lessons + 2 builds)
Search-grounded agents (Serper.dev/search APIs), hallucination controls,
structured outputs, tool contracts, multi-turn flows.
- Source material: Informed Architect founders lesson (already public);
  blogs `api-based-ai-automation-guide`, `ai-workflow-error-handling-patterns`.
- Builds: search-grounded research agent; validated tool-calling workflow.

### E3 — Persistent Memory Layers (~8 lessons + 1 system deploy)
Embeddings, chunking, vector stores (Pinecone / Firestore embeddings),
retrieval quality, memory patterns (buffer/semantic/entity/episodic).
- Source material: Persistent Memory founders lesson; Pinecone lab; blogs
  `rag-implementation-guide-production`, `persistent-ai-memory-patterns`.
- Build: RAG system over the student's own documents, deployed via the Forge.

### E4 — Autonomous Workflow Orchestration (~6 lessons + 1 production deploy)
Multi-agent orchestration, supervisor patterns, fallback schemas,
conditional routing, monitoring/diagnostics, guardrails.
- Source material: Governed Agents founders lesson; Governance/MCP labs;
  blogs `ai-integration-architecture-reliable-workflows`,
  `ai-workflow-error-handling-patterns`, `persistent-ai-memory-patterns`.
- Build: production multi-agent workflow with fallbacks + monitoring.

## Sequencing & effort (rough)

1. **E2 first** (smallest gap — Informed Architect + two strong blog posts
   cover most of it): ~2–3 weeks of content work.
2. **E3 next** (Pinecone lab + RAG blog are strong seeds): ~3 weeks.
3. **E1** (mostly assembly of existing setup/deploy material): ~2 weeks.
4. **E4 last** (most net-new content): ~4 weeks.
Video: decide per the video-coverage audit whether engineering modules ship
with video or are deliberately text+sandbox-first (cheaper, faster, honest).

## Migration triggers (when to flip to Option B)

Flip positioning only when ALL of:
- E1–E3 live end-to-end (E4 may be "Beta" — a labeled beta is honest);
- ≥1 real cohort of students has completed an E-module (social-proof file
  gets its first permissioned technical testimonials);
- funnel data shows the technical segment converting (gate/upgrade events by
  source now exist to measure this).

## What flips at migration (small, because Option A kept the door open)

- Homepage: curriculum section swaps to E1–E4 as the core + "Applied
  Industry Tracks" (M4–M7) as electives; hero audience line returns to
  builders-first. The retired copy is preserved in git history
  (`ff285bd^` NewLandingPage.tsx) and in the old `page-copy.mjs` blocks.
- /pricing & /start-trial: tone shifts up-market; keep the $1 trial.
- route-meta.mjs / page-copy.mjs mirrors + verify-seo floors: update in the
  same PR (the build fails if mirrors drift, by design).
- Lesson slugs/renumbering (deferred Phase 4.5 item): do it as part of the
  E-module restructure so URLs only change once.
