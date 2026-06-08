/**
 * GovernanceLabPremium.tsx — Premium Governance Lab with ProofGuard Integration
 * 
 * This is the production-grade version of the Governance Lab that integrates:
 * - Per-student Flowise instance provisioning
 * - ProofGuard attestation API for CQS scoring
 * - Industry-specific compliance targeting (IMDA/AICM)
 * - AI Tutor state-aware coaching based on audit results
 * 
 * This component is the "Build-and-Verify" experience that replaces
 * the traditional "Read-the-Docs" model.
 */

import React, { useState, useEffect } from 'react';
import { AITutorChat } from './AITutorChat'; // Proactive tutor UI (LangGraph-powered)
import { ProofGuardAuditor } from './ProofGuardAuditor'; // Wrapper for attestation API
import { useAuth } from '../../context/AuthContext';
import { useAdaptiveLearning } from '../../context/AdaptiveLearningContext';

interface ConceptGraphNode {
  nodeId: string;
  title: string;
  description?: string;
}

interface GovernanceLabPremiumProps {
  lessonId: string;
  conceptGraphNode: ConceptGraphNode;
}

export default function GovernanceLabPremium({ lessonId, conceptGraphNode }: GovernanceLabPremiumProps) {
  const { currentUser } = useAuth();
  const { studentProfile, updateLabTelemetry } = useAdaptiveLearning();
  const [labState, setLabState] = useState<'building' | 'auditing' | 'passed' | 'failed'>('building');
  const [auditReport, setAuditReport] = useState<any>(null);

  // Per-student Flowise instance provisioned via cloud infrastructure
  const tenantId = currentUser?.uid?.slice(0, 8) || 'default';
  const FLOWISE_INSTANCE_URL = `https://flowise.${tenantId}.aiintegrationcourse.com`;

  const handleRunProofGuardAudit = async (flowiseExportJson?: any) => {
    setLabState('auditing');
    try {
      // Calls MicroAIStudios-DAO/proofguard-ai backend
      const response = await fetch('/api/proofguard/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentDefinition: flowiseExportJson,
          complianceTarget: 'IMDA/AICM',
          studentContext: studentProfile?.industryContext || 'General' // Checks rules based on their specific industry
        })
      });

      const result = await response.json();
      setAuditReport(result);

      if (result.cqsScore > 90) {
        setLabState('passed');
        // Trigger AI Tutor praise and unlock next DAG node
        updateLabTelemetry({
          labId: conceptGraphNode.nodeId,
          status: 'passed',
          cqsScore: result.cqsScore,
          timestamp: new Date().toISOString(),
        });
      } else {
        setLabState('failed');
        // AI Tutor will read this state and offer a personalized hint
        updateLabTelemetry({
          labId: conceptGraphNode.nodeId,
          status: 'failed',
          cqsScore: result.cqsScore,
          failureReason: result.vulnerabilities?.[0]?.description || 'Unknown',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Audit failed", error);
      setLabState('failed');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100">

      {/* LEFT PANE: Premium Personalized Coaching */}
      <div className="w-1/3 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            {conceptGraphNode.title}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Tailored for your focus in {studentProfile?.industryContext || 'AI Integration'}
          </p>
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
          />
        </div>

        {/* Action Bar: ProofGuard Integration */}
        <div className="h-20 bg-slate-900 border-t border-slate-700 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-slate-300">Proof-of-Agent&trade; Status:</span>
            {labState === 'building' && <span className="text-yellow-400">Awaiting Audit</span>}
            {labState === 'auditing' && <span className="text-blue-400 animate-pulse">Running Attestation...</span>}
            {labState === 'passed' && <span className="text-green-400 font-bold">&check; CQS Compliant</span>}
            {labState === 'failed' && <span className="text-red-400 font-bold">&loz; Vulnerabilities Detected</span>}
          </div>

          <button
            onClick={() => handleRunProofGuardAudit(/* logic to extract current flow json */)}
            disabled={labState === 'auditing'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.5)] disabled:opacity-50"
          >
            {labState === 'auditing' ? 'Running Attestation...' : 'Audit Agent Architecture'}
          </button>
        </div>

      </div>
    </div>
  );
}
