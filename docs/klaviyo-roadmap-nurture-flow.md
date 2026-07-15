# Klaviyo Nurture Flow: Roadmap Leads → $1 Pro Trial

Draft for the 3-email nurture sequence targeting leads who grabbed the free
roadmap / lead magnet but never started the $1 Pro trial.

---

## Current wiring gap (do this first)

Roadmap activations are stored in Firestore in the `leads` collection via `submitActivationV2`
(`functions/src/activation.ts`), with a fallback write to `lead_magnet_signups` via
`submitLeadMagnetV2` (`functions/src/leadMagnet.ts`). **Neither path currently sends the
profile to Klaviyo**, so the Klaviyo list/flow can't be auto-populated yet.
The Klaviyo account has only the three default lists and no configured flows.
Two options, in order of preference:

1. **API sync (recommended):** extend `submitLeadMagnetV2` to call Klaviyo's
   `POST /api/profile-subscription-bulk-create-jobs` (subscribe) with a new
   list **"Roadmap Leads"**, passing `leadMagnetId` and `source` as profile
   properties. New signups then enter the flow automatically.
2. **Manual bridge (works today):** export emails from the
   `lead_magnet_signups` collection and CSV-import into a "Roadmap Leads"
   list. Repeat weekly until the API sync ships.

Also needed for the exit condition: a **"Started Trial"** metric. Fire a
Klaviyo event from the Stripe checkout-completed webhook
(`functions/src/stripe.ts`) when the $1 trial subscription is created.
Until that exists, use the fallback exit filter below.

## Flow configuration

| Setting | Value |
|---|---|
| Trigger | Added to List → **Roadmap Leads** |
| Flow filter | `Started Trial` zero times since starting this flow *(fallback until the metric exists: profile property `subscriptionStatus` is not set)* |
| Exit | Person is removed when they start the trial (flow filter re-checked before each send) |
| Smart Sending | OFF for Email 1 (it must arrive immediately), ON for Emails 2–3 |
| UTM | `utm_source=klaviyo&utm_medium=email&utm_campaign=roadmap_nurture` |

Timing: **Email 1** immediately on trigger · **Email 2** wait 2 days ·
**Email 3** wait 3 more days (day 5).

All CTAs link to: `https://aiintegrationcourse.com/checkout/start?plan=pro_trial`

---

## Email 1 — Day 0: Deliver + first quick win

**Subject:** Your roadmap is inside (+ a 15-minute first build)
**Subject B (A/B test):** Open this before you read the roadmap
**Preview text:** The map is free. Here's the fastest first mile.

> Hey {{ first_name|default:"there" }},
>
> Your AI Integration Roadmap is here — keep it somewhere you'll actually
> see it: **[Open the Roadmap →]**
>
> One honest warning before you read it: a roadmap tells you *what* to
> build, and that's where most people stall. They read, nod, bookmark,
> and never ship anything.
>
> So here's the shortcut past that trap. The first exercise in the
> course takes about 15 minutes and ends with a **working AI automation** —
> not a prompt, not a demo, a thing that runs while you sleep.
>
> You can do that exercise (and everything else — the full curriculum,
> the RAG and multi-agent modules, and Allie, the AI tutor that
> unblocks you in real time) for **$1**:
>
> **[Start the $1 Pro Trial →]**
>
> 7 days, full access, cancel in two clicks. And if you join and don't
> ship a live automation in your first two weeks, there's a 14-day
> money-back guarantee — no questions asked.
>
> — Blaine
>
> P.S. Stuck on where to start? Reply to this email with what you're
> trying to automate. I read every reply.

## Email 2 — Day 2: The "why demos die" teach + reframe

**Subject:** Why your AI demo will break in production
**Subject B:** The 5 layers between a cool demo and a real AI system
**Preview text:** It's not the prompt. It's the architecture.

> Most AI projects have the same life cycle: incredible demo → shipped →
> weird failure nobody can reproduce → quietly abandoned.
>
> The reason is almost never the model or the prompt. It's that a demo
> only has to work **once**, and a system has to work **every time** —
> with malformed inputs, API timeouts, and a model that answers
> differently on Tuesday.
>
> The fix is boring and learnable: contracts, boundaries, validation,
> retries, evals. Five layers. We wrote up the whole architecture, free,
> no signup: **[AI Integration Architecture: a systems-engineering guide →](https://aiintegrationcourse.com/blogs/ai-integration-architecture-reliable-workflows)**
>
> The course is that article turned into muscle memory — you build each
> layer yourself, on your own use case, with Allie (the AI tutor)
> reviewing your work as you go. That's the difference between knowing
> the words and shipping the thing.
>
> **[Build it for real — $1 trial →]**
>
> — Blaine

## Email 3 — Day 5: Direct offer + cost of waiting

**Subject:** $1. Seven days. One shipped automation.
**Subject B:** Still on the fence? Read this in 40 seconds
**Preview text:** The math on waiting is worse than the math on trying.

> Quick math, then I'll leave you alone.
>
> The average manual workflow our students automate first saves them
> **8–12 hours a month**. Every month you don't build it, you pay that
> cost again. The trial that shows you how costs $1 — less than the
> coffee you'd drink while doing the busywork.
>
> Here's everything behind the trial door:
>
> - **The full curriculum** — prompt & API orchestration, production
>   RAG, multi-agent architectures, low-code automation (n8n / Make /
>   Zapier), and AI business strategy
> - **Allie, your AI tutor** — explains, reviews your code, and
>   unblocks you inside every lesson
> - **The Forge sandbox** — a live environment to build in, nothing to
>   install
> - **A 14-day ship-or-refund guarantee** — if you don't have a live
>   automation in two weeks, full refund, no questions
>
> **[Start the $1 Pro Trial →]**
>
> If it's genuinely not the right time, no hard feelings — the roadmap
> and the blog are yours free, forever. But if "not the right time" is
> code for "I'll do it someday," the trial is the cheapest way to make
> someday this week.
>
> — Blaine

---

## Measurement

- North star: **trial starts from flow** (7-day window post-click)
- Secondary: Email 1 open rate (subject A/B), Email 2 blog CTR, Email 3
  click-to-trial rate
- Review after ~200 recipients; swap the losing subject variants, then
  test send times (Email 2/3 at 8am vs 6pm recipient-local).
