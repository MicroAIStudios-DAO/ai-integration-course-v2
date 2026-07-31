// Per-route metadata for prerendering the static marketing pages.
//
// The title/description values MUST mirror the <SEO> props each page
// component passes at runtime (src/pages/*.tsx) so crawlers and hydrated
// React agree. If you change a page's SEO props, update it here too.
// h1/blurb are the crawler-visible body copy injected into #root; React
// replaces them on hydration.

export const staticRoutes = [
  {
    path: '/pricing',
    title: 'Pricing',
    description:
      'Compare Monthly, Annual, and Enterprise plans for AI Integration Course. Free lessons stay open; premium builds unlock immediately after purchase.',
    h1: 'Pricing',
    blurb:
      'Start with a 7-day $1 Pro trial — full curriculum, the Allie AI tutor, and the Forge sandbox. Free lessons stay open forever, and every paid plan carries a 14-day ship-or-refund guarantee.',
  },
  {
    path: '/about',
    title: 'About Blaine Casey',
    description:
      'Blaine Casey is an AI Solutions Architect and the instructor behind AI Integration Course — practical AI automation training built on real client work.',
    h1: 'About Blaine Casey',
    blurb:
      'AI Solutions Architect and instructor of the AI Integration Course — practical AI automation training built on real client implementations for marketing agencies, SaaS teams, and operators.',
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions',
    description:
      'Answers to common questions about Gemini API integration, AI automation, non-coder workflows, and what you build inside AI Integration Course.',
    h1: 'Frequently Asked Questions',
    blurb:
      'Common questions about Gemini API integration, AI automation, non-coder workflows, the $1 Pro trial, and what you actually build inside the course.',
    // Injects the same Q&A FAQPage.tsx renders (homepageFaqItems) as visible
    // body content + FAQPage JSON-LD.
    includeFaqs: true,
  },
  {
    path: '/contact',
    title: 'Contact',
    description:
      'Contact AI Integration Course for support, launch questions, and implementation-focused training inquiries.',
    h1: 'Contact AI Integration Course',
    blurb:
      'Reach out for support, launch questions, corporate training, and implementation-focused inquiries.',
  },
  {
    path: '/blogs',
    title: 'AI Workflow Blog',
    description:
      'Blog posts on workflow automation, AI operating systems, and practical implementation patterns for business operators and developers.',
    h1: 'AI Workflow Blog',
    blurb:
      'Guides on workflow automation, production RAG, multi-agent architecture, and practical implementation patterns for operators and developers.',
    listBlogPosts: true,
  },
  {
    path: '/library',
    title: 'AI Integration Library',
    description:
      'Permanent guides for AI operators and developers: RAG for small business, function calling with Gemini, and model comparison for automation teams.',
    // h1/blurb mirror ResourceLibraryPage.tsx so raw and hydrated HTML agree.
    h1: 'Long-tail guides for business owners and developers building with AI',
    blurb:
      'This library is built for the two audiences that matter most to AI integration: the operator looking for a practical business outcome and the developer looking for a stable implementation path.',
  },
  {
    path: '/solutions',
    title: 'AI Integration by Industry',
    description:
      'Industry-specific AI integration for real estate, e-commerce, and law firms — where automation creates leverage without breaking quality controls.',
    // h1/blurb mirror IndustrySolutionsPage.tsx so raw and hydrated HTML agree.
    h1: 'AI integration patterns for real businesses',
    blurb:
      'These pages are built for high-intent searchers who already know the business context. Each page maps common workflow pain, the safest first automation pilot, and the rollout logic the course teaches.',
  },
  {
    path: '/ai-workshops-san-diego',
    title: 'AI Workshops in San Diego',
    description:
      'AI integration training for San Diego and Southern California teams: practical automation workflows, pilot planning, and hands-on implementation.',
    h1: 'AI Workshops in San Diego',
    blurb:
      'Hands-on AI integration training for San Diego and Southern California teams: practical automation workflows, pilot planning, and implementation-focused education.',
  },
  {
    path: '/roadmap',
    title: 'Free AI Integration Roadmap',
    description:
      'Answer four quick questions and get a personalized AI integration roadmap: the track that fits you, the first agent to build, and a day-by-day week one.',
    h1: 'Get your personalized AI integration roadmap',
    blurb:
      'Answer four quick questions and get a concrete plan: which track fits you, the exact first agent to build, and a day-by-day week one — the systems-first way, not prompt tips. Free, no card, about 2 minutes.',
  },
  {
    path: '/start-trial',
    title: 'Start the $1 Pro Trial',
    description:
      'Get 7 days of full access for $1 — complete curriculum, the Allie AI tutor, and the Forge sandbox. Cancel in two clicks; 14-day money-back guarantee.',
    h1: 'Start the $1 Pro Trial',
    blurb:
      'Seven days of full access for $1 — complete curriculum, the Allie AI tutor, and the Forge sandbox. Cancel anytime in two clicks. Every paid plan includes a 14-day ship-or-refund guarantee.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      'How AI Integration Course collects, uses, and protects your data, including account information, analytics, and payment processing.',
    h1: 'Privacy Policy',
    blurb:
      'How AI Integration Course collects, uses, and protects your data, including account information, analytics, and payment processing.',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description:
      'The Terms of Service that govern your use of the AI Integration Course website, courses, tools, and related services, and how to contact us with questions.',
    h1: 'Terms of Service',
    blurb:
      'These Terms of Service govern your use of AI Integration Course, including our website, courses, tools, and related services.',
  },
  {
    // Pre-checkout lead capture. Prerendered so it stops inheriting the
    // homepage title/meta from app-shell.html, but noindexed (nofollow —
    // it's a dead-end utility page) and excluded from the sitemap.
    path: '/checkout/start',
    title: 'Secure Checkout',
    description:
      'Enter your email to continue to secure Stripe checkout for your selected AI Integration Course plan.',
    h1: 'Start your checkout',
    blurb:
      'Enter your email to continue to secure Stripe checkout for your selected AI Integration Course plan. Payments are processed by Stripe.',
    robots: 'noindex, nofollow',
    omitCanonical: true,
  },
  {
    // Auth/utility pages: prerendered only to carry noindex so Bing drops
    // them from the index; excluded from the sitemap (generate-sitemap.mjs).
    path: '/login',
    title: 'Log In',
    description: 'Log in to your AI Integration Course account.',
    h1: 'Log In',
    blurb: 'Log in to your AI Integration Course account.',
    noindex: true,
  },
  {
    path: '/signup',
    title: 'Sign Up',
    description: 'Create your AI Integration Course account.',
    h1: 'Sign Up',
    blurb: 'Create your AI Integration Course account.',
    noindex: true,
  },
  {
    // Title/H1 mirror the live Firestore course title ("AI Integration
    // Course") so raw HTML and the hydrated page agree; seoTitle avoids the
    // degenerate "AI Integration Course | AI Integration Course" tag.
    path: '/courses',
    title: 'AI Integration Course',
    seoTitle: 'AI Integration Course: Build-First AI Curriculum',
    description:
      'The build-first AI curriculum: prompt engineering, API orchestration, production RAG, multi-agent systems, and low-code automation with n8n and Zapier.',
    h1: 'AI Integration Course',
    blurb:
      'The build-first curriculum: prompt engineering and API orchestration, retrieval-augmented generation, multi-agent architectures, low-code automation with n8n/Make/Zapier, and AI business strategy.',
  },
];

// Homepage body copy (index.html keeps its own hand-written meta + Course
// JSON-LD; we only inject crawler-visible content into #root).
export const homepage = {
  h1: 'Build AI Workflows That Actually Work',
  blurb:
    'The hands-on curriculum for developers and technical founders who need to ship reliable, production-grade AI agents — not brittle prompt demos. Master fault-tolerant agent architectures, production environments, and API-first design.',
};
