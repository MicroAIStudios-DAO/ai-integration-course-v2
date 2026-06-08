/**
 * ProofGuardAuditor.tsx — ProofGuard Attestation API Wrapper
 * 
 * Provides the interface for submitting agent definitions to the ProofGuard
 * attestation service and displaying CQS (Compliance Quality Score) results.
 * 
 * Connects to: MicroAIStudios-DAO/proofguard-ai backend
 * Endpoint: /api/proofguard/attest
 */

import React, { useState } from 'react';

interface AttestationResult {
  cqsScore: number;
  attestationId: string;
  timestamp: string;
  complianceTarget: string;
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
    aicmControl?: string; // Maps to AICM control ID
  }>;
  attestationHash?: string; // Blockchain-anchored hash
  tenonGatewayId?: string; // Tenon IoT gateway reference
}

interface ProofGuardAuditorProps {
  agentDefinition: any;
  complianceTarget?: string;
  studentIndustry?: string;
  onAuditComplete?: (result: AttestationResult) => void;
}

export function ProofGuardAuditor({
  agentDefinition,
  complianceTarget = 'IMDA/AICM',
  studentIndustry = 'General',
  onAuditComplete,
}: ProofGuardAuditorProps) {
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAttestation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proofguard/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDefinition,
          complianceTarget,
          studentContext: studentIndustry,
        }),
      });

      if (!response.ok) {
        throw new Error(`Attestation failed: ${response.statusText}`);
      }

      const attestationResult: AttestationResult = await response.json();
      setResult(attestationResult);
      onAuditComplete?.(attestationResult);
    } catch (err: any) {
      setError(err.message || 'Attestation service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30';
      case 'high': return 'text-orange-400 bg-orange-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'low': return 'text-blue-400 bg-blue-900/30';
      default: return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* CQS Score Display */}
      {result && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Compliance Quality Score</h3>
            <span className={`text-2xl font-bold ${
              result.cqsScore >= 90 ? 'text-green-400' :
              result.cqsScore >= 70 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {result.cqsScore}/100
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.cqsScore >= 90 ? 'bg-green-500' :
                result.cqsScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.cqsScore}%` }}
            />
          </div>

          {/* Attestation metadata */}
          <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500">
            <span>Target: {result.complianceTarget}</span>
            {result.attestationHash && (
              <span className="font-mono">Hash: {result.attestationHash.slice(0, 12)}...</span>
            )}
          </div>
        </div>
      )}

      {/* Vulnerabilities List */}
      {result?.vulnerabilities && result.vulnerabilities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Findings ({result.vulnerabilities.length})
          </h4>
          {result.vulnerabilities.map((vuln, i) => (
            <div key={i} className={`rounded-lg p-3 border border-slate-700 ${getSeverityColor(vuln.severity)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase">{vuln.severity}</span>
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

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
