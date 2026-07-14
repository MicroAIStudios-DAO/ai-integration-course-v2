# Optional Integrations — Pinecone & Circle.so

**TL;DR:** These five keys are **not required** to build, deploy, or run the site. The four modules that use them (Pinecone RAG lab, Circle community) are declared with empty defaults (`defineString(name, { default: '' })`) and guard at runtime, so they deploy fine and simply return `"…is not configured"` if invoked. The revenue funnel does not touch them. Add the keys only if you want those specific features live.

> ⚠️ **Constraint note (important):** **Circle.so is a paid SaaS**, and its API token + SSO require a paid Circle plan. Activating it conflicts with the “no new SaaS subscriptions” rule **unless you already pay for Circle**. Recommendation: skip Circle unless you already have it. **Pinecone has a free “Starter” tier** (no cost), but your AI tutor already does RAG via Firestore embeddings, so Pinecone is optional/redundant for the funnel. Neither is on the path to $10k MRR.

---

## Current behavior without the keys (verified)

| Module | Param(s) | Without key |
|---|---|---|
| `pineconeLab.ts` | `PINECONE_API_KEY`, `PINECONE_INDEX_HOST` | deploys; `pineconeQuery/Ingest/Compare` throw `failed-precondition: "Pinecone is not configured…"` |
| `circleCommunity.ts` | `CIRCLE_API_TOKEN`, `CIRCLE_COMMUNITY_ID`, `CIRCLE_SSO_KEY` | deploys; `circleSSO/GetSpaces` throw `"Circle.so is not configured…"`; `circleSyncMember` skips silently |

So the build “passes without them” today. No action needed for deploys.

---

## How to obtain each key

### Pinecone (free Starter tier is fine)

1. **PINECONE_API_KEY**
   - Go to https://app.pinecone.io and sign up (choose the free **Starter** plan).
   - Left sidebar → **API Keys** → **Create API key** (or copy the default) → copy the value (starts with a long token).

2. **PINECONE_INDEX_HOST**
   - In the console → **Indexes** → **Create index**.
   - Name it (e.g. `course-content`). **Dimensions must match your embedding model** — the tutor uses OpenAI `text-embedding-3-small` = **1536**. Metric: **cosine**. Cloud/region: any free-tier region.
   - After it’s created, open the index → copy its **Host** (looks like `https://course-content-abc123.svc.us-east-1-aws.pinecone.io`). That full URL is `PINECONE_INDEX_HOST`.

### Circle.so (⚠️ requires a paid Circle plan)

1. **CIRCLE_API_TOKEN**
   - In Circle admin → **Settings → Developers → API access → Create token** (Headless/Admin API token). Copy it.

2. **CIRCLE_COMMUNITY_ID**
   - Call Circle’s API with your token: `GET https://app.circle.so/api/v1/me` (or check **Settings → Community** in the admin). The response includes your `community_id`. (Or it’s visible in some admin URLs.)

3. **CIRCLE_SSO_KEY**
   - Circle admin → **Settings → Single Sign-On (SSO)** → enable SSO and copy the **SSO secret/key**. (SSO is only on higher Circle tiers.)

---

## How to set them (two paths)

The modules currently read these via `defineString`. Because they’re sensitive, the secure, CI-compatible way to store them is **Firebase Secret Manager**, which needs a one-line code change per module (`defineString` → `defineSecret`).

### Recommended: ask me to wire them as secrets (one commit)
When you have the values, tell me and I’ll flip those four modules to `defineSecret` in a single commit. Then you run:
```bash
firebase functions:secrets:set PINECONE_API_KEY      # paste value when prompted
firebase functions:secrets:set PINECONE_INDEX_HOST
firebase functions:secrets:set CIRCLE_API_TOKEN
firebase functions:secrets:set CIRCLE_COMMUNITY_ID
firebase functions:secrets:set CIRCLE_SSO_KEY
firebase deploy --only functions --project ai-integra-course-v2
```
Your CI service account already reads Secret Manager, so CI deploys pick them up automatically. **Setting an empty/placeholder secret still deploys fine**, so you can create them before you have real values and update later.

### Quick local-only path (no code change, not used by CI)
Create `functions/.env.ai-integra-course-v2` (already git-ignored — never commit it):
```
PINECONE_API_KEY=your-value
PINECONE_INDEX_HOST=https://...pinecone.io
CIRCLE_API_TOKEN=your-value
CIRCLE_COMMUNITY_ID=your-value
CIRCLE_SSO_KEY=your-value
```
Then `firebase deploy --only functions`. Note: a local `.env` does **not** reach GitHub Actions, so CI-deployed functions would still see empty values — which is why the Secret Manager path above is recommended if you deploy via CI.

---

## Verify after setting

```bash
# List secret names (no values printed)
gcloud secrets list --project ai-integra-course-v2 | grep -E 'PINECONE|CIRCLE'
# Confirm functions redeployed
firebase functions:list --project ai-integra-course-v2 | grep -E 'pinecone|circle'
```
Then load `/lab/pinecone` (signed in) and run a query — it should return results instead of “not configured.”
