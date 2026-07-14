#!/usr/bin/env node
/**
 * Lightweight sitemap patch for blog entries.
 *
 * The full generate-sitemap.js requires Firebase Admin credentials (Firestore)
 * and is therefore unsuitable for CI. This script handles only the blog section:
 * it reads public/blogs/*.md, compares against the committed public/sitemap.xml,
 * and inserts any missing /blogs/<slug> entries. Existing entries (including all
 * course/lesson URLs written by the full generator) are never removed or altered.
 *
 * Usage:  node scripts/update-sitemap-blogs.mjs
 * Called automatically as part of `npm run build` via the `prebuild` hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const BLOGS_DIR = path.join(ROOT, 'public', 'blogs');
const BASE_URL = 'https://aiintegrationcourse.com';

const today = new Date().toISOString().slice(0, 10);

// Discover all published blog slugs from the filesystem.
const slugs = fs
  .readdirSync(BLOGS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

let xml = fs.readFileSync(SITEMAP, 'utf8');

let added = 0;
for (const slug of slugs) {
  const loc = `${BASE_URL}/blogs/${slug}`;
  if (xml.includes(`<loc>${loc}</loc>`)) continue;

  // Insert before the closing </urlset> tag.
  const entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  xml = xml.replace('</urlset>', `${entry}</urlset>`);
  added++;
}

fs.writeFileSync(SITEMAP, xml);

if (added > 0) {
  console.log(`sitemap: added ${added} blog entr${added === 1 ? 'y' : 'ies'} to public/sitemap.xml`);
} else {
  console.log('sitemap: public/sitemap.xml already up to date');
}
