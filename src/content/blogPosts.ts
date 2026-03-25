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
