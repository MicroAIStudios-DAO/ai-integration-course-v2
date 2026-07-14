# ICP & Positioning Decision

**Author:** Fable · **Date:** 2026-07-13 · **Status:** decided, applied to homepage

## Decision (one primary segment, one job-to-be-done)

**Primary ICP:** the **technical builder shipping real AI systems** — professional developers and *technically-inclined* founders/operators who can read/write code (or are willing to) and need to put AI into production, not just prototype prompts.

**Primary job-to-be-done:** *“Ship my first reliable, production-grade AI agent/workflow this week — and understand the systems architecture well enough that it doesn’t break in front of users or customers.”*

**Secondary segments (preserved, not primary):** non-technical operators, consultants building client workflows, and small teams. These keep dedicated surfaces (`/solutions`, `/solutions/:slug`, industry pages) and the “no CS degree required” on-ramp line — but they do **not** get equal billing in the hero.

## Evidence base

| Signal | Source | Implication |
|---|---|---|
| Curriculum = fault-tolerant agent architectures, production environments, API-first design, RAG | homepage subhead + course modules | Content depth skews technical; the differentiated value is *reliability/systems*, not prompt tips |
| “No copy-paste prompt templates” / “Systems Engineering Approach” | hero headline & copy | Positioning already claims the systems-first lane — lean in, don’t dilute |
| Lead magnet = “Top AI Automation Workflows” + “first deployable automation in under 15 minutes” | `NewLandingPage`, lead magnets | Buyers want a concrete shipped result fast → outcome-led, builder audience |
| $1 seven-day trial, hands-on labs, AI tutor, cert badge on passing *sandbox builds* | pricing + product | Product rewards *doing/building*, which fits builders over passive learners |
| Checkout mix (31 trial / 20 explorer / 16 annual of 69) | Firestore | Real buyers already skew to the committed hands-on tiers |

**Why not “everyone / founders-first / no-code operators”:** the product’s durable advantage is *engineering reliability into AI systems*. A no-code/everyone position competes head-on with a flood of free prompt content and undersells the one thing here that’s hard to copy. Leading with the builder keeps the moat; the accessible on-ramp still welcomes serious non-devs without making them the headline.

## Positioning statement

> For developers and technical founders who need to put AI into production, **AI Integration Course** is a hands-on, systems-engineering curriculum that gets you from zero to a *reliable* first AI agent in your first week — unlike prompt-tip courses and free tutorials, it teaches the fault-tolerant architecture, production setup, and API-first design that keep agents working after the demo.

## The 5-second homepage answers (2.2)

1. **Who:** developers & technical founders shipping AI into production.
2. **Result:** a reliable, production-grade AI agent/workflow you built yourself.
3. **Speed:** first deployable automation in under ~15 minutes; first real agent in week one.
4. **Why not free tutorials:** systems-first — fault tolerance, production, API-first — not brittle prompt demos.
5. **Next step:** Start the $1 seven-day trial (dominant CTA).
6. **Trial cost/renewal:** $1 today, 7-day trial, then $29.99/month unless cancelled before day 8; 14-Day Build Guarantee.

## Applied changes (this session)

- Homepage subheadline refocused from “developers, operators, and founders” (all equal) to the primary builder ICP + JTBD, keeping the “no CS degree required” on-ramp as the secondary line.
- **Honesty fix:** “The Faculty Board / A Faculty of Practicing Systems Engineers” (implies multiple faculty; one instructor exists) → honest singular “Your Instructor / Taught by a practicing systems engineer.” Logged in `OWNER_ACTIONS.md`.
- Institutional/accreditation-implying framing (“The Foundation for Applied Artificial Intelligence & Systems Design,” “Academy,” “certification”) flagged for owner substantiation before any accreditation claim is stated — see `OWNER_ACTIONS.md` A-5.

## Open validation (do, don’t assume — 2.3)

The dominant first step is currently the **$1 trial**. Instrument and compare against (a) the 10-minute free build and (b) the workflow lead magnet as first steps, then let real `first_value_achieved`→`trial_started`→`trial_converted` rates decide. Wired in Phase 3 measurement.
