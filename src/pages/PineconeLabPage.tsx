import React, { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface ComparisonResult {
  pinecone: { matches: PineconeMatch[]; latencyMs: number };
  firestore: { matches: Array<{ id: string; score: number; title: string }>; latencyMs: number };
  analysis: { pineconeLatencyMs: number; firestoreLatencyMs: number; speedupFactor: number; overlapCount: number };
}

type LabStep = 'intro' | 'ingest' | 'query' | 'compare' | 'results';

// ─── Component ──────────────────────────────────────────────────────────────

const PineconeLabPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<LabStep>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('How do I build a governed AI agent?');
  const [ingestResult, setIngestResult] = useState<{ upsertedCount: number; latencyMs: number } | null>(null);
  const [queryResult, setQueryResult] = useState<{ matches: PineconeMatch[]; latencyMs: number } | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Generate a simple embedding (in production, use OpenAI/Gemini embedding API)
  const generateMockEmbedding = useCallback((text: string): number[] => {
    // Deterministic pseudo-embedding based on text hash (768 dimensions for text-embedding-3-small)
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 768 }, (_, i) => {
      const x = Math.sin(seed * (i + 1) * 0.001) * Math.cos(i * 0.01);
      return parseFloat(x.toFixed(6));
    });
  }, []);

  // ─── Step 2: Ingest sample vectors ─────────────────────────────────────────

  const handleIngest = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const sampleDocs = [
        { id: 'lesson-governance-intro', text: 'Introduction to AI governance and trust architecture', metadata: { module: 'governance', lesson: 1 } },
        { id: 'lesson-proofguard-basics', text: 'ProofGuard attestation and audit trail fundamentals', metadata: { module: 'governance', lesson: 2 } },
        { id: 'lesson-rag-architecture', text: 'Building retrieval-augmented generation systems with vector databases', metadata: { module: 'infrastructure', lesson: 1 } },
        { id: 'lesson-langchain-agents', text: 'Multi-step agent workflows with LangChain and LangGraph', metadata: { module: 'orchestration', lesson: 1 } },
        { id: 'lesson-mcp-protocol', text: 'Model Context Protocol for agentic interoperability', metadata: { module: 'infrastructure', lesson: 2 } },
      ];

      const vectors = sampleDocs.map((doc) => ({
        id: doc.id,
        values: generateMockEmbedding(doc.text),
        metadata: { ...doc.metadata, text: doc.text },
      }));

      const pineconeIngest = httpsCallable(functions, 'pineconeIngest');
      const result = await pineconeIngest({ vectors });
      setIngestResult(result.data as { upsertedCount: number; latencyMs: number });
      setStep('query');
    } catch (err: any) {
      setError(err.message || 'Failed to ingest vectors');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Query Pinecone ────────────────────────────────────────────────

  const handleQuery = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const vector = generateMockEmbedding(queryText);
      const pineconeQueryFn = httpsCallable(functions, 'pineconeQuery');
      const result = await pineconeQueryFn({ vector, topK: 5 });
      setQueryResult(result.data as { matches: PineconeMatch[]; latencyMs: number });
      setStep('compare');
    } catch (err: any) {
      setError(err.message || 'Failed to query Pinecone');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: Compare Pinecone vs Firestore ────────────────────────────────

  const handleCompare = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const vector = generateMockEmbedding(queryText);
      const pineconeCompareFn = httpsCallable(functions, 'pineconeCompare');
      const result = await pineconeCompareFn({ queryText, vector, topK: 5 });
      setComparisonResult(result.data as ComparisonResult);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to run comparison');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-400">Please log in to access the Pinecone RAG Lab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Scaling RAG: Firestore to Pinecone</h1>
              <p className="text-slate-400 text-sm">Advanced Infrastructure Lab</p>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-3xl">
            In this hands-on lab, you will migrate a RAG pipeline from Firestore's built-in vector search 
            to a dedicated vector database (Pinecone). You will ingest embeddings, run semantic queries, 
            and compare latency and relevance between the two approaches.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {(['intro', 'ingest', 'query', 'compare', 'results'] as LabStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-teal-500 text-white scale-110' :
                (['intro', 'ingest', 'query', 'compare', 'results'].indexOf(step) > i) ? 'bg-teal-500/30 text-teal-300' :
                'bg-slate-700 text-slate-500'
              }`}>
                {i + 1}
              </div>
              {i < 4 && <div className={`w-8 h-0.5 ${(['intro', 'ingest', 'query', 'compare', 'results'].indexOf(step) > i) ? 'bg-teal-500/50' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {/* Step 1: Introduction */}
          {step === 'intro' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Why Dedicated Vector Databases?</h2>
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-slate-300">
                  Firestore's native vector search is excellent for prototyping — it keeps your stack simple 
                  and avoids additional infrastructure. But as your corpus grows beyond 10,000 documents, 
                  you'll encounter limitations:
                </p>
                <ul className="text-slate-300 space-y-2 mt-4">
                  <li><strong className="text-teal-400">Latency:</strong> Pinecone uses HNSW indexes optimized for ANN search — typically 10-50ms vs 100-500ms for Firestore at scale</li>
                  <li><strong className="text-teal-400">Metadata Filtering:</strong> Pinecone supports complex filter expressions alongside vector similarity</li>
                  <li><strong className="text-teal-400">Namespaces:</strong> Logical isolation for multi-tenant RAG (each student gets their own namespace)</li>
                  <li><strong className="text-teal-400">Hybrid Search:</strong> Combine dense vectors with sparse (BM25) for better retrieval</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-600/30">
                <h3 className="text-lg font-semibold text-white mb-3">Architecture Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <h4 className="text-orange-400 font-semibold mb-2">Firestore Vector Search</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>+ Zero additional infrastructure</li>
                      <li>+ Integrated with existing Firestore queries</li>
                      <li>- Limited to ~10K vectors efficiently</li>
                      <li>- No namespace isolation</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <h4 className="text-teal-400 font-semibold mb-2">Pinecone (Dedicated VectorDB)</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>+ Sub-50ms at millions of vectors</li>
                      <li>+ Namespace isolation per tenant</li>
                      <li>+ Advanced metadata filtering</li>
                      <li>- Additional service to manage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('ingest')}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all"
              >
                Start Lab: Ingest Vectors →
              </button>
            </div>
          )}

          {/* Step 2: Ingest */}
          {step === 'ingest' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 1: Ingest Embeddings into Pinecone</h2>
              <p className="text-slate-300 mb-6">
                We'll upsert 5 sample lesson embeddings into your isolated Pinecone namespace. 
                Each student gets their own namespace (<code className="text-teal-400">student_{'{uid}'}</code>) 
                so your data never collides with other learners.
              </p>

              <div className="bg-slate-900/80 rounded-xl p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-300">
{`// Pinecone upsert payload
{
  vectors: [
    { id: "lesson-governance-intro", values: [0.012, -0.034, ...], metadata: { module: "governance" } },
    { id: "lesson-proofguard-basics", values: [0.045, 0.012, ...], metadata: { module: "governance" } },
    { id: "lesson-rag-architecture", values: [-0.023, 0.067, ...], metadata: { module: "infrastructure" } },
    ...
  ],
  namespace: "student_\${uid}"
}`}
                </pre>
              </div>

              {ingestResult && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <p className="text-emerald-400 font-semibold">Ingestion Complete</p>
                  <p className="text-slate-300 text-sm mt-1">
                    Upserted {ingestResult.upsertedCount} vectors in {ingestResult.latencyMs}ms
                  </p>
                </div>
              )}

              <button
                onClick={handleIngest}
                disabled={loading}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Ingesting...' : 'Ingest Sample Vectors'}
              </button>
            </div>
          )}

          {/* Step 3: Query */}
          {step === 'query' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 2: Semantic Query</h2>
              <p className="text-slate-300 mb-6">
                Now query your namespace with a natural language question. The system will embed your query 
                and find the most semantically similar lesson content.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Query Text</label>
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  placeholder="Enter a natural language query..."
                />
              </div>

              {queryResult && (
                <div className="mb-6 p-4 bg-slate-900/50 border border-slate-600/30 rounded-xl">
                  <p className="text-teal-400 font-semibold mb-3">Query Results ({queryResult.latencyMs}ms)</p>
                  <div className="space-y-2">
                    {queryResult.matches.map((match, i) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                          <span className="text-sm text-slate-200">{match.id}</span>
                        </div>
                        <span className="text-xs font-mono text-teal-400">{(match.score * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleQuery}
                disabled={loading || !queryText.trim()}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Querying...' : 'Run Semantic Query'}
              </button>
            </div>
          )}

          {/* Step 4: Compare */}
          {step === 'compare' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Step 3: Pinecone vs Firestore Comparison</h2>
              <p className="text-slate-300 mb-6">
                Now the real test — run the same query against both Pinecone and Firestore's vector search 
                to see the latency and relevance differences in real-time.
              </p>

              <button
                onClick={handleCompare}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Running comparison...' : 'Run Head-to-Head Comparison'}
              </button>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 'results' && comparisonResult && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Comparison Results</h2>

              {/* Latency comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-center">
                  <p className="text-xs uppercase tracking-wider text-teal-400 mb-1">Pinecone Latency</p>
                  <p className="text-3xl font-bold text-white">{comparisonResult.analysis.pineconeLatencyMs}ms</p>
                </div>
                <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center">
                  <p className="text-xs uppercase tracking-wider text-orange-400 mb-1">Firestore Latency</p>
                  <p className="text-3xl font-bold text-white">{comparisonResult.analysis.firestoreLatencyMs}ms</p>
                </div>
                <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                  <p className="text-xs uppercase tracking-wider text-purple-400 mb-1">Speedup Factor</p>
                  <p className="text-3xl font-bold text-white">{comparisonResult.analysis.speedupFactor}x</p>
                </div>
              </div>

              {/* Side-by-side results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-teal-400 mb-3">Pinecone Results</h3>
                  <div className="space-y-2">
                    {comparisonResult.pinecone.matches.map((match, i) => (
                      <div key={match.id} className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-200">{match.id}</span>
                          <span className="text-xs font-mono text-teal-400">{(match.score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-3">Firestore Results</h3>
                  <div className="space-y-2">
                    {comparisonResult.firestore.matches.length > 0 ? (
                      comparisonResult.firestore.matches.map((match, i) => (
                        <div key={match.id} className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-200">{match.title || match.id}</span>
                            <span className="text-xs font-mono text-orange-400">{(match.score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No Firestore vector results (embeddings may not be indexed)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Overlap analysis */}
              <div className="mt-8 p-6 bg-slate-900/50 border border-slate-600/30 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Analysis</h3>
                <p className="text-slate-300">
                  <strong className="text-purple-400">{comparisonResult.analysis.overlapCount}</strong> documents 
                  appeared in both result sets. Pinecone was <strong className="text-teal-400">{comparisonResult.analysis.speedupFactor}x faster</strong> than 
                  Firestore for this query. At scale (100K+ documents), this gap widens significantly due to 
                  Pinecone's HNSW indexing vs Firestore's brute-force approach.
                </p>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setStep('intro'); setComparisonResult(null); setQueryResult(null); setIngestResult(null); }}
                className="mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
              >
                Restart Lab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PineconeLabPage;
