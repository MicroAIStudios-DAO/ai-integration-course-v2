export interface BlogPost {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  keywords: string[];
  readingTime: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  markdownPath: string;
  heroImage: string;
  // GEO/LLMO: optional FAQ pairs for structured data injection
  faqs?: { question: string; answer: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'api-based-ai-automation-guide',
    title: 'API-Based AI Automation: A Builder\'s Guide to Connecting Models to Real Systems',
    eyebrow: 'Guide',
    description:
      'API-based AI automation connects a hosted language model to your existing APIs and tools, enabling multi-step workflows that run unattended. This guide covers the trigger-model-tool-validate pattern, tool definition design, and the reliability decisions that separate a prototype from a production system.',
    summary:
      'API-based AI automation is not a single API call — it is a loop: trigger, model call, tool execution, output validation, and repeat. This guide explains the core pattern, how to write tool definitions the model will use correctly, common workflow shapes, and the error-handling decisions that keep automation running in production.',
    keywords: [
      'API-based AI automation',
      'AI automation API',
      'how to automate with AI',
      'AI workflow automation',
      'AI tool calling',
      'LLM API integration',
      'production AI automation',
      'AI agent API integration',
    ],
    readingTime: '10 min read',
    publishedTime: '2026-07-20T09:00:00-07:00',
    modifiedTime: '2026-07-20T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/api-based-ai-automation-guide.md',
    heroImage: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&q=80',
  },
  {
    slug: 'persistent-ai-memory-patterns',
    title: 'Persistent AI Memory Patterns: Giving Your Agents a Reliable Long-Term Memory',
    eyebrow: 'Guide',
    description:
      'LLMs forget everything between calls. Persistent AI memory is the engineering layer that fixes this — conversation buffers, semantic memory, entity stores, and episodic logs. Here is when to use each.',
    summary:
      'Persistent AI memory is not a feature you toggle on — it is a set of storage and retrieval patterns you design. This guide covers the four main patterns (conversation buffer, semantic memory, entity store, episodic log), how to combine them, and the reliability mistakes that break memory in production.',
    keywords: [
      'persistent AI memory',
      'AI agent memory',
      'LLM memory patterns',
      'semantic memory AI',
      'AI conversation memory',
      'long-term AI memory',
      'AI agent state management',
      'vector store memory',
    ],
    readingTime: '10 min read',
    publishedTime: '2026-07-17T09:00:00-07:00',
    modifiedTime: '2026-07-17T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/persistent-ai-memory-patterns.md',
    heroImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
  },
  {
    slug: 'ai-agents-for-small-business',
    title: 'AI Agents for Small Business: A Practical Builder\'s Guide',
    eyebrow: 'Guide',
    description:
      'AI agents for small business are not chatbots — they are autonomous loops that call tools, chain steps, and integrate with your existing systems. Here is how to build them reliably.',
    summary:
      'The value of AI agents for small business comes from integration, not intelligence: connecting model reasoning to your APIs, databases, and workflows. This guide covers the agent loop, five real use cases, and the failure modes that kill demos in production.',
    keywords: [
      'AI agents for small business',
      'how to build an AI agent',
      'AI automation for small business',
      'production AI agent',
      'AI agent use cases',
      'small business AI integration',
      'AI tools for small business owners',
    ],
    readingTime: '8 min read',
    publishedTime: '2026-07-15T09:00:00-07:00',
    modifiedTime: '2026-07-15T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/ai-agents-for-small-business.md',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
  },
  {
    slug: 'ai-workflow-error-handling-patterns',
    title: 'AI Workflow Error Handling Patterns: Retries, Fallbacks, and Resilience in Production',
    eyebrow: 'Guide',
    description:
      'AI workflows fail in ways traditional software does not. Learn the four patterns that keep production AI running: retries, validation, fallbacks, idempotency.',
    summary:
      'Most AI workflow failures look like success — a 200 with wrong JSON, a rate limit that kills a six-step chain at step three. Here are the four error-handling layers every production AI system needs.',
    keywords: [
      'AI workflow error handling',
      'AI retries fallbacks',
      'production AI reliability',
      'LLM error handling',
      'AI output validation',
      'AI workflow resilience',
      'exponential backoff AI',
    ],
    readingTime: '9 min read',
    publishedTime: '2026-07-14T09:00:00-07:00',
    modifiedTime: '2026-07-14T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/ai-workflow-error-handling-patterns.md',
    heroImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
  },
  {
    slug: 'ai-integration-architecture-reliable-workflows',
    title: 'AI Integration Architecture: A Systems-Engineering Guide to Reliable AI Workflows',
    eyebrow: 'Guide',
    description:
      'Reliable AI workflows come from systems engineering, not prompt tricks. Learn the five-layer architecture that keeps AI agents working after the demo.',
    summary:
      'Most AI projects demo well and fail in production. The fix is architecture, not a better prompt. Here are the five layers that make AI workflows reliable, with a concrete support-agent example.',
    keywords: [
      'AI integration architecture',
      'reliable AI workflows',
      'production AI agents',
      'AI systems engineering',
      'AI workflow error handling',
      'how to build reliable AI agents',
    ],
    readingTime: '9 min read',
    publishedTime: '2026-07-13T09:00:00-07:00',
    modifiedTime: '2026-07-13T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/ai-integration-architecture-reliable-workflows.md',
    heroImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  },
  {
    slug: 'rag-implementation-guide-production',
    title: 'RAG Implementation Guide: Retrieval-Augmented Generation That Works in Production',
    eyebrow: 'Guide',
    description:
      'A practical guide to production RAG: chunking, embeddings, retrieval quality, grounded prompting, evals, and the failure modes that make RAG unreliable.',
    summary:
      'RAG grounds an LLM in your own data. Done well it is a grounded expert; done poorly it is a confident liar with extra steps. Here are the four decisions that determine RAG quality.',
    keywords: [
      'RAG implementation',
      'retrieval augmented generation',
      'RAG tutorial',
      'production RAG',
      'vector search',
      'RAG chunking strategy',
      'how to build a RAG system',
    ],
    readingTime: '8 min read',
    publishedTime: '2026-07-13T09:00:00-07:00',
    modifiedTime: '2026-07-13T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/rag-implementation-guide-production.md',
    heroImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
  },
  {
    slug: 'cursor-vs-claude-code-vs-gemini-2026',
    title: 'Cursor vs Claude Code vs Gemini: How to Actually Ship Real Work with AI in 2026',
    eyebrow: 'Blog',
    description:
      'Stop guessing which AI coding tool is best. The practical 2026 breakdown of Cursor, Claude Code, and Gemini — and the stack developers use to ship real work.',
    summary:
      'The winners in 2026 aren\'t using one AI tool — they\'re running hybrid stacks. Here\'s the no-hype breakdown of Cursor, Claude Code, and Gemini, and how to combine them to ship real work faster.',
    keywords: [
      'best AI coding tool 2026',
      'Cursor vs Claude Code',
      'Claude Code vs Gemini',
      'AI coding stack 2026',
      'how to use AI for coding',
      'Cursor 3 review',
      'Claude Code review',
      'AI developer tools 2026',
    ],
    readingTime: '7 min read',
    publishedTime: '2026-05-18T09:00:00-07:00',
    modifiedTime: '2026-05-18T09:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/cursor-vs-claude-code-vs-gemini-2026.md',
    heroImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80',
    // GEO/LLMO: structured entity signals for AI search engines
    // FAQs are auto-extracted from markdown at render time via BlogPostPage
  },
  {
    slug: 'workflow-complete-guide',
    title: 'Workflow: The Complete Guide to Designing, Managing, and Optimizing Your Business Processes',
    eyebrow: 'Blog',
    description:
      'A practical guide to workflow design, workflow management systems, process optimization, and the patterns teams use to reduce errors and boost throughput.',
    summary:
      'Learn what workflows are, how they evolved, which workflow patterns matter in practice, and how to design cleaner operating systems for modern teams.',
    keywords: [
      'workflow guide',
      'workflow management',
      'workflow automation',
      'business process optimization',
      'workflow management systems',
    ],
    readingTime: '18 min read',
    publishedTime: '2026-03-24T12:00:00-07:00',
    modifiedTime: '2026-03-24T12:00:00-07:00',
    author: 'Blaine Casey',
    markdownPath: '/blogs/workflow-complete-guide.md',
    heroImage: 'https://images.surferseo.art/202e6d31-57ef-4083-a2b4-daff3a1a8e9d.jpg',
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((post) => post.slug === slug);
