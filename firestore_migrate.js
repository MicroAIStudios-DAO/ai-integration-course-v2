#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const APPLY = process.argv.includes('--apply');
const manIdx = process.argv.indexOf('--manifest');
const MANIFEST = manIdx>=0 ? process.argv[manIdx+1] : path.join(process.cwd(),'reorg_logs','firestore_migration_manifest.json');
fs.mkdirSync(path.dirname(MANIFEST),{recursive:true});

function safeRequire(m){ try{return require(m);}catch{ return null; } }
const admin = safeRequire('firebase-admin');

const FREE_TITLES = new Set([
  'The Ai Revolution: an Introductory Overview',
  'Ai Integration Lesson Untitled',
  'The Ai Revolution: Understanding Where We Are and Where We\'re Going',
]);
const WRONG = new Set(['embeddings','intro','setup','stripe']);

async function main(){
  if(!admin){
    fs.writeFileSync(MANIFEST, JSON.stringify({ actions: [], apply:false, note:'firebase-admin not installed' }, null, 2));
    return;
  }
  if(!admin.apps.length){ admin.initializeApp({ credential: admin.credential.applicationDefault() }); }
  const db = admin.firestore();
  const actions=[];

  // Also clean bogus top-level lessons docs
  try {
    const bogus = ['embeddings','intro','setup','stripe'];
    const root = await db.collection('lessons').get();
    for (const d of root.docs){
      if (bogus.includes(d.id)) { actions.push({ type:'delete-wrong-root', path: d.ref.path }); }
    }
  } catch {}
  const courses = await db.collection('courses').get();
  for(const c of courses.docs){
    const mods = await c.ref.collection('modules').get();
    for(const m of mods.docs){
      const lessons = await m.ref.collection('lessons').get();
      const seen=new Map();
      for(const l of lessons.docs){
        const id=l.id; const p=l.ref.path; const d=l.data();
        if(WRONG.has(id)) { actions.push({type:'delete-wrong', path:p}); continue; }
        const title=d.title||'Untitled';
        const slug=(d.slug||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));
        const key=slug;
        if(!seen.has(key)) seen.set(key, []);
        seen.get(key).push({p,d});
      }
      for(const [k,arr] of seen.entries()){
        arr.sort((a,b)=>a.p.localeCompare(b.p));
        const keep=arr[0];
        for(let i=1;i<arr.length;i++){ actions.push({type:'delete-duplicate', path: arr[i].p}); }
        const d=keep.d; const title=d.title||'Untitled';
        const slug=(d.slug||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));
        const order= typeof d.order==='number'?d.order:0;
        const tier= FREE_TITLES.has(title)?'free':'premium';
        const videoId=d.videoId||'TBD';
        const patch={ title, slug, order, tier, videoId };
        // Set specific video URL for first free lesson
        if (title === 'The AI Revolution: An Introductory Overview') {
          patch.videoUrl = 'https://youtu.be/yegyaYCQhgs';
        }
        if(!d.md && !d.html) patch.md=d.md||'';
        actions.push({type:'patch', path: keep.p, patch});
      }
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify({ actions, apply: APPLY, createdAt: new Date().toISOString() }, null, 2));
  if(!APPLY) return;
  for(const a of actions){
    if(a.type==='patch'){
      await db.doc(a.path).set(a.patch,{merge:true});
    } else if(a.type.startsWith('delete-')){
      await db.doc(a.path).delete();
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
