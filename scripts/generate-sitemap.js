#!/usr/bin/env node
/**
 * Sitemap Generator for AI Integration Course
 *
 * Generates sitemap.xml from the public, indexable routes: static marketing
 * pages, blog articles (auto-discovered from public/blogs/*.md), library
 * guides, and industry pages. Course/lesson SPA routes are intentionally
 * excluded — see the note inside generateSitemap().
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * This script should be run:
 * - Whenever public routes are added or removed
 * - Before each deployment (output is committed at public/sitemap.xml)
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://aiintegrationcourse.com';
const EXCLUDED_PATH_PREFIXES = ['/app/'];
const RESOURCE_PAGE_SLUGS = [
  'rag-for-small-business',
  'function-calling-with-gemini-1-5-pro',
  'openai-vs-anthropic-for-automation'
];
// Auto-discover blog posts from public/blogs/*.md so new articles (incl. those
// produced by the editorial pipeline) are indexed without editing this file.
const BLOG_POST_SLUGS = (() => {
  try {
    const dir = path.join(__dirname, '..', 'public', 'blogs');
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return ['workflow-complete-guide'];
  }
})();
const INDUSTRY_PAGE_SLUGS = [
  'real-estate',
  'e-commerce',
  'law-firms'
];

function shouldIncludePath(pathname) {
  return !EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');
  
  const urls = [];
  
  // Static pages
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/courses', priority: '0.9', changefreq: 'weekly' },
    { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/blogs', priority: '0.8', changefreq: 'weekly' },
    { path: '/library', priority: '0.8', changefreq: 'weekly' },
    { path: '/solutions', priority: '0.8', changefreq: 'weekly' },
    { path: '/ai-workshops-san-diego', priority: '0.7', changefreq: 'monthly' },
    // /login and /signup are intentionally excluded: they are noindexed
    // auth/utility pages (see scripts/route-meta.mjs) with no search value.
    { path: '/start-trial', priority: '0.9', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  ];
  
  staticPages.forEach(page => {
    if (!shouldIncludePath(page.path)) {
      return;
    }
    urls.push({
      loc: `${BASE_URL}${page.path}`,
      priority: page.priority,
      changefreq: page.changefreq
    });
  });

  RESOURCE_PAGE_SLUGS.forEach((slug) => {
    urls.push({
      loc: `${BASE_URL}/library/${slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    });
  });

  BLOG_POST_SLUGS.forEach((slug) => {
    urls.push({
      loc: `${BASE_URL}/blogs/${slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    });
  });

  INDUSTRY_PAGE_SLUGS.forEach((slug) => {
    urls.push({
      loc: `${BASE_URL}/solutions/${slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    });
  });
  
  // Course and lesson detail routes (/courses/<id>, .../lessons/<id>) are
  // deliberately NOT included. They are client-rendered SPA routes: crawlers
  // receive the empty app shell (no title/canonical/H1) regardless of the
  // lesson's data-level access tier — live verification showed every such
  // URL, including the anonymously-readable founders preview lessons,
  // serving the identical shell. Listing them creates soft-404 sitemap
  // entries and pollutes the IndexNow submission set (which submits exactly
  // this sitemap). Re-add them only if/when those routes get prerendered
  // with real content.

  // Generate XML
  const xml = generateXML(urls);
  
  // Write to public folder
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  
  console.log(`✅ Sitemap generated with ${urls.length} URLs`);
  console.log(`📁 Output: ${outputPath}`);
  
  return urls.length;
}

function generateXML(urls) {
  const urlElements = urls.map(url => {
    let element = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n`;
    
    if (url.lastmod) {
      element += `    <lastmod>${url.lastmod.split('T')[0]}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      element += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority) {
      element += `    <priority>${url.priority}</priority>\n`;
    }
    
    element += `  </url>`;
    return element;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlElements}
</urlset>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Run if called directly
if (require.main === module) {
  generateSitemap()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Failed to generate sitemap:', err);
      process.exit(1);
    });
}

module.exports = { generateSitemap };
