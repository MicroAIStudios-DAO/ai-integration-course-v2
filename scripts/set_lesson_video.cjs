#!/usr/bin/env node
// Set a lesson's videoUrl by explicit Firestore doc path.
// Usage: node scripts/set_lesson_video.cjs courses/<courseId>/modules/<moduleId>/lessons/<lessonId> https://youtu.be/....
//
// Tier-aware: lesson docs are world-readable metadata (firestore.rules), so a
// protected lesson's videoUrl goes to the tier-gated lessonContent doc and any
// copy on the lesson doc is deleted. Free lessons keep it on the doc (they
// must play for anonymous visitors, who cannot read lessonContent).

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
  const lessonRef = db.doc(docPath);
  const snap = await lessonRef.get();
  if (!snap.exists) {
    console.error(`Lesson not found: ${docPath}`);
    process.exit(1);
  }
  const data = snap.data() || {};
  const isFree = data.tier === 'free' || data.isFree === true;

  if (isFree) {
    await lessonRef.set({ videoUrl: url }, { merge: true });
    console.log(`Set videoUrl on free lesson doc ${docPath}`);
    return;
  }

  const parts = docPath.split('/');
  if (parts.length !== 6) {
    console.error(`Unexpected lesson path shape: ${docPath}`);
    process.exit(1);
  }
  const contentId = `${parts[1]}__${parts[3]}__${parts[5]}`;
  const batch = db.batch();
  batch.set(db.collection('lessonContent').doc(contentId), {
    courseId: parts[1],
    moduleId: parts[3],
    lessonId: parts[5],
    tier: data.tier || 'premium',
    videoUrl: url,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.set(lessonRef, { videoUrl: admin.firestore.FieldValue.delete() }, { merge: true });
  await batch.commit();
  console.log(`Set videoUrl in lessonContent/${contentId} (and removed it from the public lesson doc)`);
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });
