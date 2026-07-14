# Owner Actions — things Fable genuinely cannot do

These are the only items blocked on the owner. Everything else proceeds autonomously.
Each item lists the exact command/click path. Ordered by revenue impact.

---

## A-1 — Deploy the branch fixes to production 🔴 HIGHEST IMPACT

**Why it needs you:** deploying to live Firebase is a production change; I have Firebase CLI auth in-session (`livetrue2u@gmail.com`) but pushing live billing-adjacent function + hosting changes should be an explicit owner decision. The safest route is to merge the PR and let CI deploy, OR run the deploy yourself.

**What ships:** compiling functions build (C-1), MCP premium-content leak fix (C-2), $49→removed landing page + 301 (C-3), $239.88 price consistency (H-1), 7-day-trial copy fix (H-2). All verified: `tsc` clean, `vite build` clean, `vitest` 8/8.

**Option 1 — merge PR, let GitHub Actions deploy (recommended):**
1. Review PR `fable/10000-mrr-engine` → `main`.
2. Merge. The "Deploy to Production" workflow runs on push to `main`. It was previously failing **only** because of the build errors this branch fixes — it should now go green.

**Option 2 — deploy locally yourself** (in this repo, on the branch):
```bash
# functions (build gate runs automatically via predeploy)
npm run deploy:functions
# hosting (frontend + landing.html redirect)
npm run deploy:hosting
```

**If you want me to run Option 2 now**, reply “deploy functions and hosting” and I’ll execute it — the deploy commands are not blocked, I’m holding only because it’s a live production change you should authorize.

---

## A-2 — Confirm the live Stripe annual Price amount 🟡

**Why it needs you:** reading the live `STRIPE_SECRET` was (correctly) blocked by the environment’s secret-access guard, so I standardized display copy on the server config value (`$239.88`) but could not read the actual Stripe Price object.

**Click path:** Stripe Dashboard → Products → the annual Pro plan (lookup key `ai_integration_course_pro_annual`) → confirm the recurring Price `unit_amount` = **`23988`** (i.e. $239.88/yr) and interval = year.
- If it reads `23900` ($239.00) instead, tell me and I’ll flip all display copy to `$239.00` in one commit (and the “save $120” math becomes “save $119.88 → round to $119”).

---

## A-3 — (Optional) Provide keys for Phase-3 “ecosystem” features ⚪ NOT on the $10k path

`pineconeLab`, `mcpServer`, `circleCommunity`, `vantaCompliance` are coded but **undeployed** and require third-party accounts not currently configured: `PINECONE_API_KEY`, `PINECONE_INDEX_HOST`, `CIRCLE_API_TOKEN`, `CIRCLE_COMMUNITY_ID`, `CIRCLE_SSO_KEY`. These are **not** part of the acquisition→checkout→retention money path and adding paid plans would violate the no-new-cost constraint. **Recommendation: leave dark.** Only supply keys if you want these activated as part of the paid offer; otherwise no action needed.

---

## A-4 — (If desired) Enable GA4 Data API read for a fuller baseline ⚪

The dashboard I’m building derives MRR and funnel metrics from **first-party Firestore + Stripe webhook data** (server-authoritative, no external dependency) — this is the preferred approach and needs nothing from you. If you *also* want GA4 session/traffic numbers pulled programmatically, enable the **Google Analytics Data API** on project `ai-integra-course-v2` and grant `livetrue2u@gmail.com` viewer on the GA4 property. Optional.

---

## A-5 — Substantiate (or soften) institutional & credential claims 🟡 INTEGRITY

**Why it needs you:** several public claims imply an accredited institution or a faculty that I cannot verify from the repo, and the operating rules forbid presenting an independent training product as accredited without evidence. I have already corrected the clearest overstatement autonomously; the rest need your factual input.

**Already fixed (honesty):** homepage “The Faculty Board / A Faculty of Practicing Systems Engineers” (plural, implied multiple faculty) → “Your Instructor / Taught by a Practicing Systems Engineer,” because only one instructor (Blaine Casey) is presented.

**Needs your decision/evidence — do any of these have legal/documentary backing?**
1. **“The Foundation for Applied Artificial Intelligence & Systems Design” / “Academy.”** Is this a registered entity? If it’s a brand/venture name, that’s fine — but the “Foundation/Academy” framing can read as accreditation. If not accredited, keep as branding but avoid implying accreditation.
2. **“Certification” / “cryptography-backed completion badges.”** Confirm these are described as *course-completion* credentials, not industry-accredited certifications. Current copy is mostly OK; just confirm you’re comfortable with the word “Certification.”
3. **Homepage stat “100%.”** 100% of what? If it’s not a substantiated figure, tell me the real metric and I’ll label it precisely (or remove it).

Reply with the facts (e.g. “Foundation is an unregistered brand; badges are course-completion only; ‘100%’ means 100% hands-on labs”) and I’ll align every surface in one commit. Until then I’ve left the branding intact and only corrected the plural-faculty claim.

---

_Last updated: 2026-07-13 by Fable. Nothing else is blocked._
