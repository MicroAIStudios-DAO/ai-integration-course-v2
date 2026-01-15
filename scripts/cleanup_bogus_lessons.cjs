#!/usr/bin/env node
// Backup and remove bogus top-level lessons docs: embeddings, intro, setup, stripe
// Usage: node scripts/cleanup_bogus_lessons.cjs

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch {}

async function main(){
  const db = admin.firestore();
  const ids = ['embeddings','intro','setup','stripe'];
  const backup = {};
  for (const id of ids){
    const ref = db.collection('lessons').doc(id);
    const snap = await ref.get();
    if (snap.exists) { backup[ref.path] = snap.data(); }
  }
  const outDir = path.join(process.cwd(), 'reorg_logs');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `backup_root_lessons_${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));
  console.log(`Backed up to ${outPath}`);

  for (const id of ids){
    const ref = db.collection('lessons').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      console.log(`Deleted ${ref.path}`);
    } else {
      console.log(`Not found: ${ref.path}`);
    }
  }
}

main().catch(e=>{ console.error(e?.message || e); process.exit(1); });

