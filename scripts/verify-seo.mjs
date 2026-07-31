#!/usr/bin/env node
// SEO output contract — runs at the end of postbuild and fails the build on
// regressions that have bitten this site before (Ahrefs audit, Jul 2026):
//
//   1. Forbidden link targets: placeholder hrefs (example.com, localhost,
//      #TODO, javascript:void(0)) must never ship. 24 example.com links from
//      unreplaced content-generation placeholders were once the ONLY external
//      links on the entire site.
//
// Scans every prerendered HTML file in build/ plus the blog markdown sources
// in public/blogs/ (the markdown is also served raw to AI crawlers).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(REPO_ROOT, 'build');
const BLOGS_DIR = path.join(REPO_ROOT, 'public', 'blogs');

const FORBIDDEN_HREF_PATTERNS = [
  { re: /(^|\/\/)([\w.-]*\.)?example\.(com|org|net)\b/i, label: 'example.com placeholder' },
  { re: /(^|\/\/)(localhost|127\.0\.0\.1)\b/i, label: 'localhost URL' },
  { re: /#TODO/i, label: '#TODO placeholder anchor' },
  { re: /^javascript:void\(0\)/i, label: 'javascript:void(0) href' },
];

const violations = [];

function checkHref(href, file) {
  for (const { re, label } of FORBIDDEN_HREF_PATTERNS) {
    if (re.test(href)) {
      violations.push(`${file}: ${label} → ${href}`);
    }
  }
}

function* walkHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

function relPath(p) {
  return path.relative(REPO_ROOT, p).split(path.sep).join('/');
}

// 1a. hrefs in every built HTML file
if (!existsSync(BUILD_DIR)) {
  console.error('verify-seo: build/ not found — run vite build first.');
  process.exit(1);
}
for (const file of walkHtml(BUILD_DIR)) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]*)"/g)) {
    checkHref(match[1], relPath(file));
  }
}

// 1b. markdown links in the blog sources (served raw at /blogs/*.md)
if (existsSync(BLOGS_DIR)) {
  for (const entry of readdirSync(BLOGS_DIR)) {
    if (!entry.endsWith('.md')) continue;
    const md = readFileSync(path.join(BLOGS_DIR, entry), 'utf8');
    for (const match of md.matchAll(/\]\(([^)\s]+)/g)) {
      checkHref(match[1], `public/blogs/${entry}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ verify-seo: ${violations.length} forbidden link(s) found:`);
  for (const v of violations) console.error(`   ${v}`);
  process.exit(1);
}
console.log('✅ verify-seo: no forbidden link targets in build output');
