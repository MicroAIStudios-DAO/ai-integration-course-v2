# GTM DataLayer Schema & Retargeting Audience Definitions
## AIIntegrationCourse.com — Conversion + Recovery System

This document is the **single source of truth** for all `dataLayer.push()` events fired by the
application. Every event here maps to a GTM trigger, which maps to a GA4 event, which maps to a
Google Ads audience or conversion action.

---

## 1. Global Variables (Present on Every Page)

These variables are pushed once on page load via `window.dataLayer = window.dataLayer || []` and
are available to all subsequent triggers.

| Variable | Type | Source | Example |
| :--- | :--- | :--- | :--- |
| `user_id` | string | Firebase Auth UID | `"abc123xyz"` |
| `user_status` | string | Firestore `users/{uid}.subscriptionStatus` | `"active"` \| `"trialing"` \| `"free"` |
| `plan_key` | string | Firestore `users/{uid}.planKey` | `"pro_monthly"` |
| `utm_source` | string | URL param / localStorage | `"google"` |
| `utm_medium` | string | URL param / localStorage | `"cpc"` |
| `utm_campaign` | string | URL param / localStorage | `"trial_launch"` |
| `utm_content` | string | URL param / localStorage | `"hero_cta"` |
| `page_type` | string | Route-level push | `"pricing"` \| `"checkout_start"` \| `"dashboard"` |

---

## 2. Full Event Schema (21 Events)

### Funnel Entry Events

#### `lead_captured`
Fired when the pre-checkout `/checkout/start` form is submitted.
```json
{
  "event": "lead_captured",
  "lead_email": "user@example.com",
  "lead_plan_key": "pro_trial",
  "lead_source": "pricing_page",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "trial_launch",
  "has_sms_consent": true,
  "has_marketing_consent": true
}
```
**GTM Trigger:** Custom Event — `lead_captured`
**GA4 Event:** `generate_lead`
**Google Ads Audience:** "Lead Captured — Not Yet Converted" (RLSA)

---

#### `checkout_start_page_view`
Fired on `/checkout/start` page load.
```json
{
  "event": "checkout_start_page_view",
  "plan_key": "pro_trial",
  "utm_source": "google",
  "page_type": "checkout_start"
}
```

---

#### `checkout_initiated`
Fired when Stripe Checkout session is created and user is redirected.
```json
{
  "event": "checkout_initiated",
  "plan_key": "pro_trial",
  "offer_type": "pro_trial",
  "session_id": "cs_live_xxx",
  "value": 1.00,
  "currency": "USD"
}
```
**GTM Trigger:** Custom Event — `checkout_initiated`
**GA4 Event:** `begin_checkout`
**Google Ads Audience:** "Checkout Initiated — Not Completed" (highest-value retargeting segment)

---

### Conversion Events

#### `purchase`
Fired on `/payment-success` page load after successful checkout.
```json
{
  "event": "purchase",
  "transaction_id": "cs_live_xxx",
  "value": 1.00,
  "currency": "USD",
  "plan_key": "pro_trial",
  "offer_type": "pro_trial",
  "subscription_id": "sub_xxx",
  "customer_id": "cus_xxx",
  "recovered_from": null
}
```
**GTM Trigger:** Custom Event — `purchase`
**GA4 Event:** `purchase`
**Google Ads Conversion:** `AW-CONVERSION_ID/CONVERSION_LABEL` (primary conversion action)

---

#### `trial_start`
Fired on `/payment-success` when `plan_key === "pro_trial"`.
```json
{
  "event": "trial_start",
  "plan_key": "pro_trial",
  "trial_end_date": "2026-05-02",
  "value": 1.00,
  "currency": "USD"
}
```
**Google Ads Audience:** "Trial Started" (for trial-to-paid conversion campaign)

---

#### `trial_converted`
Fired from `analytics.ts` when `invoice.payment_succeeded` fires after trial period ends.
```json
{
  "event": "trial_converted",
  "plan_key": "pro_monthly",
  "value": 29.99,
  "currency": "USD",
  "days_in_trial": 7
}
```
**Google Ads Conversion:** Secondary conversion — "Trial to Paid"

---

### Abandonment Events

#### `checkout_abandoned`
Fired by the webhook via Firestore → client polling, or directly on `PaymentCancelPage` load.
```json
{
  "event": "checkout_abandoned",
  "plan_key": "pro_trial",
  "session_id": "cs_live_xxx",
  "abandonment_reason": null,
  "time_in_checkout_seconds": 180
}
```
**GTM Trigger:** Custom Event — `checkout_abandoned`
**GA4 Event:** `checkout_abandoned`
**Google Ads Audience:** "Checkout Abandoners" — primary retargeting audience

---

#### `cancellation_page_view`
Fired on `PaymentCancelPage` load.
```json
{
  "event": "cancellation_page_view",
  "plan_key": "pro_trial",
  "session_id": "cs_live_xxx"
}
```

---

#### `cancellation_recovery_click`
Fired when user clicks "Resume My Checkout" on the cancel page.
```json
{
  "event": "cancellation_recovery_click",
  "plan_key": "pro_trial",
  "recovery_method": "resume_button"
}
```

---

#### `cancel_reason_submitted`
Fired when user submits the micro-survey on the cancel page.
```json
{
  "event": "cancel_reason_submitted",
  "reason": "price",
  "plan_key": "pro_trial"
}
```
**Use:** Product analytics — feed into A/B test decisions weekly.

---

### Recovery Events

#### `email_recovery_click`
Fired when user arrives via a UTM-tagged recovery email link.
```json
{
  "event": "email_recovery_click",
  "email_sequence": "abandonment_2",
  "utm_campaign": "checkout_recovery",
  "utm_content": "email_2_6hr",
  "plan_key": "pro_trial"
}
```
**GTM Trigger:** Custom Event — `email_recovery_click`
**GA4 Event:** `email_recovery_click`
**Google Ads Audience:** "Clicked Recovery Email" (suppress from cold retargeting)

---

#### `checkout_resumed`
Fired when user clicks the Stripe recovery link or resume button.
```json
{
  "event": "checkout_resumed",
  "resume_source": "stripe_recovery_link",
  "plan_key": "pro_trial",
  "hours_since_abandonment": 2.5
}
```

---

### Engagement Events

#### `exit_intent_shown`
Fired when the exit-intent modal triggers.
```json
{
  "event": "exit_intent_shown",
  "page_type": "pricing",
  "plan_key": "pro_trial"
}
```

---

#### `exit_intent_email_captured`
Fired when user submits email in the exit-intent modal.
```json
{
  "event": "exit_intent_email_captured",
  "plan_key": "pro_trial",
  "page_type": "pricing"
}
```
**Google Ads Audience:** "Exit Intent Captured" — warm retargeting

---

#### `annual_upsell_click`
Fired when monthly subscriber clicks the annual upsell banner.
```json
{
  "event": "annual_upsell_click",
  "current_plan": "pro_monthly",
  "upsell_plan": "pro_annual",
  "months_subscribed": 1
}
```

---

#### `billing_portal_opened`
Fired when user navigates to `/billing`.
```json
{
  "event": "billing_portal_opened",
  "plan_key": "pro_monthly",
  "subscription_status": "active"
}
```

---

#### `dunning_email_clicked`
Fired when user arrives via a payment failure recovery email.
```json
{
  "event": "dunning_email_clicked",
  "attempt_number": 1,
  "utm_campaign": "payment_recovery"
}
```

---

#### `subscription_cancelled`
Fired when Firestore `users/{uid}.subscriptionStatus` changes to `cancelled`.
```json
{
  "event": "subscription_cancelled",
  "plan_key": "pro_monthly",
  "months_subscribed": 2,
  "cancel_reason": "price"
}
```
**Google Ads Audience:** "Churned Subscribers" — win-back campaign

---

### Google Ads Conversion Tracking

#### `google_ads_purchase_conversion`
Belt-and-suspenders GA4 → Google Ads conversion push (in addition to the GTM tag).
```json
{
  "event": "google_ads_purchase_conversion",
  "send_to": "AW-CONVERSION_ID/CONVERSION_LABEL",
  "value": 1.00,
  "currency": "USD",
  "transaction_id": "cs_live_xxx"
}
```

---

## 3. GTM Container Setup

### Required Tags

| Tag Name | Type | Trigger | Purpose |
| :--- | :--- | :--- | :--- |
| GA4 Configuration | GA4 Config | All Pages | Base GA4 tracking |
| GA4 — Lead Captured | GA4 Event | `lead_captured` | Conversion funnel tracking |
| GA4 — Checkout Initiated | GA4 Event | `checkout_initiated` | Funnel step 2 |
| GA4 — Purchase | GA4 Event | `purchase` | Primary conversion |
| GA4 — Trial Start | GA4 Event | `trial_start` | Trial funnel |
| Google Ads — Purchase Conversion | Google Ads Conversion | `purchase` | Bid optimization |
| Google Ads — Lead Conversion | Google Ads Conversion | `lead_captured` | Lead gen campaign |
| Remarketing — Checkout Abandoner | Google Ads Remarketing | `checkout_abandoned` | RLSA audience |
| Remarketing — Exit Intent | Google Ads Remarketing | `exit_intent_shown` | Warm audience |

### Required Variables

| Variable Name | Type | Value |
| :--- | :--- | :--- |
| DLV — plan_key | Data Layer Variable | `plan_key` |
| DLV — offer_type | Data Layer Variable | `offer_type` |
| DLV — value | Data Layer Variable | `value` |
| DLV — transaction_id | Data Layer Variable | `transaction_id` |
| DLV — utm_source | Data Layer Variable | `utm_source` |
| DLV — utm_campaign | Data Layer Variable | `utm_campaign` |

---

## 4. Google Ads Audience Definitions

### Audience 1: Checkout Abandoners (Highest Priority)
- **Trigger:** `checkout_abandoned` event
- **Membership duration:** 30 days
- **Bid adjustment:** +50% (Search), +30% (Display)
- **Ad copy theme:** "Your AI system is waiting. Resume where you left off."
- **Exclusion:** Users who have `purchase` event in last 30 days

### Audience 2: Pricing Page Visitors (No Checkout)
- **Trigger:** `page_type == "pricing"` AND no `checkout_initiated` in session
- **Membership duration:** 14 days
- **Bid adjustment:** +25%
- **Ad copy theme:** "Start for $1. Cancel anytime. No risk."

### Audience 3: Exit Intent Captured
- **Trigger:** `exit_intent_email_captured` event
- **Membership duration:** 7 days
- **Bid adjustment:** +40%
- **Ad copy theme:** "We saved your spot. Your $1 trial is still available."

### Audience 4: Trial Users (Conversion Campaign)
- **Trigger:** `trial_start` event
- **Membership duration:** 7 days
- **Campaign type:** Conversion — "Trial to Paid"
- **Ad copy theme:** "Your trial ends in X days. Lock in your access."

### Audience 5: Churned Subscribers (Win-Back)
- **Trigger:** `subscription_cancelled` event
- **Membership duration:** 90 days
- **Bid adjustment:** +20%
- **Ad copy theme:** "AI isn't slowing down. Come back and stay ahead."

### Audience 6: Active Subscribers (Upsell — Annual)
- **Trigger:** `purchase` event AND `plan_key == "pro_monthly"`
- **Membership duration:** 60 days
- **Campaign type:** Upsell — "Monthly to Annual"
- **Ad copy theme:** "Save $120/year. Switch to annual today."

---

## 5. UTM Taxonomy

All links — whether in emails, ads, or social posts — must follow this taxonomy precisely.

| Parameter | Email Recovery | Google Ads | LinkedIn | Reddit |
| :--- | :--- | :--- | :--- | :--- |
| `utm_source` | `email` | `google` | `linkedin` | `reddit` |
| `utm_medium` | `lifecycle` | `cpc` | `social` | `community` |
| `utm_campaign` | `checkout_recovery` | `trial_acquisition` | `thought_leadership` | `helpful_answers` |
| `utm_content` | `email_1_10min` | `abandoner_30d` | `post_slug` | `thread_id` |
| `utm_term` | *(plan key)* | *(keyword)* | — | — |

**Example recovery email link:**
```
https://aiintegrationcourse.com/checkout/start?plan=pro_trial
  &utm_source=email
  &utm_medium=lifecycle
  &utm_campaign=checkout_recovery
  &utm_content=email_2_6hr
  &utm_term=pro_trial
```

---

## 6. Weekly Optimization Checklist

Every Monday, review these metrics in GA4 and Stripe:

1. **Abandonment rate by plan** — target: below 60% within 90 days
2. **Recovery rate** — target: 10-20% of abandoned sessions convert via email sequence
3. **Email open rate** — target: above 40% for Email 1, above 25% for Emails 2-5
4. **Email click-to-checkout rate** — target: above 8%
5. **Trial-to-paid conversion rate** — target: above 50%
6. **Dunning recovery rate** — target: above 60% of `past_due` accounts recovered within 7 days
7. **Cancel reason distribution** — if "price" > 40%, test lower-priced entry offer

**Decision rules:**
- If Email 1 open rate < 30%: A/B test subject line
- If Email 2 click rate < 5%: A/B test objection addressed (price vs. time vs. efficacy)
- If trial-to-paid < 40%: Add Day 5 urgency email and in-app Day 6 banner
- If abandonment rate not improving after 30 days: Reduce trial price to $0 (free trial)
