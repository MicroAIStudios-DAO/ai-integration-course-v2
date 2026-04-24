# SMS Flow Templates — Section 8
## AIIntegrationCourse.com | Twilio / Klaviyo Integration Spec

> **Platform recommendation:** Klaviyo (if email is primary) or Twilio Verify + Twilio Messaging for standalone SMS.
> Consent must be collected at checkout via an opt-in checkbox before any SMS is sent.

---

## Consent Collection

Add the following checkbox to the Stripe checkout `custom_text.terms_of_service` or the pre-checkout PlanSelectorPage:

> "By checking this box, you agree to receive SMS messages from AI Integration Course at the number provided. Message & data rates may apply. Reply STOP to unsubscribe."

Store `smsConsentGiven: true` on the Firestore user document at checkout.

---

## SMS 1 — Abandonment (10 minutes after checkout.session.expired)

**Trigger:** `checkout.session.expired` webhook (same as Email 1)
**Condition:** `smsConsentGiven === true` AND `customer_details.phone` present on session

```
AI Integration Course: You started checkout but didn't finish. Your $1 trial is still open:
https://aiintegrationcourse.com/pricing?plan=pro_trial&utm_source=sms&utm_medium=sms&utm_campaign=sms_abandonment_1

Reply STOP to unsubscribe.
```

**Character count:** 196 (1 SMS segment)

---

## SMS 2 — Trial Ending (Day 6, 24h before renewal)

**Trigger:** `queueLifecycleEmailCadenceV2` scheduler — same Day 6 window as `trial_ending_soon` email
**Condition:** `smsConsentGiven === true` AND `subscriptionStatus === 'trialing'`

```
AI Integration Course: Your trial ends tomorrow. Keep access at $29.99/mo or upgrade to annual for $19.99/mo.
Manage: https://aiintegrationcourse.com/dashboard?utm_source=sms&utm_medium=sms&utm_campaign=sms_trial_ending

Reply STOP to unsubscribe.
```

**Character count:** 218 (1 SMS segment)

---

## SMS 3 — Payment Failed (Immediate on invoice.payment_failed)

**Trigger:** `invoice.payment_failed` webhook
**Condition:** `smsConsentGiven === true`

```
AI Integration Course: Your payment didn't go through. Update your card to keep access:
https://aiintegrationcourse.com/dashboard/billing?utm_source=sms&utm_medium=sms&utm_campaign=sms_dunning_1

Reply STOP to unsubscribe.
```

**Character count:** 193 (1 SMS segment)

---

## Implementation Notes

- All SMS messages must be sent from a dedicated long-code or toll-free number registered with Twilio.
- Do not send SMS if email has already been opened within 30 minutes (suppress to avoid double-touch).
- Store `smsSentAt` timestamps on Firestore user documents to prevent duplicate sends.
- UTM parameters: `utm_source=sms`, `utm_medium=sms`, `utm_campaign=<campaign_id>`.
