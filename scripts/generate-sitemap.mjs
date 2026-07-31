#!/usr/bin/env node
// Sitemap generator — derived from the same route manifests the prerenderer
// consumes, so it cannot drift from what actually ships:
//
//   - scripts/route-meta.mjs        static marketing routes (noindex excluded)
//   - src/content/blogPosts.ts      blog articles (real lastmod from modifiedTime)
//   - src/content/marketingPages.ts library + solutions leaves
//
// Runs in postbuild BEFORE scripts/verify-seo.mjs, which cross-checks every
// sitemap URL against the built HTML (file exists, self-canonical, not
// noindexed) and fails the build on drift. Writes public/sitemap.xml (the
// committed copy Vite ships) and build/sitemap.xml (the deployed file).
//
// Course/lesson SPA routes stay excluded: they serve the noindexed app shell.

import { writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { BASE_URL, REPO_ROOT, loadBlogPosts, loadMarketingPages } from './blog-data.mjs';
import { staticRoutes } from './route-meta.mjs';

const PRIORITY = {
  '/': '1.0',
  '/courses': '0.9',
  '/start-trial': '0.9',
  '/pricing': '0.8',
  '/blogs': '0.8',
  '/library': '0.8',
  '/solutions': '0.8',
  '/roadmap': '0.8',
  '/about': '0.7',
  '/ai-workshops-san-diego': '0.7',
  '/contact': '0.6',
  '/faq': '0.6',
  '/privacy': '0.3',
  '/terms': '0.3',
};

const CHANGEFREQ = {
  '/': 'weekly',
  '/courses': 'weekly',
  '/blogs': 'weekly',
  '/library': 'weekly',
  '/solutions': 'weekly',
  '/privacy': 'yearly',
  '/terms': 'yearly',
};

const isNoindex = (route) =>
  route.noindex === true || (typeof route.robots === 'string' && route.robots.includes('noindex'));

function buildUrls() {
  const urls = [{ loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' }];

  for (const route of staticRoutes) {
    if (isNoindex(route)) continue;
    urls.push({
      loc: `${BASE_URL}${route.path}`,
      priority: PRIORITY[route.path] ?? '0.7',
      changefreq: CHANGEFREQ[route.path] ?? 'monthly',
    });
  }

  for (const post of loadBlogPosts()) {
    urls.push({
      loc: `${BASE_URL}/blogs/${post.slug}`,
      lastmod: (post.modifiedTime || post.publishedTime).split('T')[0],
      priority: '0.7',
      changefreq: 'monthly',
    });
  }

  const { resourceLibraryItems, industryPages } = loadMarketingPages();
  for (const item of resourceLibraryItems) {
    urls.push({ loc: `${BASE_URL}/library/${item.slug}`, priority: '0.7', changefreq: 'monthly' });
  }
  for (const item of industryPages) {
    urls.push({ loc: `${BASE_URL}/solutions/${item.slug}`, priority: '0.7', changefreq: 'monthly' });
  }

  return urls;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXml(urls) {
  const entries = urls
    .map((u) => {
      const parts = [`  <url>`, `    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
      parts.push('  </url>');
      return parts.join('\n');
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

const urls = buildUrls();
const xml = toXml(urls);

const publicPath = path.join(REPO_ROOT, 'public', 'sitemap.xml');
writeFileSync(publicPath, xml);
console.log(`✅ sitemap: ${urls.length} URLs → public/sitemap.xml`);

const buildPath = path.join(REPO_ROOT, 'build', 'sitemap.xml');
if (existsSync(path.join(REPO_ROOT, 'build'))) {
  writeFileSync(buildPath, xml);
  console.log(`✅ sitemap: ${urls.length} URLs → build/sitemap.xml`);
}
