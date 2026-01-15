#!/usr/bin/env node
// Find a lesson by exact title and set videoUrl.
// Usage: node scripts/set_lesson_video_by_title.cjs "The AI Revolution: An Introductory Overview" https://youtu.be/...

const admin = require('firebase-admin');
try { admin.initializeApp(); } catch {}

async function main(){
  const title = process.argv[2];
  const url = process.argv[3];
  if (!title || !url) { console.error('Usage: node scripts/set_lesson_video_by_title.cjs "<title>" <url>'); process.exit(1); }
  const db = admin.firestore();
  const courses = await db.collection('courses').get();
  let updated = 0;
  for (const c of courses.docs){
    const mods = await c.ref.collection('modules').get();
    for (const m of mods.docs){
      const lessons = await m.ref.collection('lessons').get();
      for (const l of lessons.docs){
        const d = l.data() || {};
        if (d.title === title){
          await l.ref.set({ videoUrl: url }, { merge: true });
          console.log(`Updated: ${l.ref.path}`);
          updated++;
        }
      }
    }
  }
  if (!updated) { console.log('No lessons matched that title.'); }
  else { console.log(`Done. Updated ${updated} doc(s).`); }
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });

