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