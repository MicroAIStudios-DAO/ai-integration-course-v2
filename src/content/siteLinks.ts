/**
 * Single source of truth for global navigation and footer links.
 *
 * Consumed by BOTH:
 *   - the React chrome (SiteHeader.tsx / SiteFooter.tsx), and
 *   - the prerender pipeline (scripts/prerender-blogs.mjs via blog-data.mjs),
 * so the links crawlers see in raw HTML are exactly the links users see.
 *
 * The footer deliberately links every page the Jul 2026 Ahrefs audit found
 * orphaned (/about, /contact, /privacy, /terms, /start-trial, /faq, /roadmap,
 * /ai-workshops-san-diego, all /library/* and /solutions/* leaves, /blogs).
 * Anchor text is descriptive on purpose — generic "Home" / bare brand-name
 * anchors were an audit finding. Keep labels keyword-relevant when editing.
 *
 * MUST stay a pure-data module (no imports): the build scripts load it with
 * an isolated TS transpile that cannot resolve dependencies.
 */

export interface SiteLink {
  label: string;
  to: string;
}

export const headerNavLinks: SiteLink[] = [
  { label: 'Curriculum', to: '/courses' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Library', to: '/library' },
  { label: 'Blog', to: '/blogs' },
  { label: 'About', to: '/about' },
];

export const headerLoginLink: SiteLink = { label: 'Student Login', to: '/login' };
export const headerTrialLink: SiteLink = { label: 'Start $1 Trial', to: '/start-trial' };

export const footerColumns: { heading: string; links: SiteLink[] }[] = [
  {
    heading: 'Learn',
    links: [
      { label: 'AI curriculum & free lessons', to: '/courses' },
      { label: 'Pricing & plans', to: '/pricing' },
      { label: 'Start the $1 Pro trial', to: '/start-trial' },
      { label: 'Free AI integration roadmap', to: '/roadmap' },
      { label: 'Frequently asked questions', to: '/faq' },
    ],
  },
  {
    heading: 'Guides & articles',
    links: [
      { label: 'AI workflow blog', to: '/blogs' },
      { label: 'RAG for small business', to: '/library/rag-for-small-business' },
      { label: 'Function calling with Gemini', to: '/library/function-calling-with-gemini-1-5-pro' },
      { label: 'OpenAI vs Anthropic for automation', to: '/library/openai-vs-anthropic-for-automation' },
      { label: 'AI integration library', to: '/library' },
    ],
  },
  {
    heading: 'Industries & workshops',
    links: [
      { label: 'AI for real estate teams', to: '/solutions/real-estate' },
      { label: 'AI for e-commerce operators', to: '/solutions/e-commerce' },
      { label: 'AI for law firms', to: '/solutions/law-firms' },
      { label: 'AI integration by industry', to: '/solutions' },
      { label: 'AI workshops in San Diego', to: '/ai-workshops-san-diego' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About the instructor', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Student login', to: '/login' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
];

export const footerAiDisclosure =
  '⚠️ This platform uses AI systems for personalized tutoring and content recommendations. AI-generated responses are provided for educational assistance and should be verified independently.';
