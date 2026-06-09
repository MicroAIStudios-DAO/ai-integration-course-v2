/**
 * GovernanceLab.tsx — The "Build-and-Verify" Lab Layout (Code Review v2)
 *
 * Addresses all code review requirements:
 * 1. Split-pane view: AI Tutor on the left, Flowise iframe on the right
 * 2. Proof-of-Agent action bar at the bottom
 * 3. Imports modular AITutorChat and ProofGuardAuditor from same directory
 * 4. Uses Firebase httpsCallable (attestAgent) instead of direct API calls
 * 5. Maintains lab telemetry for the Adaptive Learning Engine
 *
 * Route: /lab/:labId (rendered by GovernanceLabPage.tsx)
 * Props: lessonId, labId, conceptGraphNode passed from route wrapper
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { useAdaptiveLearning } from '../../context/AdaptiveLearningContext';
import { AITutorChat } from './AITutorChat';
import { ProofGuardAuditor } from './ProofGuardAuditor';
import type { LabTelemetry, StudentProfile } from '../../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface GovernanceLabProps {
  lessonId: string;
  labId: string;
  conceptGraphNode?: string;       // DAG node ID for competency tracking
  lessonContent: React.ReactNode;  // Pre-rendered lesson markdown
  flowiseUrl?: string;
  premium?: boolean;
  hasAccess?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Attestation Types (mirrors proofguardBridge.ts response)
// ─────────────────────────────────────────────────────────────────────────────

interface Vulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  recommendation: string;
  aicmControl?: string;
  imda_principle?: string;
}

interface AttestationResult {
  cqsScore: number;
  attestationId: string;
  timestamp: string;
  complianceTarget: string;
  passed: boolean;
  vulnerabilities: Vulnerability[];
  attestationHash?: string;
  tenonGatewayId?: string;
  recommendations: string[];
  attestationRecordId?: string;
  competencyUpdate?: {
    nodeId: string;
    newStatus: string;
    unlockedNodes: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const GovernanceLab: React.FC<GovernanceLabProps> = ({
  lessonId,
  labId,
  conceptGraphNode,
  lessonContent,
  flowiseUrl = 'https://flowise.aiintegrationcourse.com',
  premium = false,
  hasAccess = true,
}) => {
  const { updateLabTelemetry, studentProfile } = useAdaptiveLearning();

  // ─── Attestation State ───────────────────────────────────────────────────
  const [attestationResult, setAttestationResult] = useState<AttestationResult | null>(null);
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationError, setAttestationError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // ─── Lab Telemetry State ─────────────────────────────────────────────────
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [totalPassed, setTotalPassed] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [lastFailureReason, setLastFailureReason] = useState<string | null>(null);
  const [flowiseNodesUsed, setFlowiseNodesUsed] = useState<string[]>([]);

  // ─── Split Pane State ────────────────────────────────────────────────────
  const [splitPosition, setSplitPosition] = useState(50);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ─── Bottom Panel State ──────────────────────────────────────────────────
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);

  // ─── Lab State (for AITutorChat proactive coaching) ──────────────────────
  const [currentLabState, setCurrentLabState] = useState<'building' | 'auditing' | 'passed' | 'failed'>('building');

  // ─── Firebase Callable Reference ─────────────────────────────────────────
  const functions = getFunctions(getApp(), 'us-central1');
  const attestAgentFn = httpsCallable(functions, 'attestAgent');

  // ─────────────────────────────────────────────────────────────────────────
  // Split Pane Resize Logic
  // ─────────────────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const container = dividerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(25, Math.min(75, newPosition)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Listen for Flowise postMessage events (node configuration updates)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Flowise sends node updates when student configures their workflow
      if (event.data?.type === 'flowise-node-update' && event.data?.nodes) {
        setFlowiseNodesUsed(event.data.nodes);
      }
      // Flowise sends the full agent export for attestation
      if (event.data?.type === 'flowise-export-ready') {
        handleAttestation(event.data.agentDefinition);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Attestation via Firebase Callable (httpsCallable → attestAgent)
  // ─────────────────────────────────────────────────────────────────────────

  const handleAttestation = async (agentDefinition?: Record<string, unknown>) => {
    if (!agentDefinition) {
      // Request export from Flowise iframe
      const iframe = document.querySelector<HTMLIFrameElement>('.flowise-workspace-iframe');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'request-export' }, '*');
        return; // Will be called again via flowise-export-ready message
      }
      setAttestationError('Unable to communicate with Flowise workspace. Please try again.');
      return;
    }

    setAttestationLoading(true);
    setAttestationError(null);
    setCurrentLabState('auditing');

    try {
      const response = await attestAgentFn({
        agentDefinition,
        complianceTarget: 'IMDA/AICM',
        studentContext: '', // Populated by backend from StudentProfile
        labId: conceptGraphNode || labId,
      });

      const result = response.data as AttestationResult;
      setAttestationResult(result);
      setAttemptCount((prev) => prev + 1);
      setBottomPanelExpanded(true);
      setCurrentLabState(result.passed ? 'passed' : 'failed');

      // Update telemetry counters
      if (result.passed) {
        setTotalPassed((prev) => prev + 1);
        setConsecutiveFailures(0);
        setLastFailureReason(null);
      } else {
        setTotalFailed((prev) => prev + 1);
        setConsecutiveFailures((prev) => prev + 1);
        const topVuln = result.vulnerabilities?.[0];
        setLastFailureReason(
          topVuln ? `${topVuln.category}: ${topVuln.description}` : 'Audit failed'
        );
      }
    } catch (err: any) {
      const message = err?.message || 'Attestation failed. Please try again.';
      setAttestationError(message);
      setTotalFailed((prev) => prev + 1);
      setConsecutiveFailures((prev) => prev + 1);
      setLastFailureReason(message);
    } finally {
      setAttestationLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Update Lab Telemetry for the Adaptive Learning Engine
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const telemetry: LabTelemetry = {
      labId,
      proofguardAuditsPassed: totalPassed,
      proofguardAuditsFailed: totalFailed,
      consecutiveFailures,
      lastFailureReason,
      completionTimeMs: null,
      averageCompletionTimeMs: 45 * 60 * 1000,
      flowiseNodesUsed,
    };
    updateLabTelemetry(telemetry);
  }, [labId, totalPassed, totalFailed, consecutiveFailures, lastFailureReason, flowiseNodesUsed, updateLabTelemetry]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="governance-lab h-[calc(100vh-4rem)] flex flex-col bg-slate-900">
      {/* ═══ Lab Header ═══ */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔬</span>
          <div>
            <h2 className="text-sm font-semibold">Governance Lab</h2>
            <p className="text-xs text-slate-400">Build · Verify · Certify</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {attestationResult?.cqsScore != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">CQS:</span>
              <span className={`text-sm font-bold ${
                attestationResult.cqsScore >= 90 ? 'text-green-400' :
                attestationResult.cqsScore >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {attestationResult.cqsScore}/100
              </span>
            </div>
          )}
          <span className="text-xs text-slate-500">Attempts: {attemptCount}</span>
        </div>
      </div>

      {/* ═══ Main Split Pane ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Pane: AI Tutor + Lesson Content ─── */}
        <div
          className="flex flex-col overflow-hidden bg-slate-950"
          style={{ width: `${splitPosition}%` }}
        >
          {/* Lesson Content (scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 prose prose-invert prose-slate max-w-none">
              {lessonContent}
            </div>
          </div>

          {/* AI Tutor Chat (fixed at bottom of left pane) */}
          <div className="h-[280px] border-t border-slate-700 flex-shrink-0">
            <AITutorChat
              studentProfile={studentProfile}
              currentLabState={currentLabState}
              auditFeedback={attestationResult}
            />
          </div>
        </div>

        {/* ─── Divider ─── */}
        <div
          ref={dividerRef}
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-slate-700 hover:bg-indigo-500 cursor-col-resize transition-colors flex-shrink-0"
          role="separator"
          aria-orientation="vertical"
        />

        {/* ─── Right Pane: Flowise Workspace ─── */}
        <div
          className="flex flex-col overflow-hidden bg-slate-800"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
            <span className="text-xs font-medium text-slate-300">⚡ Agent Workspace</span>
            <span className="text-[10px] text-slate-500">Flowise</span>
          </div>
          <div className="flex-1">
            <iframe
              src={`${flowiseUrl}/canvas?labId=${labId}`}
              className="flowise-workspace-iframe w-full h-full border-0"
              title="Flowise Agent Workspace"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="clipboard-write"
            />
          </div>
        </div>
      </div>

      {/* ═══ Bottom: Proof-of-Agent Action Bar ═══ */}
      <div className={`border-t border-slate-700 bg-slate-900 transition-all duration-300 ${
        bottomPanelExpanded ? 'h-[320px]' : 'h-14'
      }`}>
        {/* Action Bar (always visible) */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm">🛡️</span>
            <span className="text-xs font-medium text-slate-300">Proof-of-Agent</span>
            {attestationResult?.passed && (
              <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full border border-green-700/50">
                VERIFIED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Audit Button — triggers httpsCallable attestAgent */}
            <button
              onClick={() => handleAttestation()}
              disabled={attestationLoading || !hasAccess}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                attestationLoading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
              }`}
            >
              {attestationLoading ? 'Auditing...' : 'Audit Agent Architecture'}
            </button>

            {/* Expand/Collapse toggle */}
            <button
              onClick={() => setBottomPanelExpanded(!bottomPanelExpanded)}
              className="text-slate-400 hover:text-white text-xs"
            >
              {bottomPanelExpanded ? '▼ Collapse' : '▲ Results'}
            </button>
          </div>
        </div>

        {/* Expanded Results Panel (ProofGuardAuditor) */}
        {bottomPanelExpanded && (
          <div className="h-[calc(100%-3.5rem)] overflow-hidden">
            <ProofGuardAuditor
              result={attestationResult}
              loading={attestationLoading}
              error={attestationError}
              attemptCount={attemptCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceLab;
