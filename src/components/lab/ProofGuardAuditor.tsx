/**
 * ProofGuardAuditor.tsx — ProofGuard Attestation Result Display
 *
 * Provides the interface for displaying CQS (Compliance Quality Score) results
 * from the ProofGuard attestation service. The actual attestation call is handled
 * by the parent component (GovernanceLabPremium) via the Firebase Callable
 * `attestAgent` function.
 *
 * This component is a pure presentation layer for audit results.
 *
 * Connects to: MicroAIStudios-DAO/proofguard-ai backend (via attestAgent callable)
 */

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
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

interface ProofGuardAuditorProps {
  result: AttestationResult | null;
  loading?: boolean;
  error?: string | null;
  attemptCount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ProofGuardAuditor({
  result,
  loading = false,
  error = null,
  attemptCount = 0,
}: ProofGuardAuditorProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-800/50';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-800/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-800/50';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Running ProofGuard attestation...</p>
        <p className="text-xs text-slate-500">Analyzing agent architecture against IMDA/AICM controls</p>
      </div>
    );
  }

  // No result yet
  if (!result && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
        <div className="text-4xl">🛡️</div>
        <h3 className="text-sm font-semibold text-slate-300">ProofGuard Auditor</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Build your agent in the Flowise workspace, then click "Audit Agent Architecture"
          to receive your Compliance Quality Score.
        </p>
        {attemptCount > 0 && (
          <p className="text-xs text-slate-600">Previous attempts: {attemptCount}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full">
      {/* CQS Score Display */}
      {result && (
        <>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">Compliance Quality Score</h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  result.cqsScore >= 90 ? 'text-green-400' :
                  result.cqsScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {result.cqsScore}/100
                </span>
                {result.passed && (
                  <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full border border-green-700/50">
                    PASSED
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  result.cqsScore >= 90 ? 'bg-green-500' :
                  result.cqsScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.cqsScore}%` }}
              />
            </div>

            {/* Attestation metadata */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <span>Target: {result.complianceTarget}</span>
              <span>Attempt: #{attemptCount}</span>
              {result.attestationHash && (
                <span className="font-mono col-span-2" title={result.attestationHash}>
                  Hash: {result.attestationHash.slice(0, 16)}...
                </span>
              )}
              {result.tenonGatewayId && (
                <span className="font-mono col-span-2">
                  Gateway: {result.tenonGatewayId.slice(0, 12)}...
                </span>
              )}
            </div>
          </div>

          {/* Competency Update */}
          {result.competencyUpdate && result.competencyUpdate.unlockedNodes.length > 0 && (
            <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-3">
              <p className="text-xs font-semibold text-green-300 mb-1">Modules Unlocked</p>
              <div className="flex flex-wrap gap-1">
                {result.competencyUpdate.unlockedNodes.map((nodeId) => (
                  <span key={nodeId} className="text-xs bg-green-800/50 text-green-200 px-2 py-0.5 rounded">
                    {nodeId.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Recommendations
              </h4>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vulnerabilities List */}
          {result.vulnerabilities && result.vulnerabilities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Findings ({result.vulnerabilities.length})
              </h4>
              {result.vulnerabilities.map((vuln, i) => (
                <div key={i} className={`rounded-lg p-3 border ${getSeverityColor(vuln.severity)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase flex items-center gap-1">
                      {getSeverityIcon(vuln.severity)} {vuln.severity}
                      {vuln.category && <span className="font-normal opacity-75">· {vuln.category}</span>}
                    </span>
                    {vuln.aicmControl && (
                      <span className="text-xs font-mono opacity-60">{vuln.aicmControl}</span>
                    )}
                  </div>
                  <p className="text-sm">{vuln.description}</p>
                  <p className="text-xs mt-1 opacity-75">Fix: {vuln.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* No vulnerabilities — clean bill */}
          {result.vulnerabilities && result.vulnerabilities.length === 0 && result.passed && (
            <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold text-green-300">Clean Attestation</p>
              <p className="text-xs text-green-400/70 mt-1">
                No vulnerabilities detected. Your agent meets all compliance requirements.
              </p>
            </div>
          )}
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
