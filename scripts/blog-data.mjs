// Shared blog metadata loader for the AEO build scripts (prerender-blogs,
// generate-llms-guides, indexnow-ping).
//
// src/content/blogPosts.ts stays the single source of truth for article
// metadata; this module transpiles it with esbuild (already a vite dep) so
// Node scripts can consume it without a TS runtime. The markdown
// normalization and FAQ extraction mirror src/pages/BlogPostPage.tsx so
// build-time output matches what React renders at runtime.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.join(__dirname, '..');
export const BASE_URL = 'https://aiintegrationcourse.com';
export const SITE_NAME = 'AI Integration Course';

function loadTsModule(relPath) {
  const source = readFileSync(path.join(REPO_ROOT, ...relPath.split('/')), 'utf8');
  const { code } = transformSync(source, { loader: 'ts', format: 'cjs' });
  const mod = { exports: {} };
  const requireStub = (id) => {
    throw new Error(
      `loadTsModule: ${relPath} must not import "${id}" (use literal values only).`
    );
  };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, requireStub);
  return mod.exports;
}

export function loadBlogPosts() {
  const { blogPosts } = loadTsModule('src/content/blogPosts.ts');
  if (!Array.isArray(blogPosts)) {
    throw new Error('blogPosts export not found in src/content/blogPosts.ts');
  }
  return blogPosts;
}

// Library articles, industry pages, and the FAQ items visibly rendered on
// /faq — same single-source-of-truth approach as blogPosts.
export function loadMarketingPages() {
  const { resourceLibraryItems, industryPages, homepageFaqItems } =
    loadTsModule('src/content/marketingPages.ts');
  if (!Array.isArray(resourceLibraryItems) || !Array.isArray(industryPages)) {
    throw new Error('marketingPages exports not found in src/content/marketingPages.ts');
  }
  return {
    resourceLibraryItems,
    industryPages,
    homepageFaqItems: homepageFaqItems ?? [],
  };
}

export function readPostMarkdown(post) {
  const raw = readFileSync(
    path.join(REPO_ROOT, 'public', post.markdownPath.replace(/^\//, '')),
    'utf8'
  );
  return normalizeQuotedMarkdownExport(raw);
}

export function normalizeQuotedMarkdownExport(markdown) {
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
}

export function extractFAQs(markdown) {
  const sectionMatch = markdown.match(
    /##\s+Frequently Asked Questions\s*\n([\s\S]*?)(?=\n##|$)/i
  );
  if (sectionMatch) {
    const faqs = [];
    const pairs = sectionMatch[1].matchAll(/\*\*Q:\s*([^*]+?)\*\*\s*\n+([^\n*][^\n]*)/g);
    for (const pair of pairs) {
      faqs.push({ question: pair[1].trim(), answer: pair[2].trim() });
    }
    if (faqs.length > 0) return faqs;
  }

  // Fallback: bold Q/A pairs anywhere in the document
  const faqs = [];
  const lines = markdown.split('\n');
  let currentQ = null;
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
}
