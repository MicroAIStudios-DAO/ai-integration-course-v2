#!/usr/bin/env node
// Set a lesson's videoUrl by explicit Firestore doc path.
// Usage: node scripts/set_lesson_video.cjs courses/<courseId>/modules/<moduleId>/lessons/<lessonId> https://youtu.be/....

const admin = require('firebase-admin');
try { admin.initializeApp(); } catch {}

async function main(){
  const docPath = process.argv[2];
  const url = process.argv[3];
  if (!docPath || !url) {
    console.error('Usage: node scripts/set_lesson_video.cjs <lessonDocPath> <videoUrl>');
    process.exit(1);
  }
  const db = admin.firestore();
  await db.doc(docPath).set({ videoUrl: url }, { merge: true });
  console.log(`Set videoUrl on ${docPath} to ${url}`);
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });

