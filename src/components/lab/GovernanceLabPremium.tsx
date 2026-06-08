/**
 * GovernanceLabPremium.tsx — Premium Governance Lab with ProofGuard Integration
 *
 * This is the production-grade version of the Governance Lab that integrates:
 * - Per-student Flowise instance provisioning
 * - ProofGuard Attestation Bridge (Firebase Callable) for CQS scoring
 * - Industry-specific compliance targeting (IMDA/AICM)
 * - AI Tutor state-aware coaching based on audit results
 * - Correct LabTelemetry contract for the Adaptive Learning Engine
 *
 * This component is the "Build-and-Verify" experience that replaces
 * the traditional "Read-the-Docs" model.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { AITutorChat } from './AITutorChat';
import { ProofGuardAuditor } from './ProofGuardAuditor';
import { useAuth } from '../../context/AuthContext';
import { useAdaptiveLearning } from '../../context/AdaptiveLearningContext';
import type { LabTelemetry } from '../../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ConceptGraphNode {
  nodeId: string;
  title: string;
  description?: string;
}

interface GovernanceLabPremiumProps {
  lessonId: string;
  conceptGraphNode: ConceptGraphNode;
}

interface AttestationResponse {
  cqsScore: number;
  attestationId: string;
  timestamp: string;
  complianceTarget: string;
  passed: boolean;
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    recommendation: string;
    aicmControl?: string;
  }>;
  attestationHash?: string;
  tenonGatewayId?: string;
  recommendations: string[];
  attestationRecordId: string;
  competencyUpdate: {
    nodeId: string;
    newStatus: string;
    unlockedNodes: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function GovernanceLabPremium({ lessonId, conceptGraphNode }: GovernanceLabPremiumProps) {
  const { currentUser } = useAuth();
  const { studentProfile, updateLabTelemetry, markNodeMastered } = useAdaptiveLearning();

  // Lab state
  const [labState, setLabState] = useState<'building' | 'auditing' | 'passed' | 'failed'>('building');
  const [auditReport, setAuditReport] = useState<AttestationResponse | null>(null);
  const [auditHistory, setAuditHistory] = useState<AttestationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Telemetry tracking
  const labStartTime = useRef(Date.now());
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [flowiseNodesUsed, setFlowiseNodesUsed] = useState<string[]>([]);

  // Per-student Flowise instance provisioned via cloud infrastructure
  const tenantId = currentUser?.uid?.slice(0, 8) || 'default';
  const FLOWISE_INSTANCE_URL = `https://flowise.aiintegrationcourse.com/canvas?tenant=${tenantId}&labId=${conceptGraphNode.nodeId}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Listen for Flowise postMessage events (node configuration updates)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from our Flowise domain
      if (event.origin.includes('flowise.aiintegrationcourse.com')) {
        if (event.data?.type === 'flowise-node-update') {
          const nodeTypes = event.data.nodes?.map((n: any) => n.type) || [];
          setFlowiseNodesUsed(prev => {
            const combined = new Set([...prev, ...nodeTypes]);
            return Array.from(combined);
          });
        }
        if (event.data?.type === 'flowise-export') {
          // Student clicked "Export for Audit" in Flowise
          handleRunProofGuardAudit(event.data.flowJson);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ProofGuard Attestation via Firebase Callable (attestAgent)
  // ─────────────────────────────────────────────────────────────────────────

  const handleRunProofGuardAudit = useCallback(async (flowiseExportJson?: any) => {
    if (!currentUser) {
      setError('You must be logged in to run an attestation.');
      return;
    }

    setLabState('auditing');
    setError(null);

    try {
      // Call the attestAgent Firebase Callable Function
      // This handles auth automatically via Firebase SDK
      const attestAgent = httpsCallable<any, AttestationResponse>(functions, 'attestAgent');

      const result = await attestAgent({
        agentDefinition: flowiseExportJson || {},
        complianceTarget: 'IMDA/AICM',
        studentContext: studentProfile?.industryContext || 'General',
        labId: conceptGraphNode.nodeId,
      });

      const attestation = result.data;
      setAuditReport(attestation);
      setAuditHistory(prev => [attestation, ...prev]);

      if (attestation.passed) {
        setLabState('passed');
        setConsecutiveFailures(0);

        // Mark node as mastered in the competency graph (client-side optimistic update)
        markNodeMastered(conceptGraphNode.nodeId);
      } else {
        setLabState('failed');
        setConsecutiveFailures(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('[GovernanceLabPremium] Attestation failed:', err);
      setLabState('failed');
      setConsecutiveFailures(prev => prev + 1);

      // Parse Firebase callable error
      if (err.code === 'functions/unauthenticated') {
        setError('Session expired. Please refresh and try again.');
      } else if (err.code === 'functions/resource-exhausted') {
        setError('Rate limit reached. Please wait a moment before trying again.');
      } else {
        setError(err.message || 'Attestation failed. Please try again.');
      }
    }
  }, [currentUser, studentProfile, conceptGraphNode.nodeId, markNodeMastered]);

  // ─────────────────────────────────────────────────────────────────────────
  // Update Lab Telemetry (correct LabTelemetry contract)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const passed = auditHistory.filter(a => a.passed).length;
    const failed = auditHistory.filter(a => !a.passed).length;

    const telemetry: LabTelemetry = {
      labId: conceptGraphNode.nodeId,
      proofguardAuditsPassed: passed,
      proofguardAuditsFailed: failed,
      consecutiveFailures,
      lastFailureReason: auditHistory.find(a => !a.passed)?.vulnerabilities?.[0]?.description || null,
      completionTimeMs: labState === 'passed' ? Date.now() - labStartTime.current : null,
      averageCompletionTimeMs: 45 * 60 * 1000, // 45 min default — replaced by backend average
      flowiseNodesUsed,
    };

    updateLabTelemetry(telemetry);
  }, [auditHistory, consecutiveFailures, labState, flowiseNodesUsed, conceptGraphNode.nodeId, updateLabTelemetry]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full bg-slate-900 text-slate-100">

      {/* LEFT PANE: Premium Personalized Coaching */}
      <div className="w-1/3 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            {conceptGraphNode.title}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Tailored for your focus in {studentProfile?.industryContext || 'AI Integration'}
          </p>
          {auditReport && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Latest CQS:</span>
              <span className={`text-sm font-bold ${
                auditReport.cqsScore >= 90 ? 'text-green-400' :
                auditReport.cqsScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {auditReport.cqsScore}/100
              </span>
              {auditReport.passed && (
                <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full">
                  Certified
                </span>
              )}
            </div>
          )}
        </div>

        {/* The Proactive LangGraph Tutor */}
        <div className="flex-1 overflow-y-auto p-4">
          <AITutorChat
            studentProfile={studentProfile}
            currentLabState={labState}
            auditFeedback={auditReport}
          />
        </div>
      </div>

      {/* RIGHT PANE: The Integrated Workspace */}
      <div className="w-2/3 flex flex-col relative">

        {/* Embedded Flowise UI */}
        <div className="flex-1 w-full bg-slate-800">
          <iframe
            src={FLOWISE_INSTANCE_URL}
            className="w-full h-full border-none"
            title="Flowise Workspace"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allow="clipboard-write"
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="absolute top-4 right-4 max-w-sm bg-red-900/90 border border-red-500/50 rounded-lg p-3 shadow-lg">
            <p className="text-xs text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Bar: ProofGuard Integration */}
        <div className="h-20 bg-slate-900 border-t border-slate-700 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-slate-300">Proof-of-Agent&trade; Status:</span>
            {labState === 'building' && <span className="text-yellow-400">Awaiting Audit</span>}
            {labState === 'auditing' && <span className="text-blue-400 animate-pulse">Running Attestation...</span>}
            {labState === 'passed' && <span className="text-green-400 font-bold">&check; CQS Compliant ({auditReport?.cqsScore}/100)</span>}
            {labState === 'failed' && (
              <span className="text-red-400 font-bold">
                &loz; Vulnerabilities Detected ({auditReport?.vulnerabilities?.length || 0} issues)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Attempt counter */}
            <span className="text-xs text-slate-500">
              Attempts: {auditHistory.length}
            </span>

            <button
              onClick={() => handleRunProofGuardAudit()}
              disabled={labState === 'auditing'}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {labState === 'auditing' ? 'Running Attestation...' : 'Audit Agent Architecture'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
