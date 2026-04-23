# Project Guidelines

AI Integration Course — educational platform (React 19 + Firebase) with AI tutoring, premium subscriptions, and structured learning paths.

**Firebase Project ID**: `ai-integra-course-v2`
**Production**: https://aiintegrationcourse.com

## Build and Test

```bash
nvm use                            # Node 22 (.nvmrc)
npm run install:all                # Install root + functions deps
npm start                          # React dev server (includes --openssl-legacy-provider)
npm run build                      # Production build via scripts/run-build.js
npm test                           # Vitest (NOT Jest) — jsdom environment, globals enabled

# Deployment — use specific commands, NOT generic `firebase deploy`
npm run deploy                     # Build + deploy Firebase Hosting only
npm run deploy:functions           # Build + deploy Cloud Functions
npm run deploy:prod                # Full production: clean, install, build, deploy all

# Functions (from functions/ directory)
cd functions && npm run build      # TypeScript → lib/
```

## Architecture

**Frontend**: Create React App + React Router v6 + TailwindCSS. NOT Next.js.
**Backend**: Firebase Cloud Functions (TypeScript, Node 22, `us-central1`).
**Only root React app + Cloud Functions are production-deployed.** Directories `api/`, `allie/`, `backend/` are inactive/experimental.

### Key Files
| Purpose | File |
|---------|------|
| All Firestore reads | `src/firebaseService.ts` |
| Auth state (Context API) | `src/context/AuthContext.tsx` |
| Firebase bootstrap | `src/firebase.ts` |
| AI tutor UI | `src/components/AITutor.tsx` |
| Cloud Functions entry | `functions/src/index.ts` |
| Routes (~25) | `src/App.tsx` |
| Premium access hook | `src/hooks/usePremiumAccess` |

### Firestore Data Model
```
courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
```
- Always query with `orderBy('order')` for consistent sorting
- Lessons have `tier: "free"|"premium"` in Firestore → mapped to `isFree: boolean` in UI via `firebaseService.ts`
- Keep both `tier` and `isFree` in sync when modifying lesson data

### Cloud Functions (functions/src/)
All exported from `index.ts` with `maxInstances: 10`. Key modules: `tutor.ts` (OpenAI streaming + RAG), `stripe.ts` (subscriptions), `founding.ts` (founding member codes), `churn.ts` (retention), `adminLessons.ts`, `email.ts`, `leadMagnet.ts`.

### AI Tutor RAG Pipeline
- Chunking: 900-char chunks, 100-char overlap
- Embeddings: `text-embedding-3-small`
- Streaming: Server-Sent Events
- Model fallback: specified model → `gpt-4o-mini` → `gpt-3.5-turbo`
- `/api/tutor` path rewrites to the `tutor` Cloud Function (configured in `firebase.json`)

## Conventions

- **Styling**: TailwindCSS utility classes. Custom fonts: Open Sans (body), Montserrat (headings)
- **State**: `useState` for local, Context API for global (auth/user). No Redux
- **Env vars**: Frontend uses `REACT_APP_*` prefix; functions use Firebase secrets/params — don't mix
- **Premium access**: Checked via `usePremiumAccess` hook — founding member OR premium OR active subscription OR trial
- **Components**: Default-exported function components with typed Props interfaces

## Gotchas

- **`--openssl-legacy-provider`** is required by React Scripts on Node 18+ — already wired into `npm start` and `npm run build`
- **Build output goes to `build/`** but Firebase Hosting serves from `public/` — `scripts/prepare-hosting.cjs` syncs them
- **Node version mismatch**: `.nvmrc` = 22, `package.json` engines = `>=20 <21`, CI uses Node 20. Use Node 22 locally
- **Two install targets**: `npm run install:all` handles both root and `functions/` — they have separate `node_modules`
- **Firebase predeploy** auto-runs `npm --prefix functions run build` — ensure TypeScript compiles clean before deploy
- **Security rules**: `firestore.rules` (active), `premium_rules.rules` (reference), `storage.rules`

## Detailed Documentation

Architecture deep dive → `ARCHITECTURE_REVIEW.md`
Contribution workflow → `CONTRIBUTING.md`
AI tutor spec → `ai_tutor_spec.md`, `AI_TUTOR_IMPLEMENTATION.md`
Firebase optimization → `FIREBASE_OPTIMIZATION_GUIDE.md`
Deployment procedures → `BUILD_DEPLOYMENT_GUIDE.md`, `PRODUCTION_DEPLOYMENT.md`
Lesson content management → `LESSON_CONTENT_GUIDE.md`
Claude Code instructions → `CLAUDE.md`