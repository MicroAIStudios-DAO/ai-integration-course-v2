# Architecture Review — AI Integration Course

_Last updated: 2025-10-15_

## Framework Identification

- **Primary production frontend:** Create React App (CRA) with React Router v6. The root `package.json` pins `react-scripts` for CRA builds and lists `react-router-dom` as the routing library, matching the React Router option from the comparison list. 
- **Rendering entry point:** `src/index.tsx` bootstraps the SPA through `ReactDOM.createRoot`, wrapping the router-driven `App` component in the global auth provider. 
- **Backend runtime:** Firebase Cloud Functions written in TypeScript and pinned to Node.js 20. `functions/package.json` declares the runtime, and the project uses Firebase Hosting/Firestore/Storage integrations. 
- **Additional surfaces:** A Next.js App Router marketing prototype lives in `/web`, and a lightweight Python API exists in `/backend`, but neither is wired into the Firebase hosting build pipeline (`npm run build:production` + `scripts/prepare-hosting.cjs`). 

## Frontend Structure Overview

- `src/pages/` contains routed screens such as landing, course overview, lesson reader, tutor chat, learning pathways, and auth pages. 
- `src/components/` holds reusable layout, UI, and auth widgets consumed across routes. 
- `src/context/AuthContext.tsx` (imported via barrel) provides authentication state, ensuring protected routes can read Firebase session data. 
- `src/firebase.ts` wraps Firebase client initialization; `src/firebaseService.ts` offers Firestore helpers for course/lesson data. 
- `public/` carries static assets (lesson markdown, env injector). After each build the `prepare-hosting` script syncs CRA output to `public/` while preserving curated assets for Firebase Hosting deploys. 

### Build Verification

- `npm run build:production` produces an optimized CRA bundle (~264 kB main JS) confirming the React Router application builds cleanly under Node.js 20. 
- `scripts/prepare-hosting.cjs` copies the build artifacts into `public/`, the directory referenced by `firebase.json`, maintaining lesson assets required at runtime. 

## Backend and Services

- `functions/src/tutor.ts` implements the AI tutor Cloud Function with OpenAI streaming, Firestore lesson retrieval, embedding caching in Cloud Storage, and strict method guards. 
- `functions/src/stripe.ts` (callable handlers) and `functions/src/index.ts` register exported triggers; the Firebase CLI builds with TypeScript via `npm run build`. 
- `firestore_migrate.js` and `scripts/*.cjs` provide administrative utilities for lesson normalization and access control. 
- Python utilities in `/backend` expose auxiliary AI endpoints but are not part of the Firebase deployment flow. 

## Node.js Version Alignment

- Root `package.json` enforces `>=20.0.0 <21.0.0` and `.nvmrc` specifies `20.x`, aligning local tooling with the required runtime. 
- Cloud Functions explicitly declare `"node": "20"` ensuring the deployed backend never falls back to Node 18. 
- Launch documentation updated to require Node 20 LTS and npm 10+, removing the outdated Node 18 guidance. 

## Deployment Flow Summary

1. Install dependencies (`npm install`, `cd functions && npm install`).
2. Build the CRA frontend (`npm run build:production`).
3. Sync build to hosting assets (`npm run prepare:hosting`).
4. Deploy via Firebase CLI (`firebase deploy` or targeted `--only` flags).
5. Post-deploy verification uses gcloud/Firebase checks per deployment guides. 

This audit confirms the production app corresponds to the **React Router** stack (not Next.js or Expo) and that both frontend and backend deploy paths are aligned on Node.js 20 as required.
