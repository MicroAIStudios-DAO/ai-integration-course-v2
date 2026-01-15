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

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');
  
  const urls = [];
  
  // Static pages
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/courses', priority: '0.9', changefreq: 'weekly' },
    { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/login', priority: '0.5', changefreq: 'monthly' },
    { path: '/signup', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  ];
  
  staticPages.forEach(page => {
    urls.push({
      loc: `${BASE_URL}${page.path}`,
      priority: page.priority,
      changefreq: page.changefreq
    });
  });
  
  // Fetch courses from Firestore
  try {
    const coursesSnapshot = await db.collection('courses').get();
    
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      
      // Add course page
      urls.push({
        loc: `${BASE_URL}/courses/${courseId}`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: courseData.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
      });
      
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
          
          // Only include free lessons in sitemap for public indexing
          // Premium lessons are still indexed but with lower priority
          const isFree = lessonData.tier === 'free' || lessonData.isFree;
          
          urls.push({
            loc: `${BASE_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            priority: isFree ? '0.7' : '0.5',
            changefreq: 'monthly',
            lastmod: lessonData.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
          });
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
