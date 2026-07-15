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
      'Compare the Monthly, Annual, and Enterprise billing options for AI Integration Course. Free lessons stay open, and premium builds unlock immediately after purchase.',
    h1: 'Pricing',
    blurb:
      'Start with a 7-day $1 Pro trial — full curriculum, the Allie AI tutor, and the Forge sandbox. Free lessons stay open forever, and every paid plan carries a 14-day ship-or-refund guarantee.',
  },
  {
    path: '/about',
    title: 'About Blaine Casey — AI Integration Course Instructor',
    description:
      'Blaine Casey is an AI Solutions Architect and the instructor behind AI Integration Course. Learn about his verified industry experience, real client case studies, and the methodology behind practical AI automation training for marketing agencies, SaaS teams, and operators.',
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
      'Permanent guides for AI operators and developers: RAG for small business, function calling with Gemini, and model comparison workflows for automation teams.',
    h1: 'AI Integration Library',
    blurb:
      'Permanent reference guides: RAG for small business, function calling with Gemini, and model comparison workflows for automation teams.',
  },
  {
    path: '/solutions',
    title: 'AI Integration by Industry',
    description:
      'Industry-specific AI integration pages for real estate, e-commerce, and law firms. See where AI automation creates operational leverage without breaking review and quality controls.',
    h1: 'AI Integration by Industry',
    blurb:
      'Where AI automation creates operational leverage in real estate, e-commerce, and law firms — without breaking review and quality controls.',
  },
  {
    path: '/ai-workshops-san-diego',
    title: 'AI Workshops in San Diego',
    description:
      'AI integration training for San Diego and Southern California teams that want practical automation workflows, pilot planning, and implementation-focused education.',
    h1: 'AI Workshops in San Diego',
    blurb:
      'Hands-on AI integration training for San Diego and Southern California teams: practical automation workflows, pilot planning, and implementation-focused education.',
  },
  {
    path: '/start-trial',
    title: 'Start the $1 Pro Trial',
    description:
      '7 days of full access for $1: the complete AI integration curriculum, the Allie AI tutor, and the Forge sandbox. Cancel in two clicks, with a 14-day money-back guarantee on every paid plan.',
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
    // Auth/utility pages: prerendered only to carry noindex so Bing drops
    // them from the index; excluded from the sitemap (generate-sitemap.js).
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
    path: '/courses',
    title: 'AI Integration & Automation Mastery — Course Overview',
    description:
      'A practical, build-first curriculum for founders, operators, and developers: prompt and API orchestration, production RAG, multi-agent architectures, and low-code automation.',
    h1: 'AI Integration & Automation Mastery',
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
