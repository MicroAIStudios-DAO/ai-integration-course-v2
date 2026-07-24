# Circle.so Community Setup Guide

## AI Integration Course — Community Integration

This document outlines the complete setup for integrating Circle.so as the community platform for the AI Integration Course.

---

## 1. Create the Circle.so Community

1. Go to [circle.so](https://circle.so) and sign up for a **Business plan** (required for Headless API + SSO)
2. Create a new community named: **AI Integration Course Community**
3. Set the custom domain: `community.aiintegrationcourse.com`

### DNS Configuration (GoDaddy)

Add a CNAME record:
```
Type: CNAME
Name: community
Value: custom.circle.so
TTL: 600
```

---

## 2. Create Spaces (Tier-Gated)

Create the following spaces in your Circle community:

| Space Slug | Space Name | Access Tier |
|---|---|---|
| `community` | General Community | Free |
| `introductions` | Introductions | Free |
| `explorer-cohort` | Explorer Cohort | Explorer+ |
| `weekly-challenges` | Weekly Challenges | Explorer+ |
| `pro-architects` | Pro Architects | Pro+ |
| `governance-lab` | Governance Lab | Pro+ |
| `office-hours` | Office Hours | Pro+ |
| `corporate-strategy` | Corporate Strategy | Corporate |
| `enterprise-governance` | Enterprise Governance | Corporate |
| `executive-roundtable` | Executive Roundtable | Corporate |

---

## 3. Generate API Tokens

Go to **Developers → Tokens** in your Circle admin:

### Token 1: Admin v2 (for backend operations)
- **Type:** Admin v2
- **Name:** `ai-course-backend`
- **Used for:** `circleSyncMember`, `circleGetSpaces`

### Token 2: Headless Auth (for SSO)
- **Type:** Headless Auth
- **Name:** `ai-course-sso`
- **Used for:** `circleSSO` function (generates member JWT tokens)

---

## 4. Configure Firebase Functions Secrets

Run these commands to set the secrets for the deployed functions:

```bash
# Set the Admin API token (for managing members/spaces)
firebase functions:secrets:set CIRCLE_API_TOKEN --project ai-integra-course-v2

# Set the Headless Auth token (for SSO JWT generation)
firebase functions:secrets:set CIRCLE_SSO_KEY --project ai-integra-course-v2

# Set the Community ID (found in Circle admin → Settings → General)
firebase functions:secrets:set CIRCLE_COMMUNITY_ID --project ai-integra-course-v2
```

Alternatively, set them as environment config:

```bash
firebase functions:config:set \
  circle.api_token="YOUR_ADMIN_V2_TOKEN" \
  circle.sso_key="YOUR_HEADLESS_AUTH_TOKEN" \
  circle.community_id="YOUR_COMMUNITY_ID" \
  --project ai-integra-course-v2
```

---

## 5. SSO Flow (How It Works)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Student logs   │────▶│  circleSSO function   │────▶│  Circle.so  │
│  into Firebase  │     │  (Firebase → Circle)  │     │  community  │
│  Auth           │     │                        │     │             │
└─────────────────┘     └──────────────────────┘     └─────────────┘
                              │
                              │ 1. Receives Firebase UID
                              │ 2. Looks up user tier in Firestore
                              │ 3. Calls Circle Headless Auth API
                              │ 4. Returns JWT access_token
                              │ 5. Frontend uses token to embed Circle
                              ▼
```

The `circleSSO` function:
1. Verifies the Firebase Auth token
2. Reads the user's subscription tier from Firestore (`users/{uid}.tier`)
3. Calls `POST https://app.circle.so/api/v1/headless/auth_token` with the user's email
4. Returns the Circle JWT to the frontend
5. Frontend uses the JWT to authenticate Circle embeds

---

## 6. Embed Configuration

The `CircleDiscussion` component accepts:
- `spaceSlug` — which space to show discussions from
- `lessonId` — optional, for lesson-specific threads

The `CommunityPage` shows all accessible spaces based on the user's tier.

---

## 7. CSP Headers (Already Configured)

The following have been added to `firebase.json` CSP:
```
frame-src: https://community.aiintegrationcourse.com https://*.circle.so
```

---

## 8. Firestore Trigger: Auto-Sync on Tier Change

The `circleSyncMember` function fires on Firestore writes to `users/{uid}`:
- When `tier` field changes, it updates the member's Circle space group memberships
- Ensures students gain/lose access to spaces immediately on plan change

---

## Quick Checklist

- [ ] Create Circle.so Business account
- [ ] Create community with custom domain
- [ ] Add CNAME DNS record at GoDaddy
- [ ] Create all 10 spaces listed above
- [ ] Generate Admin v2 API token
- [ ] Generate Headless Auth API token
- [ ] Note the Community ID from settings
- [ ] Set Firebase secrets (3 values)
- [ ] Deploy functions (via GitHub Actions push to main)
- [ ] Test SSO flow with a test user
