#!/usr/bin/env node
// Anonymous-visitor audit of the live lesson data (Phase 4.3a / 4.5).
//
// Uses the client SDK with NO authentication — everything this script can
// read, any visitor can read. Purpose:
//   1. SECURITY: detect lesson-content/video fields sitting on the
//      world-readable lesson METADATA docs (firestore.rules only blocks
//      those fields at client write time; Admin-SDK writes bypass rules, so
//      seeded content leaks unless the data itself is moved to
//      /lessonContent).
//   2. Report lessons with no video (the "YouTube Placeholder" audit).
//   3. Snapshot the real module/lesson structure + tiers (source of truth
//      for reconciling marketing claims).
//
// Usage: node scripts/audit-live-lessons.mjs   (reads VITE_FIREBASE_* from .env)

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, doc, getDoc } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'ai-integra-course-v2',
});
const db = getFirestore(app);

const CONTENT_FIELDS = ['content', 'markdown', 'md', 'html', 'body', 'text'];
const VIDEO_FIELDS = ['videoUrl', 'youtubeUrl', 'videoId'];

const leaks = [];
const noVideo = [];
let lessonCount = 0;

const courses = await getDocs(collection(db, 'courses'));
for (const course of courses.docs) {
  console.log(`\nCOURSE ${course.id}: "${course.data().title}"`);
  const modules = await getDocs(collection(db, 'courses', course.id, 'modules'));
  for (const mod of modules.docs) {
    const m = mod.data();
    const lessons = await getDocs(
      collection(db, 'courses', course.id, 'modules', mod.id, 'lessons')
    );
    console.log(`  MODULE ${mod.id} (order ${m.order}): "${m.title}" — ${lessons.size} lessons`);
    for (const lesson of lessons.docs) {
      lessonCount += 1;
      const d = lesson.data();
      const tier = d.tier ?? (d.isFree ? 'free' : 'unknown');
      const contentHits = CONTENT_FIELDS.filter(
        (f) => typeof d[f] === 'string' && d[f].length > 0
      );
      const videoHits = VIDEO_FIELDS.filter((f) => typeof d[f] === 'string' && d[f].length > 0);
      const flags = [];
      if (contentHits.length > 0) {
        flags.push(
          `LEAK:${contentHits.map((f) => `${f}(${d[f].length}ch)`).join(',')}`
        );
        leaks.push({ path: `${course.id}/${mod.id}/${lesson.id}`, tier, fields: contentHits });
      }
      if (videoHits.length === 0) {
        noVideo.push({ path: `${course.id}/${mod.id}/${lesson.id}`, tier, title: d.title });
      }
      console.log(
        `    ${lesson.id}: "${d.title}" tier=${tier} video=${videoHits.length > 0 ? 'yes' : 'NO'} ${flags.join(' ')}`
      );
    }
  }
}

// Spot-check the gated collection stays closed to anonymous readers.
let lessonContentClosed = 'unknown (no probe id)';
try {
  await getDoc(doc(db, 'lessonContent', 'lesson_9'));
  lessonContentClosed = 'OPEN — anonymous read succeeded (BAD unless preview)';
} catch (err) {
  lessonContentClosed = `closed (${err.code})`;
}

console.log('\n========== SUMMARY ==========');
console.log(`lessons total: ${lessonCount}`);
console.log(`metadata docs carrying content fields (world-readable): ${leaks.length}`);
for (const l of leaks) console.log(`  LEAK ${l.path} tier=${l.tier} fields=${l.fields.join(',')}`);
console.log(`lessons with no video field: ${noVideo.length}`);
console.log(`anonymous read of /lessonContent/lesson_9: ${lessonContentClosed}`);
