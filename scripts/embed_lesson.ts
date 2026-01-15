#!/usr/bin/env -S node -r ts-node/register
/**
 * Admin helper to precompute and cache lesson embeddings to Firebase Storage.
 * Usage: ts-node scripts/embed_lesson.ts courses/<courseId>/modules/<moduleId>/lessons/<lessonId>
 * Requires GOOGLE_APPLICATION_CREDENTIALS or default credentials.
 */
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

if (!admin.apps.length) {
  try { admin.initializeApp(); } catch { /* noop */ }
}

function sourceHomeEnv() {
  try {
    const home = process.env.HOME;
    if (!home) return;
    const candidates = [
      path.join(home, 'Desktop', 'env1.txt'),
      path.join(home, 'Desktop', 'env1.md'),
    ];
    const p = candidates.find(fp => fs.existsSync(fp));
    if (!p) return;
    const lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const k = m[1]; const v = m[2];
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}
sourceHomeEnv();

type Chunk = { text: string; start: number; end: number; idx: number };
function chunkText(s: string, size = 900, overlap = 100): Chunk[] {
  const clean = s.replace(/\s+/g, ' ').trim();
  const out: Chunk[] = [];
  let i = 0, idx = 0; const n = clean.length;
  while (i < n) { const end = Math.min(i + size, n); out.push({ text: clean.slice(i, end), start: i, end, idx: idx++ }); if (end === n) break; i = end - overlap; }
  return out;
}

async function main() {
  const docPath = process.argv[2];
  if (!docPath) { console.error('Usage: embed_lesson.ts <docPath>'); process.exit(1); }
  const db = admin.firestore();
  const snap = await db.doc(docPath).get();
  if (!snap.exists) throw new Error('Lesson not found');
  const d = snap.data() as any;
  const raw = (d.md || d.html || '').toString();
  if (!raw) throw new Error('Lesson empty');
  const chunks = chunkText(raw);
  const inputs = chunks.map(c => c.text);

  const key = process.env.OPENAI_API_KEY || '';
  if (!key) throw new Error('OPENAI_API_KEY missing');
  const r = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs }) });
  if (!r.ok) throw new Error(`Embedding error ${r.status}`);
  const j = await r.json() as { data: { embedding: number[] }[] };
  const vectors = j.data.map(x => x.embedding);
  const b = admin.storage().bucket();
  const file = b.file(`indexes/lesson_${docPath.replace(/\//g,'_')}_embeddings.json`);
  await file.save(Buffer.from(JSON.stringify({ chunks, vectors })), { contentType: 'application/json' });
  console.log('Cached:', file.name);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
