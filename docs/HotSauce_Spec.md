# Hot Sauce Moves — Section 13
## AIIntegrationCourse.com | Source-Aware Copy, Plan-Aware Fallbacks, UTM Discipline

---

## 1. Source-Aware Headline Copy

The `PlanSelectorPage` and `PricingPage` read `utm_source` from the URL and swap the hero headline accordingly.

**Implementation:** `src/pages/PlanSelectorPage.tsx` reads `new URLSearchParams(window.location.search).get('utm_source')` and applies the following map:

| `utm_source` | Headline |
| :--- | :--- |
| `google` / `cpc` | "You searched for AI automation. Here's the fastest path to actually using it." |
| `linkedin` | "The AI workflows you've been reading about. Now built by you, in a week." |
| `email` | "You've been thinking about this. Here's the $1 way to find out if it's worth it." |
| `reddit` | "No hype. Just a structured path to building real AI workflows." |
| `sms` | "Your trial is still open. One click to get back in." |
| *(default)* | "Start building AI workflows that actually save time. $1 for 7 days." |

---

## 2. Plan-Aware Fallbacks

When an annual plan abandoner receives Email 2-4, the CTA dynamically downgrades to the $1 trial offer.

**Logic (live in `emailLifecycle.ts`):**
```typescript
const isAnnualAbandon = planKey === 'pro';
const email2CtaLabel = isAnnualAbandon ? 'Start the 7-Day Trial for $1' : 'Resume My $1 Trial';
const annualFallback = isAnnualAbandon ? `Start with $1 Instead: ${trialUrl}` : '';
```

This prevents annual-plan abandoners from receiving a "Resume $239 checkout" CTA, which has near-zero conversion. Instead, they get the lowest-friction entry point.

---

## 3. UTM Discipline — Master Taxonomy

Every link leaving the platform must include all 5 UTM parameters.

| Parameter | Required Values |
| :--- | :--- |
| `utm_source` | `google`, `linkedin`, `reddit`, `email`, `sms`, `in_app_banner`, `checkout_abandonment`, `trial_onboarding`, `payment_failed`, `annual_upsell` |
| `utm_medium` | `cpc`, `email`, `sms`, `organic_social`, `dashboard`, `webhook` |
| `utm_campaign` | `<template_campaignId>` from `emailTemplates.ts` |
| `utm_content` | `email1_reminder`, `email2_objections`, `email3_momentum`, `email4_incentive`, `email5_closeout`, `trial_day1`, `trial_day3`, `trial_day5`, `trial_day6`, `trial_day7`, `dunning_1`, `dunning_2`, `dunning_3` |
| `utm_term` | *(optional)* paid keyword for Google Ads campaigns |

**Rule:** Never use a bare `/pricing` link in any email, SMS, or ad. Always append UTMs.

---

## 4. Checkout Language — "Access" Not "Payment"

All CTAs and button labels must use access-oriented language, not payment-oriented language.

| ❌ Avoid | ✅ Use Instead |
| :--- | :--- |
| "Complete Payment" | "Unlock My Access" |
| "Pay Now" | "Start My $1 Trial" |
| "Purchase Plan" | "Get Full Access" |
| "Buy Annual" | "Lock In Annual Access" |
| "Submit Order" | "Activate My Account" |

This is implemented in `stripe.ts` via `custom_text.submit.message` on the checkout session.

---

## 5. Decision Rules — Section 17

| Metric | Threshold | Action |
| :--- | :--- | :--- |
| Email open rate | < 25% | Rewrite subject line; A/B test 2 variants |
| Email click rate | < 3% | Rewrite CTA copy and button color |
| Recovery rate (Email 1-5) | < 8% | Add SMS layer; shorten Email 1 to 3 sentences |
| Trial-to-paid conversion | < 40% | Add Day 5 urgency email; review onboarding activation |
| Dunning recovery | < 30% | Add SMS dunning; reduce retry window from 5 to 3 days |
| Abandonment rate | > 70% | Audit checkout page load time; test removing Klarna |
| Abandonment rate | < 55% | Scale current ad spend by 20% |
| Annual upsell click rate | < 5% | Test banner position (top vs. bottom of dashboard) |

**Review cadence:** Weekly on Mondays. Pull Stripe + email platform data. Update this file with decisions made.
