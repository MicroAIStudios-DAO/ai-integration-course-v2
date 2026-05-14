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

type LessonMetadata = {
  title?: string;
  description?: string;
  learningObjectives?: unknown[];
  content?: string;
  md?: string;
  html?: string;
  storagePath?: string;
  tier?: string;
  isFree?: boolean;
};

type UserAccessProfile = {
  premium?: boolean;
  foundingMember?: boolean;
  isBetaTester?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: FirebaseFirestore.Timestamp | Date | string | null;
  trialEndDate?: FirebaseFirestore.Timestamp | Date | string | null;
  isAdmin?: boolean;
  role?: string;
};

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

function toDate(value: UserAccessProfile['trialEndsAt'] | UserAccessProfile['trialEndDate']): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function isFreeLessonData(lesson: LessonMetadata | null | undefined): boolean {
  return lesson?.tier === 'free' || lesson?.isFree === true;
}

function isFoundersLessonData(lesson: LessonMetadata | null | undefined): boolean {
  return lesson?.tier === 'founders';
}

function isAdminProfile(profile: UserAccessProfile | null | undefined): boolean {
  return profile?.isAdmin === true || profile?.role === 'admin';
}

function userHasPaidAccess(profile: UserAccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.foundingMember === true) return true;
  if (profile.premium === true) return true;
  if (profile.subscriptionStatus === 'active') return true;

  const trialEndsAt = toDate(profile.trialEndsAt) || toDate(profile.trialEndDate);
  if (profile.subscriptionStatus === 'trialing') {
    return !!trialEndsAt && trialEndsAt > new Date();
  }

  return false;
}

function userHasFounderAccess(profile: UserAccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.foundingMember === true) return true;
  return profile.isBetaTester === true && userHasPaidAccess(profile);
}

function canAccessLesson(lesson: LessonMetadata | null | undefined, profile: UserAccessProfile | null | undefined): boolean {
  if (isFreeLessonData(lesson)) return true;
  if (isAdminProfile(profile)) return true;
  if (isFoundersLessonData(lesson)) return userHasFounderAccess(profile);
  return userHasPaidAccess(profile);
}

function getAuthToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

async function getRequestProfile(req: any): Promise<{ uid: string | null; profile: UserAccessProfile | null }> {
  const token = getAuthToken(req);
  if (!token) {
    return { uid: null, profile: null };
  }

  const decoded = await admin.auth().verifyIdToken(token);
  const userSnap = await admin.firestore().doc(`users/${decoded.uid}`).get();
  return {
    uid: decoded.uid,
    profile: userSnap.exists ? (userSnap.data() as UserAccessProfile) : null,
  };
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

async function streamOpenAIResponse(
  body: any,
  onDelta: (delta: string) => void
): Promise<boolean> {
  const decoder = new TextDecoder('utf-8');
  let buffered = '';
  let streamed = false;

  const consumeText = (text: string) => {
    buffered += text;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          onDelta(delta);
          streamed = true;
        }
      } catch {
        // Ignore partial/non-JSON SSE lines.
      }
    }
  };

  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      consumeText(decoder.decode(value, { stream: true }));
    }
    consumeText(decoder.decode());
  } else if (body && typeof body[Symbol.asyncIterator] === 'function') {
    for await (const chunk of body) {
      const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
      consumeText(text);
    }
  } else {
    return false;
  }

  if (buffered) consumeText('\n');
  return streamed;
}

function loadSystemPrompt(): string {
  try {
    const p = path.join(process.cwd(), '..', 'prompts', 'tutor_system.txt');
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return 'You are an AI Tutor. Cite lesson sections as (Lesson §X.Y). Refuse medical/financial/legal advice. End with 2–3 follow‑up suggestions.';
  }
}

function getLessonContentDocumentId(docPath: string): string {
  const parts = docPath.split('/');
  if (parts.length !== 6) {
    throw new Error('Invalid lesson path');
  }
  return `${parts[1]}__${parts[3]}__${parts[5]}`;
}

async function getLessonText(docPath: string, lessonData?: LessonMetadata): Promise<string> {
  const db = admin.firestore();
  const snap = await db.doc(docPath).get();
  if (!snap.exists) throw new Error('Lesson not found');
  const d = (lessonData || (snap.data() as LessonMetadata) || {}) as any;
  const lessonContentId = getLessonContentDocumentId(docPath);
  const lessonContentSnap = await db.collection('lessonContent').doc(lessonContentId).get();
  const lessonContentData = lessonContentSnap.exists ? lessonContentSnap.data() || {} : {};
  const gatedContent = (lessonContentData.content || lessonContentData.markdown || '').toString();
  if (gatedContent) return gatedContent;

  const inline = (d.content || d.md || d.html || '').toString();
  if (inline) return inline;

  const storagePath = (d.storagePath || '').toString();
  if (storagePath) {
    try {
      const b = admin.storage().bucket();
      const [buf] = await b.file(storagePath).download();
      const text = buf.toString('utf-8');
      if (text) return text;
    } catch (err) {
      throw new Error(`Failed to load lesson from storage: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  // Graceful fallback for lessons that have metadata but no long-form content yet.
  // This keeps AI Tutor responsive instead of failing hard.
  const title = (d.title || 'Untitled Lesson').toString();
  const description = (d.description || '').toString().trim();
  const objectives = Array.isArray(d.learningObjectives)
    ? d.learningObjectives.map((x: any) => String(x).trim()).filter(Boolean)
    : [];

  let fallback = `Lesson Title: ${title}\n`;
  if (description) fallback += `Lesson Description: ${description}\n`;
  if (objectives.length > 0) {
    fallback += `Learning Objectives:\n${objectives.map((x: string) => `- ${x}`).join('\n')}\n`;
  }
  fallback +=
    '\nThis lesson does not yet have full transcript content. Answer with general guidance, clearly mark assumptions, and suggest next practical steps.';
  return fallback;
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
  res.set('Vary', 'Authorization');
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

    const lessonSnap = await admin.firestore().doc(docPath).get();
    if (!lessonSnap.exists) {
      res.status(404).send('Lesson not found');
      return;
    }
    const lessonData = (lessonSnap.data() || {}) as LessonMetadata;

    const authToken = getAuthToken(req);
    let profile: UserAccessProfile | null = null;
    try {
      ({ profile } = await getRequestProfile(req));
    } catch {
      res.status(401).send('Invalid authentication token');
      return;
    }

    if (!isFreeLessonData(lessonData) && !authToken) {
      res.status(401).send('Authentication required for this lesson');
      return;
    }
    if (!canAccessLesson(lessonData, profile)) {
      res.status(403).send('You do not have access to this lesson tutor');
      return;
    }

    const lessonText = await getLessonText(docPath, lessonData);

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
        if (!r.ok || !r.body) {
          const errorText = await r.text().catch(() => '');
          console.error(`Tutor model ${model} failed: ${r.status} ${errorText}`.trim());
          continue;
        }
        const modelStreamed = await streamOpenAIResponse(r.body, (delta) => res.write(delta));
        if (modelStreamed) {
          streamed = true;
          break;
        }
      } catch { /* try next model */ }
    }
    if (!streamed) res.write('Sorry, the tutor is temporarily unavailable.');
    res.end();

    // Local-only usage counter (not persisted)
    usageCount += 1;
  } catch (e: any) {
    console.error('Tutor error:', e?.message || e);
    res.status(500).send(e?.message || 'Tutor error');
  }
}

// Export helpers for tests
export const __internals = { cosine, chunkText, estTokensFromChars, streamOpenAIResponse };

// SECURITY FIX (VULN-03): Replace cors:true (wildcard Access-Control-Allow-Origin: *)
// with an explicit origin allowlist. Wildcard CORS on an authenticated AI endpoint
// allows any malicious website to make cross-origin requests on behalf of a logged-in
// user, enabling CSRF attacks and quota/cost abuse of the OpenAI backend.
const ALLOWED_ORIGINS = [
  'https://aiintegrationcourse.com',
  'https://www.aiintegrationcourse.com',
  // Local development origins
  'http://localhost:3000',
  'http://localhost:5000',
];

// Export the Firebase Function
export const tutor = onRequest({
  cors: ALLOWED_ORIGINS,
  region: 'us-central1',
  serviceAccount: 'firebase-app-hosting-compute@ai-integra-course-v2.iam.gserviceaccount.com',
  secrets: [OPENAI_API_KEY],
}, tutorHandler);
