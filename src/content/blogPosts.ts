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
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'cursor-vs-claude-code-vs-gemini-2026',
    title: 'Cursor vs Claude Code vs Gemini: How to Actually Ship Real Work with AI in 2026',
    eyebrow: 'Blog',
    description:
      'Stop guessing which AI coding tool is best. Here\'s the practical 2026 breakdown of Cursor, Claude Code, and Gemini — plus the exact stack top developers are using to ship real work.',
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
  },
  {
    slug: 'workflow-complete-guide',
    title: 'Workflow: The Complete Guide to Designing, Managing, and Optimizing Your Business Processes',
    eyebrow: 'Blog',
    description:
      'A practical guide to workflow design, workflow management systems, process optimization, and the operating patterns teams use to reduce errors and improve throughput.',
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
