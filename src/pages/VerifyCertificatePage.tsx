/**
 * VerifyCertificatePage.tsx
 *
 * Public page for verifying blockchain-anchored certificates.
 * No authentication required — anyone with the cert URL can verify.
 * Displays the student's competency radar, governance score, and blockchain proof.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface CertificateVerification {
  valid: boolean;
  intact: boolean;
  certificate: {
    certId: string;
    studentName: string;
    courseTitle: string;
    trackTitle: string;
    issuedAt: string;
    governanceScore: number;
    attestationCount: number;
    competencies: Array<{
      nodeId: string;
      title: string;
      masteredAt: string;
      cqsScore: number;
    }>;
    blockchainAnchor: {
      txHash: string;
      network: string;
      timestamp: string;
      certHash: string;
    } | null;
  };
}

export default function VerifyCertificatePage() {
  const { certId } = useParams<{ certId: string }>();
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certId) return;

    const verify = async () => {
      try {
        const response = await fetch(`/api/verify/${certId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Certificate not found. Please check the URL.');
          } else {
            setError('Unable to verify certificate at this time.');
          }
          return;
        }
        const data = await response.json();
        setVerification(data);
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Verification Failed</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const { certificate } = verification;
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Verification Status Banner */}
        <div
          className={`rounded-xl p-6 mb-8 border ${
            verification.valid && verification.intact
              ? 'bg-emerald-900/20 border-emerald-500/30'
              : 'bg-yellow-900/20 border-yellow-500/30'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {verification.valid && verification.intact ? '✅' : '⚠️'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {verification.valid && verification.intact
                  ? 'Certificate Verified'
                  : 'Certificate Integrity Warning'}
              </h2>
              <p className="text-sm text-slate-400">
                {verification.valid && verification.intact
                  ? 'This certificate is authentic and has not been tampered with.'
                  : 'This certificate exists but its integrity could not be fully verified.'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-8 text-center border-b border-slate-700">
            <p className="text-sm text-purple-300 uppercase tracking-widest mb-2">
              {certificate.courseTitle}
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">
              {certificate.trackTitle}
            </h1>
            <p className="text-slate-400">Certificate of Mastery</p>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Student Info */}
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wider">Awarded to</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {certificate.studentName}
              </p>
              <p className="text-sm text-slate-400 mt-1">Issued {issuedDate}</p>
            </div>

            {/* Governance Score */}
            <div className="bg-slate-900/50 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-2">
                Governance Score
              </p>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {certificate.governanceScore}/100
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Based on {certificate.attestationCount} ProofGuard attestations
              </p>
            </div>

            {/* Competencies */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Verified Competencies
              </h3>
              <div className="space-y-2">
                {certificate.competencies.map((comp) => (
                  <div
                    key={comp.nodeId}
                    className="flex items-center justify-between bg-slate-900/30 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm text-slate-200">{comp.title}</span>
                    <span className="text-xs font-mono text-emerald-400">
                      CQS: {comp.cqsScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockchain Anchor */}
            {certificate.blockchainAnchor && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Blockchain Proof
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Network</span>
                    <span className="text-slate-300 font-mono">
                      {certificate.blockchainAnchor.network}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Transaction</span>
                    <span className="text-slate-300 font-mono truncate max-w-[200px]">
                      {certificate.blockchainAnchor.txHash}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Certificate Hash</span>
                    <span className="text-slate-300 font-mono truncate max-w-[200px]">
                      {certificate.blockchainAnchor.certHash}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 px-8 py-4 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-500">
              Issued by AI Integration Course by MicroAI Studios •{' '}
              <a
                href="https://aiintegrationcourse.com"
                className="text-purple-400 hover:text-purple-300"
              >
                aiintegrationcourse.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
