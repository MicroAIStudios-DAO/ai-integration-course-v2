import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '../components/SEO';
import { getBlogPostBySlug } from '../content/blogPosts';
import '../styles/blog-content.css';
import { MarkdownPre } from '../components/common/CopyableCodeBlock';

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
      />
      <div className="mx-auto max-w-5xl px-4 py-14">
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

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-4 py-8 shadow-sm md:px-8">
          {loading && <p className="text-slate-600">Loading article...</p>}
          {error && !loading && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <article className="blog-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: MarkdownPre }}>{markdown}</ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
