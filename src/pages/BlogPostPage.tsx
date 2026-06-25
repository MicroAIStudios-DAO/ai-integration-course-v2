import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { getBlogPostBySlug } from '../content/blogPosts';
import '../styles/blog-content.css';

// Defer the markdown rendering stack to an async chunk — it only loads once an
// article body actually renders, keeping it out of the initial bundle.
const LazyMarkdown = lazy(() => import('../components/common/LazyMarkdown'));

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const normalizeQuotedMarkdownExport = (markdown: string): string => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const quotedLines = nonEmptyLines.filter((line) => line.startsWith('>'));

  if (nonEmptyLines.length === 0 || quotedLines.length / nonEmptyLines.length < 0.8) {
    return markdown.trim();
  }

  return lines
    .map((line) => {
      if (line === '>') return '';
      if (line.startsWith('> ')) return line.slice(2);
      if (line.startsWith('>')) return line.slice(1);
      return line;
    })
    .join('\n')
    .trim();
};

/**
 * Extract FAQ pairs from markdown content.
 * Looks for lines starting with "**Q:" and the following "**A:" or paragraph.
 * Also handles the "## Frequently Asked Questions" section pattern.
 */
const extractFAQs = (markdown: string): { question: string; answer: string }[] => {
  const faqs: { question: string; answer: string }[] = [];
  // Match bold Q/A pattern: **Q: ...** and following paragraph
  const qPattern = /\*\*Q:\s*([^*]+)\*\*/g;
  const aPattern = /\*\*A:\s*([^*]+)\*\*/g;
  const qMatches = [...markdown.matchAll(qPattern)];
  const aMatches = [...markdown.matchAll(aPattern)];
  if (qMatches.length > 0 && aMatches.length === qMatches.length) {
    qMatches.forEach((q, i) => {
      faqs.push({ question: q[1].trim(), answer: aMatches[i][1].trim() });
    });
    return faqs;
  }
  // Fallback: parse "**Q: ...**\n answer paragraph" pattern
  const lines = markdown.split('\n');
  let currentQ: string | null = null;
  for (const line of lines) {
    const qMatch = line.match(/^\*\*Q:\s*(.+?)\*\*\s*$/);
    if (qMatch) {
      currentQ = qMatch[1].trim();
      continue;
    }
    if (currentQ && line.trim().length > 0 && !line.startsWith('#')) {
      faqs.push({ question: currentQ, answer: line.trim().replace(/\*\*/g, '') });
      currentQ = null;
    }
  }
  return faqs;
};

/**
 * Extract FAQ items from a "## Frequently Asked Questions" section.
 * Handles the pattern: **Q: question?** followed by answer paragraph.
 */
const extractFAQSection = (markdown: string): { question: string; answer: string }[] => {
  const faqSectionMatch = markdown.match(/##\s+Frequently Asked Questions\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (!faqSectionMatch) return [];
  const section = faqSectionMatch[1];
  const faqs: { question: string; answer: string }[] = [];
  // Match "**Q: question?**\n\nanswer text" pattern
  const pairs = section.matchAll(/\*\*Q:\s*([^*]+?)\*\*\s*\n+([^\n*][^\n]*)/g);
  for (const pair of pairs) {
    faqs.push({ question: pair[1].trim(), answer: pair[2].trim() });
  }
  return faqs;
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(post.markdownPath);
        if (!response.ok) {
          throw new Error(`Failed to load article (${response.status})`);
        }
        const rawMarkdown = await response.text();
        if (!isActive) return;
        setMarkdown(normalizeQuotedMarkdownExport(rawMarkdown));
      } catch (err: any) {
        if (!isActive) return;
        setError(err?.message || 'Failed to load article.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      isActive = false;
    };
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Article not found</h1>
          <p className="mt-4 text-slate-700">The requested blog post does not exist.</p>
          <Link to="/blogs" className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  // Extract FAQs from loaded markdown for structured data
  const faqs = markdown ? extractFAQSection(markdown) || extractFAQs(markdown) : [];

  // Build breadcrumb trail
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blogs' },
    { name: post.title, url: `/blogs/${post.slug}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title={post.title}
        description={post.description}
        image={post.heroImage}
        url={`/blogs/${post.slug}`}
        type="article"
        publishedTime={post.publishedTime}
        modifiedTime={post.modifiedTime}
        author={post.author}
        keywords={post.keywords}
        readingTime={post.readingTime}
        faqs={faqs.length > 0 ? faqs : undefined}
        breadcrumbs={breadcrumbs}
      />

      {/* ── Breadcrumb Nav ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <span>/</span>
          <Link to="/blogs" className="hover:text-slate-800">Blog</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{post.title}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Hero Card ─────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <img src={post.heroImage} alt={post.title} className="h-80 w-full object-cover" />
          <div className="px-6 py-8 md:px-10">
            <Link to="/blogs" className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 hover:text-cyan-800">
              Blog
            </Link>
            <h1 className="mt-4 text-4xl font-headings font-extrabold text-slate-950 md:text-5xl">{post.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{formatDate(post.publishedTime)}</span>
              <span>&bull;</span>
              <span>{post.readingTime}</span>
              <span>&bull;</span>
              <span>{post.author}</span>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700">{post.summary}</p>
          </div>
        </div>

        {/* ── Article Body ──────────────────────────────────────────────── */}
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-4 py-8 shadow-sm md:px-8">
          {loading && <p className="text-slate-600">Loading article...</p>}
          {error && !loading && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <article className="blog-content">
              <Suspense fallback={<p className="text-slate-600">Loading article...</p>}>
                <LazyMarkdown>{markdown}</LazyMarkdown>
              </Suspense>
            </article>
          )}
        </div>

        {/* ── In-page CTA Banner ────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="mt-10 rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-slate-50 px-6 py-8 shadow-sm md:px-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Free Resource</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Get the 2026 AI Coding Stack Cheat Sheet
            </h2>
            <p className="mt-3 max-w-2xl text-slate-700">
              The exact Cursor + Claude Code + Gemini workflow, the prompts that get the best results from each tool,
              and the n8n glue layer that ties it all together — delivered free to your inbox.
            </p>
            <Link
              to="/pricing"
              className="mt-6 inline-flex items-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Get the Free Cheat Sheet →
            </Link>
          </div>
        )}

        {/* ── Back to Blog ──────────────────────────────────────────────── */}
        <div className="mt-8">
          <Link to="/blogs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            ← Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
