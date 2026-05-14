# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Integration Course platform — an educational web app teaching AI integration for workflows and investments. Features structured courses with free/premium tiers, an AI tutor with RAG, Stripe subscriptions, and founding member access.

**Production**: https://aiintegrationcourse.com / https://ai-integra-course-v2.web.app
**Firebase Project ID**: ai-integra-course-v2

## Build & Development Commands

```bash
# Frontend
npm start                    # Dev server (includes --openssl-legacy-provider)
npm run build                # Production build
npm test                     # Vitest (jsdom environment, globals enabled)
npm run deploy               # Build + deploy Firebase Hosting

# Firebase Functions (run from functions/ directory)
cd functions && npm run build    # TypeScript compilation to lib/
npm run deploy:functions         # Deploy functions from root
firebase deploy --only functions # Alternative

# Environment
nvm use                      # Node 22.22.0 (.nvmrc)
```

**Note**: React Scripts requires `--openssl-legacy-provider` — this is already configured in package.json scripts.

## Architecture

### Frontend: React 19 + TypeScript + TailwindCSS (Create React App)

- **Routing**: React Router v6 in `src/App.tsx` (~25 routes)
- **Auth state**: `src/context/AuthContext.tsx` (Context API, Firebase Auth)
- **Data layer**: `src/firebaseService.ts` — all Firestore reads (courses → modules → lessons hierarchy)
- **Firebase client**: `src/firebase.ts` — bootstraps auth, Firestore, storage, analytics, App Check
- **Premium access**: Checked via `usePremiumAccess` hook — founding member OR premium OR active subscription OR trial period
- **Analytics**: `src/utils/analytics.ts` — GA4 (G-15SDDF1S5S) + Google Ads conversion tracking

### Backend: Firebase Cloud Functions (Node 22, TypeScript)

All functions exported from `functions/src/index.ts` with `maxInstances: 10`, region `us-central1`.

| File | Key exports |
|------|-------------|
| `tutor.ts` | AI tutor — OpenAI streaming + RAG (text-embedding-3-small, 900-char chunks) |
| `stripe.ts` | `createCheckoutSessionV2`, `stripeWebhookV2`, subscription lifecycle |
| `founding.ts` | Founding member codes, beta tester redemption |
| `churn.ts` | Churn risk detection, recovery emails |
| `beta-testing.ts` | GitHub/UserJot beta tester sync |
| `recaptcha.ts` | reCAPTCHA Enterprise verification |
| `adminLessons.ts` | Admin lesson CRUD |
| `leadMagnet.ts` | Lead capture handling |

**Secrets** (Firebase params): `OPENAI_API_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`

### Firestore Data Model

```
courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
  - Lessons have: tier ("free"|"premium"), isFree (boolean), videoUrl, content
  - Always query with orderBy('order') for consistent sorting

users/{userId}
  - premium, foundingMember, subscriptionStatus, trialEndsAt, role

stripe_customers/{userId}/checkout_sessions/{sessionId}
```

### Security Rules

`firestore.rules` enforces access control: free lessons are public-read, premium lessons require auth + active subscription/founding/beta status. `storage.rules` controls file access by path prefix (`/course_content/`, `/premium/`, `/users/{userId}/`).

## Testing

- **Framework**: Vitest with jsdom (NOT Jest)
- **Config**: `vitest.config.ts`, setup in `src/setupTests.ts`
- **Mocks**: `tests/__mocks__/` has Firebase and fetch mocks
- **Test files**: `src/App.test.tsx`, `tests/basic.test.ts`, `tests/tutor.spec.ts`

## Deployment

- **CI/CD**: GitHub Actions in `.github/workflows/` — auto-deploy hosting on push to main, preview on PRs
- **Frontend hosting**: Firebase Hosting (public dir: `build/`)
- **Functions**: Deployed separately via `npm run deploy:functions`
- **SPA routing**: Firebase rewrites all non-asset paths to `index.html`; `/api/tutor` rewrites to the `tutor` Cloud Function

## Key Patterns

- **Tier detection**: `tier === 'free'` maps to `isFree` boolean in the UI — keep both in sync
- **AI tutor streaming**: Uses Server-Sent Events; client component is `src/components/AITutor.tsx`
- **Model fallback**: Tutor tries specified model → gpt-4o-mini → gpt-3.5-turbo
- **Environment variables**: Frontend uses `REACT_APP_` prefix (see `.env.example`); functions use Firebase secrets
