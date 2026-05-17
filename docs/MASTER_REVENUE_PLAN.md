# Master Revenue Ramp Plan
## AI Integration Course — 14-Day Sprint

This document synthesizes the strategic recommendations from Gemini with the actual state of the `MicroAIStudios-DAO/ai-integration-course-v2` codebase. It answers the Landbot question, provides a gap analysis, and outlines the exact execution steps to activate the revenue engine.

---

## 1. Landbot AI Analysis: Is it worth it?

**What is Landbot?**
Landbot is a no-code chatbot builder that specializes in conversational lead generation (WhatsApp, website widgets). It’s designed to replace static forms with interactive chat flows.

**My Architectural Recommendation: NO (Skip it for now).**
Here is why:
1. **You already have a custom AI Tutor (`/api/tutor`).** You have built a highly specific, context-aware AI tutor directly into the platform. Slapping a generic third-party chatbot like Landbot on top of the site dilutes your core value proposition (which is *teaching* AI integration).
2. **Lead Capture is Already Built.** Your codebase already has an `ExitIntentModal` and a `NewsletterSignup` component that write directly to Firestore `leads`.
3. **The Play:** Instead of paying for Landbot, we should surface your *own* AI Tutor on the public homepage as a "Try before you buy" widget. This proves your technical authority instantly.

---

## 2. Codebase Gap Analysis

Here is what the Gemini strategy recommended versus what is actually in the codebase today:

| Strategy | Codebase Status | Gap to Fill |
| :--- | :--- | :--- |
| **HubSpot CRM Sync** | 🟡 Code exists (`hubspotSync.ts`), but not activated. | Needs API token and custom properties created in HubSpot. |
| **Welcome/Recovery Emails** | 🔴 Nothing exists. Firebase Extension for email is not installed. | Must build the 5-email sequence in HubSpot once sync is active. |
| **Annual Upsell (30 days)** | 🟢 Built today. `AnnualUpsellBanner` is wired to real Stripe billing dates. | None. Will trigger automatically for active monthly users. |
| **Discord Community** | 🟡 UI exists, but link is empty (`VITE_FOUNDING_DISCORD_URL`). | Create the server and set the environment variable. |
| **Affiliate/Referral Loop** | 🔴 Nothing exists. | Set up Invite Tracker bot in Discord. |
| **KPI Dashboard** | 🔴 Nothing exists in-app. | Use Stripe Dashboard for MRR and HubSpot for conversion rates. |

---

## 3. The 14-Day Execution Checklist

I have implemented the code changes for the Annual Upsell and the Discord UI. Here is exactly what you need to do to activate the rest of the revenue engine.

### Phase 1: Activate the Foundation (Today)
1. **Activate HubSpot Sync:** Follow the guide in `docs/HUBSPOT_ACTIVATION.md` to connect the Firebase backend to HubSpot.
2. **Launch the Discord:** Follow the guide in `docs/DISCORD_SETUP.md` to create the Founding Cohort server and activate the in-app button.

### Phase 2: The Email Engine (Days 2-5)
Once HubSpot is receiving leads and checkout events from Firebase, build this automated sequence in HubSpot:
1. **Immediate:** "Welcome to AI Integration Course — here's your first lesson"
2. **Abandoned Checkout (10 min):** "You left something behind — your AI skills are waiting"
3. **Abandoned Checkout (24 hrs):** "Last chance: your founding member rate expires soon"
4. **Day 3 (Active User):** "How's Lesson 1 going? Here's what to do next"
5. **Day 30 (Active User):** "Save 40% — switch to annual billing today"

### Phase 3: Traffic & Social Proof (Days 6-14)
1. **Activate the Referral Loop:** Announce in Discord that anyone who invites 3 paying members gets a free month. Use the Invite Tracker bot.
2. **Collect Wins:** Manually DM the first 10 active users. Ask them what they built. Screenshot their answers and put them on the homepage.
3. **Turn on Ads:** Once the abandoned checkout email is live (and recovering lost revenue), you can safely turn on Meta/Google ads to the `/pricing` page.
