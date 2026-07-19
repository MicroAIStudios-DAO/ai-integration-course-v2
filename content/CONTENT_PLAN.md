# Content Plan — Zero-Cost Organic Acquisition

Source of truth for the SEO topic-cluster strategy. The acquisition cycle reads
this to pick the next gap. Every article must serve the primary ICP (technical
builders shipping production AI) and pass `scripts/content-quality-gate.mjs`
before it is published.

**Rules (enforced by the quality gate):**
- Genuine expertise from the curriculum — no thin/duplicated/AI-filler doorway pages.
- Each article: a clear TL;DR, real sections, an FAQ block, ≥2 internal links
  (must include `/roadmap` or `/pricing` or `/checkout/start`), and a CTA.
- No unsupported claims (accreditation, income guarantees, fabricated stats,
  "#1/best" superlatives, fake scarcity). The gate fails the build on these.
- Publish path: draft in `content/drafts/` → passes gate → `public/blogs/<slug>.md`
  + entry in `src/content/blogPosts.ts` → sitemap auto-discovers it.

## Cluster 1 — Reliable AI systems (core moat)
| Slug | Status | Primary intent |
|---|---|---|
| ai-integration-architecture-reliable-workflows | ✅ published | "AI integration architecture", "reliable AI workflows" |
| ai-workflow-error-handling-patterns | ✅ published | "AI workflow error handling", "AI retries/fallbacks" |
| production-ai-agent-reliability-checklist | 📋 planned | "production AI agent reliability" |
| ai-systems-engineering-vs-prompt-engineering | 📋 planned | "AI systems engineering" |

## Cluster 2 — RAG & memory
| Slug | Status | Primary intent |
|---|---|---|
| rag-implementation-guide-production | ✅ published | "RAG implementation", "how to build a RAG system" |
| rag-chunking-strategies | 📋 planned | "RAG chunking strategy" |
| persistent-ai-memory-patterns | ✅ published | "persistent AI memory" |

## Cluster 3 — Agents & automation for builders
| Slug | Status | Primary intent |
|---|---|---|
| ai-agents-for-small-business | ✅ published | "AI agents for small business" |
| api-based-ai-automation-guide | 📋 planned | "API-based AI automation" |
| firebase-and-ai-integration | 📋 planned | "Firebase AI integration" |

## Cluster 4 — Decision / ROI (founders & consultants — secondary ICP)
| Slug | Status | Primary intent |
|---|---|---|
| ai-automation-roi | 📋 planned | "AI automation ROI" |
| ai-integration-for-founders | 📋 planned | "AI integration for founders" |
| ai-integration-for-consultants | 📋 planned | "AI integration for consultants" |

## Priority order (what the cycle writes next)
1. api-based-ai-automation-guide
2. production-ai-agent-reliability-checklist
3. ai-automation-roi
4. ai-integration-for-founders
