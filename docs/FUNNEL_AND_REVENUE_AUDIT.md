# Funnel & Revenue Audit — Path to $10k MRR

**Author:** Fable (autonomous engineering session)
**Branch:** `fable/10000-mrr-engine`
**Baseline commit:** production `main` @ `5e84ab3` (tagged `checkpoint/pre-fable-main-67c7b52` at session start `67c7b52`)
**Date:** 2026-07-13
**Status legend:** ✅ fixed & committed · 🔧 in progress · 📋 planned · ⛔ blocked on owner (see `OWNER_ACTIONS.md`)

> Ground rule for this document: only **actual, observed** data is recorded as fact.
> Numbers I could not read directly (live Stripe gross MRR, GA4 sessions) are marked
> `[owner-verify]` rather than estimated. No projected or illustrative revenue is presented as achieved.

---

## 0. Revenue baseline (observed 2026-07-13)

Source: first-party Firestore aggregation counts (read via authenticated `runAggregationQuery`) + deployed-function inventory. Stripe live gross MRR is `[owner-verify]` — the live `STRIPE_SECRET` read was correctly blocked by the environment guard; see `OWNER_ACTIONS.md`.

| Metric | Observed value | Notes |
|---|---|---|
| Users total | **89** | `users` collection |
| Active paid subscriptions | **2** | `subscriptionStatus == active`, both `premium=true`, both `billingInterval=month` |
| Trialing now | **0** | `subscriptionStatus == trialing` |
| Founding members | **0** | `foundingMember == true` |
| Leads captured | **4** | `leads` collection — **very low; lead capture is under-firing** |
| Checkout sessions (all-time) | **69** | 49 expired, 11 active, 5 open, 2 cancelled, 1 trialing, 1 past_due |
| Checkout abandonment | **~71%** | 49 expired / 69 created |
| Email queue items | **254** | 119 sent, 97 superseded, 38 error, remainder pending |
| **Estimated gross MRR** | **~$59.98/mo** `[owner-verify]` | 2 × monthly plan; exact amount pending Stripe confirmation |

**Distance to target:** $10,000 MRR ≈ **334 monthly subscribers** at $29.99 (fewer if weighted toward $239.88 annual). Current observed ≈ 2. This is an early-stage organic-growth climb; this audit's job is to make the conversion machine *correct and instrumented* so each of those 334 is winnable without paid acquisition.

---

## 1. CRITICAL findings

### C-1 — Production `main` did not compile (Cloud Functions) ✅ FIXED
- **Funnel stage:** entire backend (checkout, webhook, email, tutor)
- **Evidence:** `functions/ && npm run build` failed with 4 `tsc` errors (`TS2305` phantom `pineconeLabStatus` export, `TS6133`/`TS6196` unused symbols, `TS18047` closure narrowing in `tutorEngine.ts:760`). GitHub Actions "Deploy to Production" run `29212766227` (2026-07-12) failed at the "Build Firebase Functions" step with the same errors. An uncommitted local WIP had **emptied the `firebase.json` predeploy build hook** — evidence someone was forcing deploys past the failing build.
- **Revenue impact:** Highest. Cloud Functions could not deploy through the normal gate; the Stripe webhook, checkout-session creation, and email workers risked running stale artifacts. Any new function fix was un-shippable.
- **Fix:** Commit `d51382b` — corrected the export to the real `pineconeCompare` (which the frontend actually calls), removed dead symbols, hoisted the `labTelemetry.labId` deref out of the `.find()` closure. Build gate left **intact** (the predeploy-emptying WIP was quarantined on branch `fable/pre-existing-wip`, not merged).
- **Verification:** `functions` `tsc` exit 0; frontend `vite build` exit 0; `vitest` 8/8 pass.

### C-2 — MCP `get_lesson_content` leaked premium content to anyone ✅ FIXED
- **Funnel stage:** product moat / premium gating
- **Evidence:** `functions/src/mcpServer.ts` `executeGetLessonContent` returned `markdownContent || content` for **any** lesson, premium included, to **any** caller — reachable unauthenticated through the public `/api/mcp` HTTP endpoint (`mcpEndpoint`). The prior security commit `4d46ba6` (cherry-picked here as `5a92a04`) fixed IDOR on the PII tools but did **not** touch lesson content. Same function also issued an invalid `collectionGroup().where('__name__','==', bareId)` query that throws at runtime.
- **Revenue impact:** High — the paid curriculum is the core value; free extraction destroys willingness to pay.
- **Fix:** Commit `158b8db` — extracted a shared `functions/src/accessControl.ts` (single source of gating truth, moved verbatim from `tutor.ts` so tutor + MCP agree). `get_lesson_content` now returns full body only for free lessons or entitled callers (active sub / valid trial / founding / admin); everyone else gets metadata + a trial upgrade notice. Runtime query bug fixed.
- **Verification:** builds green, tests pass. Live behavior pending deploy (see `OWNER_ACTIONS.md` A-1).

### C-3 — Orphaned `landing.html` advertised the wrong price ($49/mo) in production ✅ FIXED
- **Funnel stage:** discovery / pricing comprehension
- **Evidence:** `https://aiintegrationcourse.com/landing.html` returned HTTP 200 and stated “Pro — $49/month” (3 places) against the real $29.99/mo offer. Zero inbound references anywhere in the repo — an unmaintained duplicate funnel. Title: “Start Your Free AI Curriculum”.
- **Revenue impact:** High — misleading pricing erodes trust and mis-sets anchor; a stray indexed page competes with the real funnel.
- **Fix:** Commit `8a943a8` — deleted `public/landing.html`; added a `301` redirect `/landing.html → /` in `firebase.json` to preserve any external/indexed links.
- **Verification:** redirect config present; goes live on next hosting deploy.

---

## 2. HIGH findings

### H-1 — Offer inconsistency: annual price shown as $239 / $239.88 / $239.00 ✅ FIXED
- **Evidence:** server `PLAN_CONFIG` (billing authority) = `$239.88`; client `pricing.ts`, checkout copy, emails = `$239`; `index.html` schema.org = `$239.00`.
- **Revenue impact:** Medium-High — 88-cent under-disclosure (compliance risk) and an inexact “save $120” claim.
- **Fix:** Commit `0d01255` — standardized every **display** surface on the server-authoritative `$239.88` (pricing.ts, PlanSelectorPage, CheckoutStartPage, analytics `potential_value`, 4 email sites, `hubspotSync` MRR cents 1992→1999, schema.org). Now `$359.88 − $239.88 = $120.00` exactly. Internal identifier `annual_usd239` intentionally unchanged.
- **Verify:** live Stripe annual Price `unit_amount` should read `23988` — `[owner-verify]`, `OWNER_ACTIONS.md` A-2.

### H-2 — False “14-day trial” claim on the homepage ✅ FIXED
- **Evidence:** `NewLandingPage.tsx:477` — “Risk-free academic trial for 14-days”. The actual offer is a **$1 seven-day** trial; “14-day” is the separate *Build Guarantee*. Server `trial_period_days: 7`.
- **Revenue impact:** Medium-High — sets a false expectation that surfaces as a chargeback/complaint when billing occurs on day 8.
- **Fix:** Commit `8a943a8` — copy now reads “$1 seven-day trial — backed by our 14-Day Build Guarantee.”

### H-3 — Lead capture is severely under-firing (4 leads vs 89 users, 69 checkouts) 📋 PLANNED
- **Evidence:** `leads` collection holds only 4 documents despite 69 checkout sessions and 89 users. `createCheckoutSessionV2` only upserts a lead when `email` is present pre-redirect; guest sessions without a captured email never create a lead, so abandonment recovery can’t reach them.
- **Revenue impact:** High — with ~71% checkout abandonment and no email on file, the abandonment email sequence (which exists and works) has almost nobody to send to. This is the single biggest near-term recoverable-revenue lever.
- **Planned fix (Phase 2):** ensure email is captured *before* Stripe redirect on every path (CheckoutStartPage is the intended gate — verify it’s the only entry to checkout), and backfill lead docs from `checkout_sessions` that carry a Stripe customer email.

### H-4 — Phase-3 “ecosystem” functions are in the repo but NOT deployed 📋 DECISION
- **Evidence:** deployed functions = 44; repo exports = 56. Not deployed: `pineconeQuery/Ingest/Compare`, `mcpListTools/CallTool/Endpoint`, `circleSSO/GetSpaces/SyncMember`, `complianceCheck/Report/Frameworks`. The frontend ships routes (`/lab/pinecone`, `/lab/mcp`, `/community`, `/lab/compliance`) that call these; the current **production bundle does not even contain `/lab/pinecone`** (older deploy), so they’re dark on both ends. They also require **unconfigured** third-party keys (`PINECONE_API_KEY`, `CIRCLE_API_TOKEN`, etc.).
- **Revenue impact:** Low direct; **risk** if surfaced half-working. These are not on the acquisition→checkout→retention path.
- **Decision:** Keep code (don’t delete working functionality) but treat as **out of scope for the $10k-MRR core funnel**. Do not deploy or link until owner supplies keys and confirms they’re part of the paid offer. Recorded in `OWNER_ACTIONS.md` as optional. Focus stays on the money path.

---

## 3. MEDIUM / LOW findings

- **M-1 — Email queue: 38 errors.** 36 are “missing to, subject, or body” (malformed enqueues — a producer-side bug worth tracing) and 2 are RFC-2606 reserved test addresses. Delivery transport itself (Office365 SMTP via nodemailer, `email.ts`) **works** (119 sent). 📋 trace the malformed producers.
- **M-2 — `pineconeCompare` trusts a client-supplied embedding vector** instead of embedding `queryText` server-side; `queryText` is accepted then ignored. Latent correctness/trust gap in a lab feature. 📋 (low priority; feature is undeployed).
- **M-3 — Stale analytics comment “(no trials exist)”** ✅ FIXED (`e373c00`) — corrected to state the trial policy: purchase conversion fires only on verified paid subs; trial start fires `trial_start`, never `purchase`.
- **M-4 — README pointed at the obsolete Gnoscenti repo** ✅ FIXED (`e373c00`).
- **L-1 — `X-Frame-Options: DENY` + CSP `frame-src` for Circle/Flowise** may conflict for embedded community; revisit only if H-4 features are activated.
- **L-2 — Vite warns `firebase.ts` is both statically and dynamically imported** (ExitIntentModal) — the dynamic import can’t split the chunk. Minor perf; 📋 during Phase 2 friction pass.

---

## 4. What is confirmed WORKING (do not “fix”)

- 44 Cloud Functions deployed and healthy, including `createCheckoutSessionV2`, `stripeWebhookV2`, `attachCheckoutSessionAtomicV2`, `linkGuestCheckoutOnUserCreate`, `reconcileStripePayments` (scheduled), `processEmailQueueV2` + `drainPendingEmailQueueV2`, `queueLifecycleEmailCadenceV2`, churn detection/recovery.
- Live checkout **works end to end**: `createCheckoutSessionV2` with `{planKey:"pro"}` returned a valid `cs_live_…` Stripe Checkout URL (verified this session, guest path).
- Server is the pricing authority: client sends `planKey` only, never a price ID; server maps plan→Stripe price via secret price IDs / lookup keys. **This is correct and must be preserved.**
- All 18 tested production routes return HTTP 200 (`/`, `/start`, `/pricing`, `/start-trial`, `/get-access`, `/checkout/start`, `/courses`, `/signup`, `/login`, `/payment-success`, `/payment-cancel`, `/billing`, `/faq`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`).
- Firestore entitlement rules (`isPremium`, `hasActiveSubscription`, founding/beta) are coherent and match the server `userHasPaidAccess` model now centralized in `accessControl.ts`.
- Email delivery transport (Office365 SMTP) works; queue validates required fields before send.

---

## 5. Commit log (this branch, in order)

| Commit | Summary |
|---|---|
| `d51382b` | fix(functions): restore compiling tsc build (4 TS errors blocking deploy) |
| `5a92a04` | fix(security): enforce caller ownership on MCP PII tools (cherry-picked from origin security branch) |
| `158b8db` | fix(security): close premium-content leak in MCP get_lesson_content; extract shared access-control module |
| `8a943a8` | fix(pricing): remove orphaned landing.html ($49/mo); correct false 14-day trial claim |
| `0d01255` | fix(pricing): standardize annual price display to $239.88/year everywhere |
| `e373c00` | docs: point README at authoritative repo; correct stale 'no trials exist' analytics comment |

---

## 6. Next actions (sequenced)

1. **Deploy the fixes** (functions + hosting) — turns C-1/C-2/C-3/H-1/H-2 from “fixed in code” to “fixed in production.” Requires deploy auth (owner or CI). `OWNER_ACTIONS.md` A-1.
2. **H-3 lead capture** — guarantee email-before-redirect on all checkout entries + backfill leads from checkout sessions. Largest near-term recoverable-revenue lever.
3. **Phase 2** — ICP decision (`ICP_AND_POSITIONING.md`), one dominant CTA, 10-minute free activation experience feeding lifecycle emails.
4. **Phase 3** — first-party revenue dashboard from Firestore + Stripe webhook events (server-authoritative MRR; annual ÷ 12; trials never counted as recurring).
5. **Phase 4** — zero-cost SEO topic clusters from real curriculum + quality-gated editorial pipeline; lead-magnet + referral loops.
