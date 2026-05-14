# AI Integration & Bottom-of-Funnel Conversion Roadmap

## From Previous Discussions

### Thread 1: Website AI Integration Deep Dive

**Key Opportunities (Ranked by ROI):**

1. **RAG-Powered Personal AI Tutor 2.0**
   - Connect tutor to full curriculum + user progress
   - Tech: LangChain.js + Supabase pgvector

2. **Semantic Site Search + Lesson Recommender**
3. **AI Lesson Path Generator**
4. **AI Content Co-Pilot**
5. **Intelligent Support Chatbot**

**Recommended Stack:** Next.js + Supabase (auth + vector) + LangChain.js + Vercel AI SDK

### Thread 2: Bottom-of-Funnel Paid Subscriber Conversion

**Highest-ROI Levers:**
1. In-lesson AI Upsell Nudges
2. Post-Lesson 5 'Unlock Everything' Sequence
3. Personalized Progress Dashboard
4. AI Tutor Teaser (3 free queries)

## Immediate Next Actions
- Implement ProUpsellBar in free lessons
- Add AI Tutor query counter for free users
- Build personalized dashboard

See `components/ProUpsellBar.tsx` for example implementation.

**Target:** 18-25% free-to-paid conversion in 30 days.

---

## Idea #4: AI Certification Credential Feature ✅ Implemented

**Status:** Shipped — available at `/certification`

**Summary:**  
Pro and Enterprise (Corporate) tier subscribers can generate a verifiable certificate of completion for the *AI Integration Mastery* course. Certificates are persisted to Firestore and can be shared directly to LinkedIn.

**Features:**
- Protected route `/certification` — redirects unauthenticated users to `/login`
- Feature gate: only `pro`, `corporate`, and `founding` tier members can generate
- Professional certificate preview rendered in the browser (HTML/CSS)
- Print-to-PDF support via `window.print()` with dedicated print stylesheet
- Unique certificate ID (`AIC-<timestamp>-<uid-fragment>`) per user
- Firestore write: appends `CertRecord` to `users/{uid}.certs[]` via `arrayUnion`
- LinkedIn "Add to Profile" deep-link and embeddable badge HTML snippet
- GA4 analytics event: `certificate_generated` (cert_id, user_id, subscription_tier)
- "Get Certificate" button surfaced in `/profile` for eligible users

**Files changed:**
- `src/pages/CertificationPage.tsx` (new)
- `src/App.tsx` — adds `/certification` route
- `src/components/auth/ProfilePage.tsx` — adds "Get Certificate" button
- `src/firebaseService.ts` — adds `saveCertificate()` and `CertRecord` type
- `src/utils/analytics.ts` — adds `trackCertificateGenerated()`
- `ROADMAP-AI-INTEGRATION.md` — this entry