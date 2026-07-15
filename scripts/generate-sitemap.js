#!/usr/bin/env node
/**
 * Sitemap Generator for AI Integration Course
 * 
 * Generates a dynamic sitemap.xml by fetching course data from Firestore
 * 
 * Usage:
 *   node scripts/generate-sitemap.js
 *   
 * This script should be run:
 * - Before each deployment
 * - As part of CI/CD pipeline
 * - Periodically via cron job
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2'
  });
}

const db = admin.firestore();
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
// Public preview lessons are anonymously accessible (isFreeLesson() in
// src/firebaseService.ts + firestore.rules lessonContent allowances) even
// though their tier is not 'free'. Parse the ID set from its source of
// truth so the sitemap can't drift from the app's access logic.
const PUBLIC_PREVIEW_LESSON_IDS = (() => {
  try {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'firebaseService.ts'),
      'utf8'
    );
    const block = source.match(/PUBLIC_PREVIEW_LESSON_IDS = new Set\(\[([\s\S]*?)\]\)/);
    if (!block) return new Set();
    return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
  } catch {
    return new Set();
  }
})();

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
  
  // Fetch courses from Firestore
  try {
    const coursesSnapshot = await db.collection('courses').get();
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      
      // Add course page. lastmod only when a real timestamp exists — a
      // new-Date fallback would falsely bump every URL on every build.
      if (shouldIncludePath(`/courses/${courseId}`)) {
        const courseLastmod = courseData.updatedAt?.toDate?.()?.toISOString?.();
        urls.push({
          loc: `${BASE_URL}/courses/${courseId}`,
          priority: '0.8',
          changefreq: 'weekly',
          ...(courseLastmod ? { lastmod: courseLastmod } : {})
        });
      }
      
      // Fetch modules
      const modulesSnapshot = await db
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .orderBy('order')
        .get();
      
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id;
        
        // Fetch lessons
        const lessonsSnapshot = await db
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .orderBy('order')
          .get();
        
        for (const lessonDoc of lessonsSnapshot.docs) {
          const lessonId = lessonDoc.id;
          const lessonData = lessonDoc.data();

          // Only publicly accessible lessons belong in the sitemap:
          // gated/premium lesson URLs require auth, so to crawlers they are
          // soft-404s or shells. Free-tier lessons and the public preview
          // founders lessons are both anonymously readable.
          const isPubliclyAccessible =
            lessonData.tier === 'free' ||
            lessonData.isFree ||
            PUBLIC_PREVIEW_LESSON_IDS.has(lessonId);
          if (!isPubliclyAccessible) {
            continue;
          }

          if (shouldIncludePath(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)) {
            const lessonLastmod = lessonData.updatedAt?.toDate?.()?.toISOString?.();
            urls.push({
              loc: `${BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
              priority: '0.7',
              changefreq: 'monthly',
              ...(lessonLastmod ? { lastmod: lessonLastmod } : {})
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Firestore data:', error);
    console.log('Continuing with static pages only...');
  }
  
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
