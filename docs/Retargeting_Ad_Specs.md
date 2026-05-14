# Retargeting Ad Specs — Section 9
## AIIntegrationCourse.com | Google Ads + Meta Ads Checkout Abandonment Retargeting

---

## Audience Definitions

These audiences are built from `dataLayer` events pushed by `analytics.ts`.

### Audience 1: Checkout Abandoners (High Intent)
- **Trigger event:** `checkout_started` (pushed when SubscribeButton is clicked)
- **Exclusion:** `purchase` event (fired on PaymentSuccessPage)
- **Lookback window:** 30 days
- **Platform:** Google Ads (Customer Match + Remarketing), Meta Custom Audience

### Audience 2: Pricing Page Visitors (Mid Intent)
- **Trigger:** `page_view` on `/pricing`
- **Exclusion:** `checkout_started`
- **Lookback window:** 14 days

### Audience 3: Trial Abandoners (Converted but churned)
- **Trigger:** `trial_start` event
- **Exclusion:** `purchase` (paid conversion)
- **Lookback window:** 60 days

---

## Ad Creative Specs

### Campaign 1: "Finish What You Started" (Checkout Abandoners)

**Google Responsive Display Ad:**
- Headline 1: "Your AI Build Is Waiting"
- Headline 2: "Finish What You Started"
- Headline 3: "Start for $1 — Cancel Anytime"
- Description 1: "You were one step away. Your $1 trial is still open. 14-Day Build Guarantee."
- Description 2: "Build real AI workflows in a week. No coding required."
- Final URL: `https://aiintegrationcourse.com/pricing?plan=pro_trial&utm_source=google&utm_medium=cpc&utm_campaign=retargeting_checkout_abandonment&utm_content=finish_what_you_started`

**Meta Single Image Ad:**
- Primary text: "You were already at the door. Your $1 trial is still open."
- Headline: "Finish What You Started"
- Description: "14-Day Build Guarantee. Cancel anytime."
- CTA button: "Sign Up"
- URL: `https://aiintegrationcourse.com/pricing?plan=pro_trial&utm_source=facebook&utm_medium=cpc&utm_campaign=retargeting_checkout_abandonment&utm_content=finish_what_you_started`

---

### Campaign 2: "Your AI System Is Waiting" (Pricing Page Visitors)

**Google Responsive Search Ad:**
- Headline 1: "Your AI System Is Waiting"
- Headline 2: "Build AI Workflows in 7 Days"
- Headline 3: "No Coding. $1 Trial. Guaranteed."
- Description 1: "Stop reading about AI. Start using it. Structured path, copy-paste templates, real results."
- Description 2: "14-Day Build Guarantee — if you don't ship a workflow, full refund."
- Final URL: `https://aiintegrationcourse.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=retargeting_pricing_visitors&utm_content=your_ai_system_waiting`

---

### Campaign 3: "Come Back" (Trial Abandoners)

**Meta Carousel Ad:**
- Card 1: "You built access. You had the tools. Come back and finish."
- Card 2: "The workflows you started are still there."
- Card 3: "Reactivate for $1. Pick up where you left off."
- CTA: "Learn More"
- URL: `https://aiintegrationcourse.com/pricing?utm_source=facebook&utm_medium=cpc&utm_campaign=retargeting_trial_abandoners&utm_content=come_back`

---

## Budget Recommendations

| Campaign | Daily Budget | Expected CPC | Target CPA |
| :--- | :--- | :--- | :--- |
| Checkout Abandoners | $15/day | $0.80–$1.50 | < $25 |
| Pricing Visitors | $10/day | $1.00–$2.00 | < $35 |
| Trial Abandoners | $10/day | $0.60–$1.20 | < $20 |

**Total retargeting budget:** $35/day = $1,050/month
**Break-even:** 3.5 paid conversions/month at $29.99 (monthly plan)

---

## Frequency Caps

- Google Display: Max 3 impressions/user/day
- Meta: Max 2 impressions/user/day
- Suppress after 7 days of no engagement (no clicks, no opens)
