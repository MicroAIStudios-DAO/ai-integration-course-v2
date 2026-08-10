// Crawler-visible body copy for the prerendered marketing pages.
//
// Every string below is MIRRORED VERBATIM from the visible copy of the page
// components (src/pages/NewLandingPage.tsx, PricingPage.tsx, AboutPage.tsx,
// SanDiegoAIPage.tsx, RoadmapActivationPage.tsx, ResourceLibraryPage.tsx,
// IndustrySolutionsPage.tsx) with brand constants resolved. If you change
// copy in a component, change it here too — scripts/verify-seo.mjs enforces
// per-route minimum text lengths so silent regressions fail the build.
//
// DO NOT add claims, testimonials, ratings, or outcomes that are not in the
// live components. Hedge labels ("Illustrative outcome", "Example project ·
// not a specific endorsement") are legally deliberate — keep them intact.
//
// Block shapes consumed by renderBlocks() in prerender-blogs.mjs:
//   {h2|h3|p: 'text'} | {ul: ['item', ...]} | {links: [['text', '/href'], ...]}

// ─── Homepage (/) — mirrors NewLandingPage.tsx ──────────────────────────────
export const homepageBlocks = [
  {
    p: 'No CS degree required, and no copy-paste prompt templates either. Start from your level and complete your first deployable automation in under 15 minutes.',
  },
  {
    links: [
      ['Start the $1 Pro trial', '/start-trial'],
      ['Get My Free Roadmap', '/roadmap'],
    ],
  },
  { h2: 'The Forge Developer Console' },
  {
    p: 'Live engineering sandbox environment. Gain immediate hands-on credentials. Execute script workflows, deploy live API servers, and monitor vector search recall in real-time.',
  },
  { h2: 'Taught by a Practicing Systems Engineer' },
  { h3: 'Blaine Casey — Lead AI Systems Architect' },
  {
    p: 'Former automation systems lead and full-stack software architect. Shipped 30+ production AI workflows and integrations.',
  },
  {
    p: '"We reject the prompt engineering gimmick. AI is not a writing exercise. It is a distributed network design challenge. Our goal is to train AI Architects who can build resilient, production-ready, fault-tolerant automations."',
  },
  {
    p: 'AI Integration Course is the premier, highly specialized training program of The Foundation for Applied Artificial Intelligence & Systems Design — the Academy established by practical systems engineers under Synconis Labs to close the gap that standard tutorial platforms leave open: rate-limiting, context window degradation, error fallbacks, and database integration in production.',
  },
  { h3: 'Real-World Case Material' },
  {
    p: 'Curriculums are based strictly on deployed production-grade code that has powered real revenue pipelines.',
  },
  { h3: 'Academic Rigor & Certifications' },
  {
    p: 'Earn permanent cryptography-backed completion badges as you finish the module project builds.',
  },
  { h2: 'A Superior Digital Campus Experience' },
  {
    p: 'We provide the tools, support, and framework required to bridge the gap between amateur prompt-writing and robust software engineering.',
  },
  { h3: 'Context-Aware AI Tutor' },
  {
    p: 'Never get stuck. Our specialized academic AI model is fine-tuned on the syllabus code repository. It reviews your workspace, answers queries, and helps you troubleshoot rate limits instantly.',
  },
  { h3: 'Deployable Module Projects' },
  {
    p: 'Every applied module ends in a working build you keep — an AI helpdesk, a deal underwriter, a strategy brief generator, a creative brief engine — plus the technical founders builds for persistent memory and search-grounded agents.',
  },
  { h3: 'Active Workspace Sandboxing' },
  {
    p: 'Test and execute script structures within our sandboxed environment directly on our serverless compute cluster. No heavy local setup blocks your engineering momentum.',
  },
  { h3: 'The Structural Paradigm Shift' },
  { p: 'Brittle Prompter Track:' },
  {
    ul: [
      '"Chatting" with models manually in separate chat boxes.',
      'Brittle copy-paste prompts that fail with mild input variance.',
      'Prone to rate-limiting and connection interruptions.',
      'Lack of persistent data storage or memory retention.',
    ],
  },
  { p: 'Systems Architect Track (The Foundation):' },
  {
    ul: [
      'API-first automation code executing programmatically.',
      'Fault-tolerant schemas that handle edge-cases gracefully.',
      'Dynamic error fallbacks, exponential backoffs, and retries.',
      'Vector databases and memory layers for permanent recall.',
    ],
  },
  { h2: 'Rigorous Curriculum Architecture' },
  {
    p: '7 modules, 52 lessons. Every applied module ends in a deployable project, and the free lessons stay open forever.',
  },
  { h3: 'Module 1: Foundations of AI Integration' },
  {
    p: '8 Lessons • 5 Free. Start here free: core AI concepts, defining the automation opportunity, and your first hands-on build with the open Content Architect founders lesson.',
  },
  { h3: 'Module 2: Building AI Products' },
  {
    p: '5 Lessons. From idea to working product — including the open Informed Architect founders build, where your agent grounds itself in live search results.',
  },
  { h3: 'Module 3: Advanced AI Techniques' },
  {
    p: '8 Lessons • 1 Project. Deeper technique work — persistent memory with vector databases (founders build) — capped by the Startup Validator + Experiment Planner project.',
  },
  { h3: 'Module 4: AI for Small Business' },
  {
    p: '8 Lessons • 1 Project. Customer service, marketing, operations, and tool selection for small teams, ending in the Small Business AI Helpdesk (FAQ + SOP assistant) project.',
  },
  { h3: 'Module 5: AI for Real Estate' },
  {
    p: '8 Lessons • 1 Project. Lead generation, valuation, marketing, and property management workflows, ending in the Real Estate Deal Underwriter + Listing Optimizer project.',
  },
  { h3: 'Module 6: AI for Executive Leadership' },
  {
    p: '6 Lessons • 1 Project. Strategic planning, operational excellence, and leadership decision-making with AI, ending in the Executive AI Strategy Brief Generator project.',
  },
  { h3: 'Module 7: AI and Creative Industries' },
  {
    p: '9 Lessons • 1 Project. Generative AI across visual arts, music, writing, film, and games, ending in the Creative Brief + Shot List Generator project.',
  },
  {
    ul: [
      '100% Practical Implementation',
      '7 Modules · Free Lessons Open',
      '14 Days Build Guarantee',
      '24/7 Contextual Workspace Help',
    ],
  },
  {
    // Hedge labels below are legally deliberate — never remove or soften.
    p: 'Illustrative outcome: "The program skips the superficial prompting guides and goes straight to systems. A representative build: a search-grounded content compiler that syncs to a CRM — replacing a recurring manual task that previously took several hours of engineering time each week." — Representative Cohort Build. Example project · not a specific endorsement.',
  },
  { h2: 'Admissions Are Now Open' },
  {
    p: 'Create a free student profile to immediately begin five baseline automation modules. When you are ready to master advanced multi-agent structures, transition to our premium tuition tiers.',
  },
  { h3: 'Pro Access — Self-Paced Membership' },
  {
    p: 'Full curriculum unlock, continuous workspace computations, contextual AI tutoring and verified cryptography credentials. $1 for a 7-day trial, then $29.99/month unless cancelled before day 8 — backed by our 14-Day Build Guarantee. Prefer annual? $239.88/year ($19.99/mo equivalent) saves $120.',
  },
];

// ─── /pricing — mirrors PricingPage.tsx (plan cards come from
//     src/config/pricing.ts at build time; FAQ from pricingFaqItems) ────────
export const pricingCopy = {
  hero: [
    {
      p: 'Build your first real AI workflow in under 10 minutes — even if you\'re not technical.',
    },
    {
      p: 'Instant access after checkout · 14-Day Build Guarantee · Cancel trial anytime before day 8.',
    },
  ],
  planNotes: {
    pro_trial: '7 days of full access, then $29.99/month unless cancelled before renewal. Cancel before day 8 in 2 clicks. No games.',
    explorer:
      'The full-price option. Best if you want maximum flexibility and the smallest commitment beyond the first payment. Free lessons and the first two founder builds stay open. Premium curriculum unlocks as soon as you subscribe.',
    pro: 'The launch rate. Save $120/year compared to monthly billing and lock in $19.99/mo for 12 months. $239.88/year — billed annually. Premium builds unlock immediately after purchase.',
    corporate:
      'The team rate. Best for B2B clients who need multiple seats, shared standards, and a lower per-seat cost than individual billing. $14.99 per seat · 5-seat minimum.',
  },
  afterPlans: [
    { h2: 'Copy. Paste. Customize. Ship.' },
    {
      p: 'The hardest part for cold traffic is believing they can actually do this. So the first lessons are designed to prove it fast: open the guided environment, paste the starter script, swap in your business context, and run a real workflow.',
    },
    {
      ul: [
        'Step 1 — Copy the starter script. No blank file. No architecture guesswork. The lesson starts with working code.',
        'Step 2 — Swap in your prompt and API key. You are customizing a real template, not learning syntax from scratch.',
        'Step 3 — Run the workflow and keep it. The goal is a deployed business asset, not finishing another theory lesson.',
      ],
    },
    {
      p: 'This is the point: you are not staring at a blank editor wondering what Python experts know that you do not. You are starting from a guided, working pattern and learning by shipping.',
    },
    { h2: '14-Day Build Guarantee' },
    {
      p: 'Build your first working AI Agent in 14 days, or we refund every penny. You keep the source code. Outcome-based, time-bound, and risk-free. We only win when you ship.',
    },
  ],
  objections: [
    { h2: 'What usually stops people from starting' },
    {
      p: '"I\'m not technical." — You do not need to be technical to start. The path is built to get you moving with guided, practical steps — not coding or heavy theory.',
    },
    {
      p: '"I don\'t have time." — Your first useful win should take minutes, not days. Most lessons are intentionally short and built for real schedules.',
    },
    {
      p: '"What if it\'s not worth it?" — That\'s exactly why the guarantee exists. If you don\'t build something useful in 14 days, you get your money back.',
    },
  ],
};

// ─── /about — mirrors AboutPage.tsx ─────────────────────────────────────────
export const aboutBlocks = [
  {
    p: 'AI Solutions Architect · Founder, Synconis Labs · San Diego, CA. Google Cloud Certified · Firebase App Developer · Gemini API Practitioner · 10+ Years Software Engineering · Shipped 30+ AI Workflows.',
  },
  {
    p: 'Blaine Casey has spent over a decade building software systems that ship — not decks that impress. He founded Synconis Labs to close the gap between AI hype and real operational leverage for founders, operators, and developers who need results in weeks, not quarters.',
  },
  {
    p: 'His methodology is implementation-first: identify the workflow, define the tool contract, add human review checkpoints, then deploy something that earns its keep. Every lesson in AI Integration Course is drawn from a real client engagement or internal build — not recycled YouTube content.',
  },
  { h2: 'Why AI Integration Course exists' },
  {
    p: 'Most AI education teaches you how tools work. This course teaches you how to make them work for your specific operation. The curriculum was built backwards from the question: "What does a founder or operator need to deploy in the next 14 days to get a measurable return?" Every module answers that question with a concrete build path, not a lecture.',
  },
  {
    p: 'The platform is also built to stay current. AI tooling evolves monthly. The curriculum is reviewed and updated on the same cadence, and every lesson notes the last-updated date so you always know you are learning against the current state of the ecosystem — not a snapshot from 18 months ago.',
  },
  { h2: 'Client outcomes from real engagements' },
  {
    p: 'The following results are drawn from real engagements, as reported within those projects. Industry and company names are anonymised at client request.',
  },
  { h3: 'Marketing Agency — Client Onboarding Automation' },
  {
    p: 'Reduced manual onboarding time from 4 hours to 22 minutes using a Gemini-powered intake bot and Zapier workflow.',
  },
  { h3: 'E-Commerce Brand — Customer Service Email Bot' },
  {
    p: 'Automated a large share of tier-1 support email responses with a fine-tuned bot, freeing 15+ hours per week for a 3-person team.',
  },
  { h3: 'SaaS Startup — AI Readiness Assessment' },
  {
    p: 'Delivered a structured AI readiness report identifying 6 automatable workflows, prioritised by ROI, in a single sprint.',
  },
  { h3: 'Implementation-First' },
  {
    p: 'Every lesson ends with a deployable artefact — a bot, a workflow, a prompt template, or a checklist — not a quiz.',
  },
  { h3: 'Specific Tooling' },
  {
    p: 'Gemini API, Firebase, Zapier, OpenAI, and n8n. No vague "use AI" advice. Exact tool contracts and code snippets.',
  },
  { h3: 'Always Updated' },
  {
    p: 'Curriculum reviewed monthly. Each lesson shows its last-updated date. You will never pay for stale content.',
  },
  { h2: 'Ready to build your first AI automation?' },
  {
    p: 'Join founders, operators, and developers building real AI workflows with a structured, build-first path. 14-Day Build Guarantee.',
  },
  {
    links: [
      ['See the course plan', '/pricing'],
      ['Browse free lessons', '/courses'],
    ],
  },
];

// ─── /ai-workshops-san-diego — mirrors SanDiegoAIPage.tsx ───────────────────
export const sanDiegoBlocks = [
  {
    p: 'If your team is based in San Diego or Southern California and you want practical AI integration training, the course is structured around the exact gap most teams have: they know the tools exist, but they do not have a reliable rollout path.',
  },
  { h2: 'Operational Focus' },
  {
    p: 'Map one repetitive workflow, define the automation boundary, and build a version the team can actually review and trust.',
  },
  { h2: 'Team Enablement' },
  {
    p: 'Useful for founders, ops leads, and technical builders who need a shared implementation language instead of abstract AI hype.',
  },
  { h2: 'Pilot Mindset' },
  {
    p: 'The emphasis is on one controlled pilot first, then expansion only after the workflow proves itself on speed, quality, and review coverage.',
  },
  { h2: 'Suggested entry points' },
  {
    ul: [
      'Read the resource library to choose the right workflow model.',
      'Use the industry pages to see the safest first pilot for your team.',
      'Move into the paid curriculum when the team is ready to build.',
    ],
  },
  {
    links: [
      ['Explore industry pages', '/solutions'],
      ['Compare plans', '/pricing'],
    ],
  },
];

// ─── /roadmap — mirrors RoadmapActivationPage.tsx (default step only; the
//     quiz steps are interaction-gated and not part of the initial render) ──
export const roadmapBlocks = [
  {
    p: 'Free · No card · About 2 minutes. Answer four quick questions — what best describes you, what you most want to build first, how technical you are, and what you are building it for — and get a concrete plan: which track fits you, the exact first agent to build, and a day-by-day week one.',
  },
  {
    p: 'Seven days of full access to build exactly this. $1 today, then $29.99/month unless you cancel before day 8 — backed by the 14-Day Build Guarantee.',
  },
  {
    links: [
      ['Start the $1 Pro trial', '/start-trial'],
      ['Compare plans', '/pricing'],
    ],
  },
];

export const pageBodies = {
  '/': homepageBlocks,
  '/about': aboutBlocks,
  '/ai-workshops-san-diego': sanDiegoBlocks,
  '/roadmap': roadmapBlocks,
};
