# HubSpot Integration Activation Checklist
## AI Integration Course — CRM & Email Automation

The `hubspotSync.ts` Firebase Function is fully built and ready to activate. It mirrors every lead, checkout event, and subscription status change to HubSpot in real time. This document explains the one-time setup required to turn it on.

---

## What Is Already Built

The function handles the following automatically once activated:

- Every new lead captured via the exit-intent form → creates a HubSpot contact
- Checkout started → updates `checkout_funnel_stage` to `checkout_started`
- Checkout abandoned → updates stage to `checkout_abandoned`, records timestamp and plan key
- Subscription activated → updates lifecycle stage to `customer`, records MRR
- Subscription cancelled → updates stage to `churned`
- Trial started → updates stage to `trialing`

---

## Step 1: Get Your HubSpot Private App Token

1. Log into [app.hubspot.com](https://app.hubspot.com).
2. Go to **Settings** → **Integrations** → **Private Apps**.
3. Click **Create a private app**.
4. Name it: `AI Integration Course Sync`
5. Under **Scopes**, enable:
   - `crm.objects.contacts.write`
   - `crm.objects.contacts.read`
   - `crm.schemas.contacts.write` (for custom properties)
6. Click **Create app** → copy the **Access Token** (starts with `pat-`).

---

## Step 2: Add the Token to Firebase Functions Environment

```bash
# From your HERMES1 terminal, in the project directory:
cd ~/code/ai-integration-course

firebase functions:config:set hubspot.access_token="pat-YOUR-TOKEN-HERE"

# Or using the newer Firebase Functions v2 secrets approach:
firebase functions:secrets:set HUBSPOT_ACCESS_TOKEN
# (paste the token when prompted)

# Then redeploy the functions:
firebase deploy --only functions:syncLeadToHubSpot,functions:syncUserToHubSpot
```

---

## Step 3: Create Custom Properties in HubSpot

Run this once to create the custom contact properties the sync function expects:

```bash
# The hubspot MCP server can do this, or run via curl:
curl -X POST https://api.hubapi.com/crm/v3/properties/contacts \
  -H "Authorization: Bearer pat-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"checkout_funnel_stage","label":"Checkout Funnel Stage","type":"string","fieldType":"text","groupName":"contactinformation"}'

curl -X POST https://api.hubapi.com/crm/v3/properties/contacts \
  -H "Authorization: Bearer pat-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"offer_type","label":"Offer Type","type":"string","fieldType":"text","groupName":"contactinformation"}'

curl -X POST https://api.hubapi.com/crm/v3/properties/contacts \
  -H "Authorization: Bearer pat-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"stripe_customer_id","label":"Stripe Customer ID","type":"string","fieldType":"text","groupName":"contactinformation"}'

curl -X POST https://api.hubapi.com/crm/v3/properties/contacts \
  -H "Authorization: Bearer pat-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"subscription_mrr","label":"Subscription MRR (cents)","type":"number","fieldType":"number","groupName":"contactinformation"}'

curl -X POST https://api.hubapi.com/crm/v3/properties/contacts \
  -H "Authorization: Bearer pat-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"checkout_abandoned_at","label":"Checkout Abandoned At","type":"string","fieldType":"text","groupName":"contactinformation"}'
```

---

## Step 4: Build the Welcome Email Sequence in HubSpot

Once the sync is active, create this automation in HubSpot (Automation → Workflows):

| Trigger | Delay | Email Subject | Goal |
| :--- | :--- | :--- | :--- |
| Contact created (any) | Immediate | "Welcome to AI Integration Course — here's your first lesson" | Activation |
| `checkout_funnel_stage` = `checkout_abandoned` | 10 min | "You left something behind — your AI skills are waiting" | Recovery |
| `checkout_funnel_stage` = `checkout_abandoned` | 24 hrs | "Last chance: your founding member rate expires soon" | Recovery |
| `lifecyclestage` = `customer` | Day 3 | "How's Lesson 1 going? Here's what to do next" | Retention |
| `lifecyclestage` = `customer` | Day 30 | "Save 40% — switch to annual billing today" | Upsell |
| `lifecyclestage` = `churned` | Day 1 | "We noticed you cancelled — here's what you'll miss" | Win-back |

**Sender address for all emails:** `info@aiintegrationcourse.com`

---

## Estimated Activation Time

| Task | Time |
| :--- | :--- |
| Create HubSpot private app + copy token | 10 min |
| Add token to Firebase environment + deploy | 10 min |
| Create custom properties (5 curl commands) | 5 min |
| Build welcome sequence in HubSpot | 45 min |
| **Total** | **~70 minutes** |

---

## Verification

After activation, create a test lead via the exit-intent form on the homepage. Within 30 seconds, a new contact should appear in HubSpot with `checkout_funnel_stage: lead_captured`.
