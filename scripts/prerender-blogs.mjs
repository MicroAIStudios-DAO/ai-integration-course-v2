#!/usr/bin/env node
// Prerender blog articles to static HTML for AI crawlers (GPTBot,
// PerplexityBot, ClaudeBot) and other non-JS user agents.
//
// The site is a client-rendered SPA, so /blogs/<slug> is an empty shell until
// React boots. This script runs as a postbuild step: for every post in
// src/content/blogPosts.ts it renders the markdown to HTML, injects the full
// article plus meta tags and JSON-LD (BlogPosting, FAQPage, BreadcrumbList)
// into the built index.html template, and writes build/blogs/<slug>/index.html.
// Firebase Hosting serves exact file matches before the SPA rewrite, so
// crawlers get real content while browsers hydrate into the normal app
// (ReactDOM.createRoot().render replaces the static #root content).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import {
  BASE_URL,
  REPO_ROOT,
  SITE_NAME,
  extractFAQs,
  loadBlogPosts,
  readPostMarkdown,
} from './blog-data.mjs';

const BUILD_DIR = path.join(REPO_ROOT, 'build');
const TEMPLATE_PATH = path.join(BUILD_DIR, 'index.html');

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const replaceMetaContent = (html, selectorRe, value) =>
  html.replace(selectorRe, (match) =>
    match.replace(/content="[^"]*"/, `content="${escapeHtml(value)}"`)
  );

// JSON-LD shapes mirror src/components/SEO.tsx so the prerendered structured
// data matches what the SPA emits after hydration.
function buildJsonLd(post, faqs) {
  const fullUrl = `${BASE_URL}/blogs/${post.slug}`;
  const fullImage = post.heroImage.startsWith('http')
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;

  const schemas = [];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
    },
    sameAs: [
      'https://twitter.com/aiintegrationco',
      'https://www.linkedin.com/company/ai-integration-course',
    ],
  });

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: { '@type': 'ImageObject', url: fullImage, width: 1200, height: 630 },
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${BASE_URL}/about`,
      knowsAbout: [
        'AI workflow automation',
        'Cursor IDE',
        'Claude Code',
        'Gemini AI',
        'AI coding tools',
        'developer productivity',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
    },
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime || post.publishedTime,
    mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
    url: fullUrl,
    inLanguage: 'en-US',
    ...(post.readingTime && { timeRequired: post.readingTime }),
    about: post.keywords.slice(0, 5).map((k) => ({ '@type': 'Thing', name: k })),
    isPartOf: { '@type': 'Blog', name: `${SITE_NAME} Blog`, url: `${BASE_URL}/blogs` },
  });

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blogs` },
      { '@type': 'ListItem', position: 3, name: post.title, item: fullUrl },
    ],
  });

  return schemas
    .map((s) => `    <script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n');
}

function buildStaticBody(post, articleHtml) {
  // Minimal semantic markup — crawlers read this; browsers replace it the
  // moment React hydrates, so no styling is needed.
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blogs">Blog</a> / ${escapeHtml(post.title)}</nav>`,
    '<article>',
    `<p>${escapeHtml(post.eyebrow)}</p>`,
    `<h1>${escapeHtml(post.title)}</h1>`,
    `<p>${escapeHtml(formatDate(post.publishedTime))} &bull; ${escapeHtml(post.readingTime)} &bull; ${escapeHtml(post.author)}</p>`,
    `<p>${escapeHtml(post.summary)}</p>`,
    articleHtml,
    '</article>',
    `<p><a href="/pricing">Explore the AI Integration Course — $1 Pro trial</a></p>`,
    `<p><a href="/blogs">Back to all articles</a></p>`,
  ].join('\n');
}

function prerenderPost(template, post) {
  const markdown = readPostMarkdown(post);
  const articleHtml = marked.parse(markdown);
  const faqs = extractFAQs(markdown);
  const fullUrl = `${BASE_URL}/blogs/${post.slug}`;
  const fullImage = post.heroImage.startsWith('http')
    ? post.heroImage
    : `${BASE_URL}${post.heroImage}`;
  const fullTitle = `${post.title} | ${SITE_NAME}`;

  let html = template;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(fullTitle)}</title>`
  );
  html = replaceMetaContent(html, /<meta name="description"[^>]*>/, post.description);
  html = replaceMetaContent(html, /<meta name="keywords"[^>]*>/, post.keywords.join(', '));
  html = replaceMetaContent(html, /<meta name="author"[^>]*>/, post.author);
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${fullUrl}"`
  );
  html = replaceMetaContent(html, /<meta property="og:type"[^>]*>/, 'article');
  html = replaceMetaContent(html, /<meta property="og:url"[^>]*>/, fullUrl);
  html = replaceMetaContent(html, /<meta property="og:title"[^>]*>/, fullTitle);
  html = replaceMetaContent(html, /<meta property="og:description"[^>]*>/, post.description);
  html = replaceMetaContent(html, /<meta property="og:image"[^>]*>/, fullImage);
  html = replaceMetaContent(html, /<meta name="twitter:title"[^>]*>/, fullTitle);
  html = replaceMetaContent(html, /<meta name="twitter:description"[^>]*>/, post.description);
  html = replaceMetaContent(html, /<meta name="twitter:image"[^>]*>/, fullImage);

  // Drop the homepage's JSON-LD (Course schema) — wrong entity for an article.
  html = html.replace(
    /[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g,
    ''
  );

  const articleMeta = [
    `    <meta property="article:published_time" content="${escapeHtml(post.publishedTime)}" />`,
    `    <meta property="article:modified_time" content="${escapeHtml(post.modifiedTime || post.publishedTime)}" />`,
    `    <meta property="article:author" content="${escapeHtml(post.author)}" />`,
    buildJsonLd(post, faqs),
  ].join('\n');
  html = html.replace('</head>', `${articleMeta}\n  </head>`);

  const rootRe = /<div id="root">\s*<\/div>/;
  if (!rootRe.test(html)) {
    throw new Error('Could not find empty <div id="root"> in build/index.html');
  }
  html = html.replace(rootRe, `<div id="root">${buildStaticBody(post, articleHtml)}</div>`);

  const outDir = path.join(BUILD_DIR, 'blogs', post.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html);
  return { slug: post.slug, faqCount: faqs.length, bytes: html.length };
}

function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`prerender-blogs: ${TEMPLATE_PATH} not found — run vite build first.`);
    process.exit(1);
  }
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const posts = loadBlogPosts();
  let failures = 0;

  for (const post of posts) {
    try {
      const result = prerenderPost(template, post);
      console.log(
        `✅ prerendered /blogs/${result.slug} (${(result.bytes / 1024).toFixed(1)} KB, ${result.faqCount} FAQs)`
      );
    } catch (err) {
      failures += 1;
      console.error(`❌ failed to prerender /blogs/${post.slug}: ${err.message}`);
    }
  }

  console.log(`prerender-blogs: ${posts.length - failures}/${posts.length} articles prerendered`);
  if (failures > 0) process.exit(1);
}

main();
