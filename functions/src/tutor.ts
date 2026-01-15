/* Hardened Tutor endpoint (TypeScript) */
import admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import path from 'path';
import fs from 'fs';
import fetch, { Response } from 'node-fetch';

if (!admin.apps.length) {
  try { admin.initializeApp(); } catch { /* noop */ }
}

// Secrets loader: source $HOME/Desktop/env1.txt if present (never log)
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
  } catch { /* never print secrets */ }
}
sourceHomeEnv();

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

// Small helpers
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { const ai = a[i]; const bi = b[i]; dot += ai * bi; na += ai * ai; nb += bi * bi; }
  const denom = Math.sqrt(na) * Math.sqrt(nb) + 1e-9;
  return dot / denom;
}

type Chunk = { text: string; start: number; end: number; idx: number };
function chunkText(s: string, size = 900, overlap = 100): Chunk[] {
  const clean = s.replace(/\s+/g, ' ').trim();
  const out: Chunk[] = [];
  let i = 0, idx = 0;
  const n = clean.length;
  while (i < n) {
    const end = Math.min(i + size, n);
    out.push({ text: clean.slice(i, end), start: i, end, idx: idx++ });
    if (end === n) break;
    i = end - overlap;
  }
  return out;
}

function estTokensFromChars(chars: number): number {
  return Math.ceil(chars / 4); // rough heuristic
}

const MODEL_FALLBACKS = (process.env.OPENAI_TUTOR_MODEL || 'o3-mini')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(['gpt-4o-mini', 'gpt-3.5-turbo']);

async function openAIEmbeddings(key: string, inputs: string[]) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs })
  });
  if (!r.ok) throw new Error(`Embedding error ${r.status}`);
  const j = await r.json() as { data: { embedding: number[] }[] };
  return j.data.map(d => d.embedding);
}

async function streamChat(key: string, model: string, messages: any, maxTokens: number): Promise<Response> {
  const body = { model, messages, temperature: 0.2, stream: true, max_tokens: maxTokens };
  // Use chat/completions for broad compatibility across fallbacks
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  });
  return r;
}

function loadSystemPrompt(): string {
  try {
    const p = path.join(process.cwd(), '..', 'prompts', 'tutor_system.txt');
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return 'You are an AI Tutor. Cite lesson sections as (Lesson §X.Y). Refuse medical/financial/legal advice. End with 2–3 follow‑up suggestions.';
  }
}

async function getLessonText(docPath: string): Promise<string> {
  const db = admin.firestore();
  const snap = await db.doc(docPath).get();
  if (!snap.exists) throw new Error('Lesson not found');
  const d = snap.data() || {} as any;
  const raw = (d.md || d.html || '').toString();
  if (!raw) throw new Error('Lesson content empty');
  return raw;
}

async function getCachedEmbeddings(bucket: admin.storage.Storage, lessonKey: string): Promise<{ chunks: Chunk[]; vectors: number[][] } | null> {
  try {
    const b = admin.storage().bucket();
    const file = b.file(`indexes/lesson_${lessonKey}_embeddings.json`);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buf] = await file.download();
    const data = JSON.parse(buf.toString());
    return data;
  } catch { return null; }
}

async function putCachedEmbeddings(lessonKey: string, chunks: Chunk[], vectors: number[][]): Promise<void> {
  try {
    const b = admin.storage().bucket();
    const file = b.file(`indexes/lesson_${lessonKey}_embeddings.json`);
    await file.save(Buffer.from(JSON.stringify({ chunks, vectors })), { contentType: 'application/json' });
  } catch { /* best-effort */ }
}

function deriveLessonKey(docPath: string): string {
  return docPath.replace(/\//g, '_');
}

let usageCount = 0; // local-only counter (non-persistent)

export async function tutorHandler(req: any, res: any) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
  try {
    const { lessonId, question } = req.body || {};
    if (!lessonId || !question) { res.status(400).send('Missing lessonId/question'); return; }

    // Build canonical Firestore doc path
    let docPath: string;
    const parts = String(lessonId).split('/');
    if (parts.length === 6 && parts[0] === 'courses' && parts[2] === 'modules' && parts[4] === 'lessons') {
      docPath = lessonId;
    } else if (parts.length === 3) {
      docPath = `courses/${parts[0]}/modules/${parts[1]}/lessons/${parts[2]}`;
    } else { res.status(400).send('Invalid lessonId format'); return; }

    const lessonText = await getLessonText(docPath);

    // Chunking
    let chunks = chunkText(lessonText, 900, 100);
    if (chunks.length === 0) { res.status(422).send('Lesson content empty'); return; }

    // Secret key
    const key = process.env.OPENAI_API_KEY || OPENAI_API_KEY.value();
    if (!key) { res.status(500).send('OPENAI_API_KEY not configured'); return; }

    // Embedding cache (best-effort)
    const lessonKey = deriveLessonKey(docPath);
    let vectors: number[][] | null = null;
    let cached = await getCachedEmbeddings(admin.storage(), lessonKey);
    if (cached && cached.chunks?.length === chunks.length) {
      vectors = cached.vectors;
      chunks = cached.chunks; // ensure same ordering
    }

    // Compute embeddings (question + chunks)
    const inputs = [question, ...chunks.map(c => c.text)];
    const embs = await openAIEmbeddings(key, inputs);
    const qv = embs[0];
    const cv = embs.slice(1);
    if (!vectors) { vectors = cv; await putCachedEmbeddings(lessonKey, chunks, vectors); }

    // Rank top 4
    const ranked = chunks
      .map((c, i) => ({ c, score: cosine(qv, cv[i] || vectors![i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(x => x.c);

    // Build constrained context and messages
    const system = loadSystemPrompt();
    // Add section markers the model can cite (Lesson §<index>)
    let context = ranked.map((r, i) => `[(Lesson §${i + 1}) ${r.start}-${r.end}]\n${r.text}`).join('\n\n');

    // 8k token cap approximation
    const maxContextTokens = 8000;
    const ctxTokens = estTokensFromChars(context.length);
    if (ctxTokens > maxContextTokens) {
      const ratio = maxContextTokens / ctxTokens;
      const keep = Math.max(1000, Math.floor(context.length * ratio));
      context = context.slice(0, keep);
    }

    // Cost guard: truncate for ≤ $0.01 budget (conservative)
    // conservative token limits across models
    const maxOutputTokens = 600; // small cap for cost predictability
    // reduce context if extremely large
    if (estTokensFromChars(context.length) + maxOutputTokens > 8000) {
      const target = 8000 - maxOutputTokens;
      const approxChars = target * 4;
      context = context.slice(0, Math.max(1000, approxChars));
    }

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: `Lesson Context:\n${context}\n\nQuestion: ${question}` }
    ];

    // Stream out
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let streamed = false;
    for (const model of MODEL_FALLBACKS) {
      try {
        const r = await streamChat(key, model, messages, maxOutputTokens);
        if (!r.ok || !r.body) continue;
        const reader = (r.body as any).getReader?.();
        if (!reader) continue;
        const decoder = new TextDecoder('utf-8');
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          // SSE lines, extract delta
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) res.write(delta);
              streamed = true;
            } catch { /* ignore parse */ }
          }
        }
        if (streamed) break;
      } catch { /* try next model */ }
    }
    if (!streamed) res.write('Sorry, the tutor is temporarily unavailable.');
    res.end();

    // Local-only usage counter (not persisted)
    usageCount += 1;
  } catch (e: any) {
    res.status(500).send(e?.message || 'Tutor error');
  }
}

// Export helpers for tests
export const __internals = { cosine, chunkText, estTokensFromChars };

// Export the Firebase Function
export const tutor = onRequest({
  cors: true,
  region: 'us-central1',
  serviceAccount: 'firebase-app-hosting-compute@ai-integra-course-v2.iam.gserviceaccount.com',
  secrets: [OPENAI_API_KEY],
}, tutorHandler);
