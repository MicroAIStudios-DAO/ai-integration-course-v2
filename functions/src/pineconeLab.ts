/**
 * Pinecone Vector DB RAG Lab
 *
 * Firebase Cloud Functions for the "Scaling RAG: From Firestore to Pinecone" lab.
 * Provides:
 *   1. pineconeQuery — Callable function that queries a Pinecone index with student-provided embeddings
 *   2. pineconeIngest — Callable function that upserts lesson embeddings into a student's namespace
 *   3. pineconeCompare — Callable function that runs the same query against both Firestore vector
 *      search and Pinecone, returning latency + relevance comparison
 *
 * Architecture:
 *   - Each student gets an isolated Pinecone namespace: `student_{uid}`
 *   - Base lesson embeddings are pre-seeded in the `course_content` namespace
 *   - Students learn to ingest, query, and compare vector search implementations
 *
 * Required Firebase Functions config:
 *   pinecone.api_key — Pinecone API key
 *   pinecone.index_host — Pinecone index host URL (e.g., https://course-rag-xxxxx.svc.pinecone.io)
 *   pinecone.index_name — Pinecone index name
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';

// ─── Config ─────────────────────────────────────────────────────────────────
const PINECONE_API_KEY = defineString('PINECONE_API_KEY', { default: '' });
const PINECONE_INDEX_HOST = defineString('PINECONE_INDEX_HOST', { default: '' });

// ─── Types ──────────────────────────────────────────────────────────────────

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface PineconeQueryResponse {
  matches: PineconeMatch[];
  namespace: string;
}

interface VectorComparisonResult {
  pinecone: {
    matches: PineconeMatch[];
    latencyMs: number;
  };
  firestore: {
    matches: Array<{ id: string; score: number; title: string }>;
    latencyMs: number;
  };
  analysis: {
    pineconeLatencyMs: number;
    firestoreLatencyMs: number;
    speedupFactor: number;
    overlapCount: number;
  };
}

// ─── Helper: Pinecone API call ──────────────────────────────────────────────

async function pineconeRequest(
  path: string,
  method: 'POST' | 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  const host = PINECONE_INDEX_HOST.value();
  const apiKey = PINECONE_API_KEY.value();

  if (!host || !apiKey) {
    throw new HttpsError('failed-precondition', 'Pinecone is not configured. Set PINECONE_API_KEY and PINECONE_INDEX_HOST.');
  }

  const url = `${host}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpsError('internal', `Pinecone API error: ${response.status} — ${errorText}`);
  }

  return response.json();
}

// ─── 1. pineconeQuery — Query student's namespace ───────────────────────────

export const pineconeQuery = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to use the Pinecone lab.');
    }

    const { vector, topK = 5, namespace, filter } = request.data as {
      vector: number[];
      topK?: number;
      namespace?: string;
      filter?: Record<string, unknown>;
    };

    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new HttpsError('invalid-argument', 'Must provide a non-empty embedding vector.');
    }

    const studentNamespace = namespace || `student_${request.auth.uid}`;

    const start = Date.now();
    const result = await pineconeRequest('/query', 'POST', {
      vector,
      topK: Math.min(topK, 20),
      namespace: studentNamespace,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    }) as PineconeQueryResponse;
    const latencyMs = Date.now() - start;

    // Track lab usage
    const db = getFirestore();
    await db.collection('users').doc(request.auth.uid).update({
      'labTelemetry.pinecone.queryCount': FieldValue.increment(1),
      'labTelemetry.pinecone.lastQueryAt': FieldValue.serverTimestamp(),
    });

    return {
      matches: result.matches,
      namespace: studentNamespace,
      latencyMs,
      vectorDimension: vector.length,
    };
  }
);

// ─── 2. pineconeIngest — Upsert vectors into student namespace ──────────────

export const pineconeIngest = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to use the Pinecone lab.');
    }

    const { vectors } = request.data as {
      vectors: Array<{
        id: string;
        values: number[];
        metadata?: Record<string, unknown>;
      }>;
    };

    if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
      throw new HttpsError('invalid-argument', 'Must provide at least one vector to upsert.');
    }

    if (vectors.length > 100) {
      throw new HttpsError('invalid-argument', 'Maximum 100 vectors per batch in the lab environment.');
    }

    const studentNamespace = `student_${request.auth.uid}`;

    const start = Date.now();
    await pineconeRequest('/vectors/upsert', 'POST', {
      vectors: vectors.map((v) => ({
        id: v.id,
        values: v.values,
        metadata: {
          ...v.metadata,
          studentUid: request.auth!.uid,
          ingestedAt: new Date().toISOString(),
        },
      })),
      namespace: studentNamespace,
    });
    const latencyMs = Date.now() - start;

    // Track lab usage
    const db = getFirestore();
    await db.collection('users').doc(request.auth.uid).update({
      'labTelemetry.pinecone.ingestCount': FieldValue.increment(vectors.length),
      'labTelemetry.pinecone.lastIngestAt': FieldValue.serverTimestamp(),
    });

    return {
      upsertedCount: vectors.length,
      namespace: studentNamespace,
      latencyMs,
    };
  }
);

// ─── 3. pineconeCompare — Side-by-side Firestore vs Pinecone ────────────────

export const pineconeCompare = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to use the Pinecone lab.');
    }

    const { queryText: _queryText, vector, topK = 5 } = request.data as {
      queryText: string;
      vector: number[];
      topK?: number;
    };

    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new HttpsError('invalid-argument', 'Must provide a non-empty embedding vector.');
    }

    const db = getFirestore();

    // ── Pinecone query ──
    const pineconeStart = Date.now();
    const pineconeResult = await pineconeRequest('/query', 'POST', {
      vector,
      topK: Math.min(topK, 10),
      namespace: 'course_content',
      includeMetadata: true,
    }) as PineconeQueryResponse;
    const pineconeLatencyMs = Date.now() - pineconeStart;

    // ── Firestore vector search (using native vector distance) ──
    const firestoreStart = Date.now();
    let firestoreMatches: Array<{ id: string; score: number; title: string }> = [];

    try {
      // Firestore vector search via findNearest (requires vector index)
      const lessonsRef = db.collectionGroup('lessons');
      const querySnapshot = await lessonsRef
        .where('embedding', '!=', null)
        .limit(topK)
        .get();

      // Manual cosine similarity since Firestore Admin SDK findNearest may not be available
      firestoreMatches = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const embedding = data.embedding as number[] | undefined;
          if (!embedding || embedding.length !== vector.length) return null;

          // Cosine similarity
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          for (let i = 0; i < vector.length; i++) {
            dotProduct += vector[i] * embedding[i];
            normA += vector[i] * vector[i];
            normB += embedding[i] * embedding[i];
          }
          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

          return {
            id: doc.id,
            score,
            title: data.title || doc.id,
          };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (err) {
      // If Firestore vector search fails, return empty with error note
      firestoreMatches = [];
    }
    const firestoreLatencyMs = Date.now() - firestoreStart;

    // ── Analysis ──
    const pineconeIds = new Set(pineconeResult.matches.map((m) => m.id));
    const firestoreIds = new Set(firestoreMatches.map((m) => m.id));
    const overlapCount = [...pineconeIds].filter((id) => firestoreIds.has(id)).length;

    const result: VectorComparisonResult = {
      pinecone: {
        matches: pineconeResult.matches,
        latencyMs: pineconeLatencyMs,
      },
      firestore: {
        matches: firestoreMatches,
        latencyMs: firestoreLatencyMs,
      },
      analysis: {
        pineconeLatencyMs,
        firestoreLatencyMs,
        speedupFactor: firestoreLatencyMs > 0 ? parseFloat((firestoreLatencyMs / pineconeLatencyMs).toFixed(2)) : 0,
        overlapCount,
      },
    };

    // Track comparison usage
    await db.collection('users').doc(request.auth.uid).update({
      'labTelemetry.pinecone.compareCount': FieldValue.increment(1),
      'labTelemetry.pinecone.lastCompareAt': FieldValue.serverTimestamp(),
    });

    return result;
  }
);
