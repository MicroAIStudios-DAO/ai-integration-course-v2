#!/usr/bin/env node
// Find a lesson by exact title and set videoUrl.
// Usage: node scripts/set_lesson_video_by_title.cjs "The AI Revolution: An Introductory Overview" https://youtu.be/...
//
// Tier-aware: lesson docs are world-readable metadata (firestore.rules), so a
// protected lesson's videoUrl goes to the tier-gated lessonContent doc and any
// copy on the lesson doc is deleted. Free lessons keep it on the doc (they
// must play for anonymous visitors, who cannot read lessonContent).

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
        if (d.title !== title) continue;

        const isFree = d.tier === 'free' || d.isFree === true;
        if (isFree) {
          await l.ref.set({ videoUrl: url }, { merge: true });
          console.log(`Updated free lesson doc: ${l.ref.path}`);
        } else {
          const contentId = `${c.id}__${m.id}__${l.id}`;
          const batch = db.batch();
          batch.set(db.collection('lessonContent').doc(contentId), {
            courseId: c.id,
            moduleId: m.id,
            lessonId: l.id,
            tier: d.tier || 'premium',
            videoUrl: url,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          batch.set(l.ref, { videoUrl: admin.firestore.FieldValue.delete() }, { merge: true });
          await batch.commit();
          console.log(`Updated lessonContent/${contentId} (removed videoUrl from public doc ${l.ref.path})`);
        }
        updated++;
      }
    }
  }
  if (!updated) { console.log('No lessons matched that title.'); }
  else { console.log(`Done. Updated ${updated} lesson(s).`); }
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });
