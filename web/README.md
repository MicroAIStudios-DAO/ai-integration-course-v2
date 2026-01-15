# Allie Web (Next.js)

Features
- Lists free and premium lessons from monorepo `lessons/manifest.json`.
- Renders Markdown; shows embedded YouTube if `videoId` present.
- Firebase Auth (Google) with Firestore premium gating.
- Stripe checkout via Firebase callable `createCheckoutSession`.

Setup
- Copy `.env.local.example` to `.env.local` and fill Firebase config, Functions origin, and `NEXT_PUBLIC_STRIPE_PRICE_ID`.
- Install deps: `npm install` (in `web/`).
- Dev: `npm run dev` then open http://localhost:3000.

Notes
- Premium lesson content is gated client-side; for stronger protection, store premium content in Firestore and fetch after verifying premium.
- Update `lessons/manifest.json` with real `videoId` for each lesson as videos are produced.

