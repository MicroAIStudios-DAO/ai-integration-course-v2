/**
 * GovernanceLab.tsx — The "Build-and-Verify" Lab Layout
 * 
 * A split-pane layout that wraps lesson content with:
 *   - Left Pane: Lesson markdown content (theory)
 *   - Right Pane: Tabbed interface (Flowise Workspace | ProofGuard Auditor | AI Mentor)
 * 
 * Maintains state while the student switches between tabs.
 * Captures lab telemetry and feeds it to the AdaptiveLearningContext.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdaptiveLearning } from '../../context/AdaptiveLearningContext';
import AITutorV2 from '../AITutorV2';
import type { LabTelemetry } from '../../types/adaptiveLearning';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface GovernanceLabProps {
  lessonId: string;
  labId: string;
  lessonContent: React.ReactNode;
  flowiseUrl?: string;
  proofguardApiUrl?: string;
  premium?: boolean;
  hasAccess?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Types
// ─────────────────────────────────────────────────────────────────────────────

type LabTab = 'flowise' | 'proofguard' | 'mentor';

// ─────────────────────────────────────────────────────────────────────────────
// ProofGuard Audit Event Type
// ─────────────────────────────────────────────────────────────────────────────

interface AuditEvent {
  id: string;
  timestamp: string;
  type: 'pass' | 'fail' | 'warning';
  message: string;
  cqsScore?: number;
  details?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const GovernanceLab: React.FC<GovernanceLabProps> = ({
  lessonId,
  labId,
  lessonContent,
  flowiseUrl = 'https://flowise.aiintegrationcourse.com',
  proofguardApiUrl = 'https://proofguard.aiintegrationcourse.com/api',
  premium = false,
  hasAccess = true,
}) => {
  const { updateLabTelemetry } = useAdaptiveLearning();
  const [activeTab, setActiveTab] = useState<LabTab>('flowise');
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [cqsScore, setCqsScore] = useState<number | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [totalPassed, setTotalPassed] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [labStartTime] = useState(Date.now());
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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
  // ProofGuard Polling (simulated — replace with real WebSocket/polling)
  // ─────────────────────────────────────────────────────────────────────────

  const pollProofGuard = useCallback(async () => {
    try {
      const response = await fetch(`${proofguardApiUrl}/agents/${labId}/attestations?limit=10`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();

      if (data.attestations) {
        const events: AuditEvent[] = data.attestations.map((a: any) => ({
          id: a.id || crypto.randomUUID(),
          timestamp: a.createdAt || new Date().toISOString(),
          type: a.passed ? 'pass' : 'fail',
          message: a.summary || (a.passed ? 'Audit passed' : 'Audit failed'),
          cqsScore: a.cqsScore,
          details: a.details,
        }));
        setAuditEvents(events);

        // Update metrics
        const passed = events.filter(e => e.type === 'pass').length;
        const failed = events.filter(e => e.type === 'fail').length;
        setTotalPassed(passed);
        setTotalFailed(failed);

        // Count consecutive failures from the end
        let consec = 0;
        for (let i = events.length - 1; i >= 0; i--) {
          if (events[i].type === 'fail') consec++;
          else break;
        }
        setConsecutiveFailures(consec);

        // Latest CQS score
        const latestWithScore = events.find(e => e.cqsScore !== undefined);
        if (latestWithScore?.cqsScore !== undefined) {
          setCqsScore(latestWithScore.cqsScore);
        }
      }
    } catch {
      // Silently fail — lab may not have ProofGuard connected yet
    }
  }, [proofguardApiUrl, labId]);

  // Poll every 10 seconds when on the ProofGuard tab
  useEffect(() => {
    if (activeTab !== 'proofguard') return;
    pollProofGuard();
    const interval = setInterval(pollProofGuard, 10000);
    return () => clearInterval(interval);
  }, [activeTab, pollProofGuard]);

  // ─────────────────────────────────────────────────────────────────────────
  // Update Lab Telemetry for the Adaptive Learning Engine
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const telemetry: LabTelemetry = {
      labId,
      proofguardAuditsPassed: totalPassed,
      proofguardAuditsFailed: totalFailed,
      consecutiveFailures,
      lastFailureReason: auditEvents.filter(e => e.type === 'fail').pop()?.message || null,
      completionTimeMs: null, // Set when lab is completed
      averageCompletionTimeMs: 45 * 60 * 1000, // 45 min default average
      flowiseNodesUsed: [], // Populated by Flowise postMessage
    };
    updateLabTelemetry(telemetry);
  }, [labId, totalPassed, totalFailed, consecutiveFailures, auditEvents, updateLabTelemetry]);

  // ─────────────────────────────────────────────────────────────────────────
  // Listen for Flowise postMessage events
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'flowise-node-update') {
        // Flowise sends node configuration updates
        // This allows the tutor to know what the student is building
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const tabs: Array<{ id: LabTab; label: string; icon: string }> = [
    { id: 'flowise', label: 'Workspace', icon: '⚡' },
    { id: 'proofguard', label: 'Auditor', icon: '🛡️' },
    { id: 'mentor', label: 'AI Mentor', icon: '🧠' },
  ];

  return (
    <div className="governance-lab h-[calc(100vh-4rem)] flex flex-col">
      {/* Lab Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔬</span>
          <div>
            <h2 className="text-sm font-semibold">Governance Lab</h2>
            <p className="text-xs text-slate-400">Build · Verify · Certify</p>
          </div>
        </div>
        {cqsScore !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">CQS Score:</span>
            <span className={`text-sm font-bold ${
              cqsScore >= 80 ? 'text-green-400' :
              cqsScore >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {cqsScore}/100
            </span>
          </div>
        )}
      </div>

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Lesson Content */}
        <div
          className="overflow-y-auto bg-white"
          style={{ width: `${splitPosition}%` }}
        >
          <div className="p-6 prose prose-slate max-w-none">
            {lessonContent}
          </div>
        </div>

        {/* Divider */}
        <div
          ref={dividerRef}
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors flex-shrink-0"
          role="separator"
          aria-orientation="vertical"
        />

        {/* Right Pane: Tabbed Interface */}
        <div
          className="flex flex-col overflow-hidden bg-slate-50"
          style={{ width: `${100 - splitPosition}%` }}
        >
          {/* Tab Bar */}
          <div className="flex border-b border-slate-200 bg-white">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'proofguard' && totalFailed > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full">
                    {totalFailed}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {/* Flowise Workspace */}
            {activeTab === 'flowise' && (
              <div className="h-full">
                <iframe
                  src={`${flowiseUrl}/canvas?labId=${labId}`}
                  className="w-full h-full border-0"
                  title="Flowise Workspace"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  allow="clipboard-write"
                />
              </div>
            )}

            {/* ProofGuard Auditor */}
            {activeTab === 'proofguard' && (
              <div className="h-full overflow-y-auto p-4 space-y-3">
                {/* Score Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{totalPassed}</p>
                    <p className="text-[10px] text-green-600">Passed</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-700">{totalFailed}</p>
                    <p className="text-[10px] text-red-600">Failed</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-indigo-700">{cqsScore ?? '—'}</p>
                    <p className="text-[10px] text-indigo-600">CQS Score</p>
                  </div>
                </div>

                {/* Audit Event Feed */}
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Audit Trail
                </h4>
                {auditEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No audit events yet.</p>
                    <p className="text-xs mt-1">Run your agent in the Workspace to generate attestations.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditEvents.map(event => (
                      <div
                        key={event.id}
                        className={`rounded-lg border p-3 text-xs ${
                          event.type === 'pass'
                            ? 'bg-green-50 border-green-200'
                            : event.type === 'fail'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {event.type === 'pass' ? '✅' : event.type === 'fail' ? '❌' : '⚠️'}
                            {' '}{event.message}
                          </span>
                          <span className="text-slate-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {event.details && (
                          <p className="text-slate-600 mt-1">{event.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Mentor */}
            {activeTab === 'mentor' && (
              <div className="h-full overflow-y-auto p-3">
                <AITutorV2
                  lessonId={lessonId}
                  premium={premium}
                  hasAccess={hasAccess}
                  labMode={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceLab;
