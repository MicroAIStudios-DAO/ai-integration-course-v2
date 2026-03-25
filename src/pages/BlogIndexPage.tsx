import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { blogPosts } from '../content/blogPosts';

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BlogIndexPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SEO
        title="AI Workflow Blog"
        description="Blog posts on workflow automation, AI operating systems, and practical implementation patterns for business operators and developers."
        url="/blogs"
        type="website"
        keywords={[
          'AI workflow blog',
          'workflow automation articles',
          'business process design',
          'AI operations blog',
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Blog</p>
          <h1 className="mt-3 text-4xl font-headings font-extrabold text-slate-950">Long-form breakdowns on workflows, automation, and operational design</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-700">
            These posts focus on the systems layer: how work gets structured, how automation fits into real operations, and what strong execution looks like when teams move from ad hoc tasks to governed workflows.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <article key={post.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img
                src={post.heroImage}
                alt={post.title}
                className="h-64 w-full object-cover"
              />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{formatDate(post.publishedTime)}</span>
                  <span>&bull;</span>
                  <span>{post.readingTime}</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">{post.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{post.summary}</p>
                <div className="mt-6">
                  <Link
                    to={`/blogs/${post.slug}`}
                    className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                  >
                    Read article
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogIndexPage;
