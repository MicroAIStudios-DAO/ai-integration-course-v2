# Pioneer Onboarding Handoff

Date: 2026-03-25

This file is for the separate `https://pioneerai.academy/` onboarding site.

Important: `pioneerai.academy` is not served from this repo. The live site appears to be a separate static React app with a Manus build/runtime and `/api/trpc` backend. Update that codebase or Manus project separately.

## What Was Shipped In This Repo

Production deploy completed to Firebase project `ai-integra-course-v2`.

Core onboarding/access changes now live in the main course app:

- `PIONEER` and approved cohort codes now route users into a paid beta path at `$29.99/mo`.
- Beta access is no longer a free bypass.
- Scholarship access is now separate from beta.
- Scholarship codes grant full course access without checkout, but do not beta-tag the user.
- Founding-code users are now treated as the same cohort lane as beta users for onboarding/feedback access.
- Founding codes are strict one-use codes. Once redeemed, the code is marked used/inactive and should be considered void.
- Founding code expiry remains in `2099`.
- Beta/founding extra lessons are hidden from the default lesson list.
- First five lesson videos now render correctly from Firestore. Lessons 3-5 were backfilled with `videoUrl`.
- Blog routing/content was added under `/blogs`, with sitemap updates.

## Relevant Live App Logic

Primary backend behaviors now expected by any onboarding surface:

- Cohort invite path:
  - Access code claim returns `accessType: "beta"`.
  - User becomes `isBetaTester: true`.
  - Checkout is required unless the account already has paid access.
  - Checkout plan is `beta_monthly`.
  - Price is `2999` cents.

- Scholarship path:
  - Access code claim returns `accessType: "scholarship"`.
  - User receives premium course access.
  - User is not treated as a beta tester.
  - Scholarship must stay private and should not be exposed in public copy.

- Founding code path:
  - Separate from signup invite-code entry.
  - Redeem after account creation.
  - Grants founding access and cohort treatment.
  - Code becomes used/inactive after redemption.

Main implementation files in this repo:

- `functions/src/founding.ts`
- `functions/src/stripe.ts`
- `src/components/auth/SignupPage.tsx`
- `src/components/UserJotWidget.tsx`
- `src/pages/WelcomePage.tsx`
- `src/pages/PricingPage.tsx`
- `src/pages/PaymentSuccessPage.tsx`
- `scripts/seed-beta-access-codes.js`
- `scripts/seed-founding-codes.js`

## Live `pioneerai.academy` Findings

The current live onboarding portal still appears to be based on the old beta/application model.

Observed from live HTML and asset inspection:

- Title/meta still position the site as `Pioneer Cohort — AI Integration Course Beta`.
- Meta description says it automates enrollment, sends onboarding emails via HubSpot, and tracks cohort status with a real-time spots counter.
- Public CTA text includes `Initialize Access`.
- Public onboarding timeline still includes:
  - `Free Exploration`
  - `Beta Closes`
  - onboarding email / log into the platform language
- Admin surface still includes:
  - `Pioneer Signups`
  - `Pending / Approved / Rejected`
  - `Founding Code`
  - `Founding Codes`
  - `Codes Assigned`
  - `Spots Remaining`
- The live portal copy currently says the cohort is capped at `12`.
- A quick asset scan did not surface obvious public `Stripe`, `checkout`, `payment`, or `$29.99` copy, which is consistent with this portal acting as an instruction/pre-qualification surface rather than the actual payment surface.

Important mismatch:

- Current backend seed in this repo sets `PIONEER.maxUses = 20`.
- If `pioneerai.academy` remains public, the spots counter/cap must be updated to match the actual backend policy, or the backend must be changed to 12. Right now they do not match.

## What The Separate Onboarding Site Must Change

### 1. Stop treating beta as an application/approval program

Remove or rewrite any flow built around:

- pending approval
- approved/rejected states for ordinary beta testers
- manual founding-code assignment as the normal beta intake path
- “free exploration” framing
- “beta closes in 14 days” as the primary product model

Public beta users should instead follow a direct paid onboarding path.

### 2. Public onboarding path should be this

Default path:

1. User creates account.
2. If no code is entered, route to normal Pro checkout.

Cohort path:

1. User creates account.
2. User optionally enters `PIONEER` or an approved cohort invite code.
3. Site claims access code against backend.
4. If backend returns `accessType: "beta"`:
   - tag the cohort
   - route the user into the main website checkout for `$29.99/mo`
   - on payment success, route user into the cohort welcome/dashboard

Founding path:

1. User creates account first.
2. User redeems a separate founding code after account creation.
3. Redemption grants founding access and cohort treatment.
4. Founding user gets the cohort lane plus founding benefits.

Scholarship path:

1. Keep this private and manual/invite-only.
2. Do not expose scholarship publicly in hero copy, examples, placeholders, FAQs, SEO, or tooltips.
3. If a scholarship code is used, skip checkout and unlock the course.
4. Do not treat scholarship recipients as beta testers unless you deliberately choose to do so later.

### 3. Remove public scholarship mentions

The only free users beyond the public free lessons are the 5 scholarship recipients.

Rules:

- Scholarship codes are private.
- They are nobody else’s business.
- They should not appear in public copy.
- They should not be shown as example codes.
- They should not be mixed into beta language.

### 4. Treat founding + beta as the same cohort lane

For onboarding UX, founders and paid beta testers should be treated as the same program lane.

That means:

- same cohort dashboard/welcome lane
- same feedback lane access
- same extra beta/founding track access
- same “special cohort member” treatment in UI

But billing is still different:

- paid beta = `$29.99/mo`
- founding = separate founding benefit/access path

### 5. Beta/founding lessons must stay hidden from the default curriculum view

The extra beta/founding lessons should not appear in the standard lesson list.

They should only be surfaced through:

- cohort dashboard
- direct cohort CTA
- direct lesson links
- welcome/onboarding panel

### 6. Payment routing must be explicit

Paid beta is paid on purpose. The goal is tester behavior that mirrors real customers.

The onboarding site should explicitly communicate:

- paid beta is `$29.99/mo`
- checkout on the main website is required for cohort access
- the beta is not complimentary
- this is intentional so behavior matches launch users

The portal itself does not need to embed checkout if the actual website already owns billing. In that case, the portal CTA should clearly hand the user off to the main website signup/checkout path.

The onboarding site should not imply:

- beta access is free
- access is based on approval only
- onboarding happens before payment for normal cohort users

## Recommended Copy Direction For `pioneerai.academy`

Use wording like:

- `Pioneer Cohort`
- `Paid beta`
- `$29.99/mo`
- `Create account, claim cohort rate, continue to the main site checkout`
- `Founding codes are redeemed separately after account creation`

Avoid wording like:

- `free exploration`
- `approval queue`
- `apply for access` for normal beta users
- `complimentary beta`
- public scholarship references

## Recommended Operator Workflow

Public cohort users:

1. Enter site.
2. Continue into the main site signup flow.
3. Use `PIONEER` or approved cohort code.
4. Complete checkout on the main website.
5. Land in cohort welcome/dashboard.
6. Start hidden beta/founding track.
7. Use feedback lane while building.

Founding users:

1. Create account.
2. Redeem founding code.
3. Enter same cohort lane.
4. Founding code is permanently consumed.

Scholarship users:

1. Receive private code out of band.
2. Create account.
3. Apply scholarship code.
4. Skip checkout.
5. Get course access without public beta positioning.

## QA Checklist For The Other LLM

- Remove public “free beta” or “free exploration” language.
- Remove ordinary beta dependence on pending/approved/rejected application states.
- Keep scholarship hidden from public UI.
- Ensure `PIONEER` path ends in paid checkout at `$29.99/mo`.
- If the portal stays instruction-only, its CTA must link into the main website signup/checkout flow instead of pretending access is granted onsite.
- Ensure founding redemption stays separate and one-use.
- Ensure founders are treated as the same cohort lane as beta users.
- Ensure beta/founding lessons are not shown in default curriculum listings.
- Update spots/cap language to match the actual backend rule.
- Do not imply the portal itself grants paid access if payment actually happens on the main site.

## Notes About The Live Portal

Based on current asset inspection, the live portal still exposes old operational concepts:

- real-time spots counter
- onboarding emails
- signups roster
- status approval states
- founding code inventory

That can still be useful for internal operations, but it should not remain the primary public onboarding model for paid beta intake unless the business intentionally wants a manual gate.

## Deployment Status

Main course app deployment completed successfully on 2026-03-25.

Live project:

- Firebase project: `ai-integra-course-v2`
- Hosting URL: `https://ai-integra-course-v2.web.app`

One deploy warning remains outside app logic:

- Firebase reported unhandled cleanup of some build images in GCR, which may leave a small monthly bill unless cleaned up manually.
