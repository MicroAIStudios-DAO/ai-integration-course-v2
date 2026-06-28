import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ComplianceCheckResult {
  controlId: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  message: string;
  remediation?: string;
}

interface ComplianceReport {
  reportId: string;
  timestamp: string;
  framework: string;
  agentName: string;
  overallScore: number;
  overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
  results: ComplianceCheckResult[];
  summary: { total: number; passed: number; failed: number; warnings: number; notApplicable: number };
  recommendations: string[];
}

interface AgentConfig {
  name: string;
  model: string;
  hasAuditTrail: boolean;
  hasHumanInLoop: boolean;
  dataRetentionDays: number;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  accessControlEnabled: boolean;
  piiHandling: 'none' | 'anonymized' | 'encrypted' | 'raw';
  outputFiltering: boolean;
  killSwitchEnabled: boolean;
  loggingLevel: 'none' | 'basic' | 'detailed' | 'full';
  vendorAssessment: boolean;
  incidentResponsePlan: boolean;
}

// ─── Default Agent Config ───────────────────────────────────────────────────

const DEFAULT_CONFIG: AgentConfig = {
  name: 'My AI Agent',
  model: 'gpt-4o',
  hasAuditTrail: false,
  hasHumanInLoop: false,
  dataRetentionDays: 365,
  encryptionAtRest: true,
  encryptionInTransit: true,
  accessControlEnabled: true,
  piiHandling: 'raw',
  outputFiltering: false,
  killSwitchEnabled: false,
  loggingLevel: 'basic',
  vendorAssessment: false,
  incidentResponsePlan: false,
};

// ─── Component ──────────────────────────────────────────────────────────────

const ComplianceLabPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [framework, setFramework] = useState<'all' | 'soc2' | 'ai_governance'>('all');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunCheck = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const complianceCheckFn = httpsCallable(functions, 'complianceCheck');
      const result = await complianceCheckFn({ agentConfig: config, framework });
      setReport(result.data as ComplianceReport);
    } catch (err: any) {
      setError(err.message || 'Compliance check failed');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: keyof AgentConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'fail': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'from-emerald-500 to-green-600';
      case 'partially_compliant': return 'from-amber-500 to-orange-600';
      case 'non_compliant': return 'from-red-500 to-rose-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-400">Please log in to access the Compliance Lab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Enterprise AI Compliance Lab</h1>
              <p className="text-slate-400 text-sm">SOC 2 + AI Governance Pre-Deployment Checks</p>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-3xl">
            Configure your AI agent's security posture and run it through enterprise compliance frameworks. 
            Learn what SOC 2 auditors and AI governance boards look for before approving agent deployments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Configuration Panel (Left) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4">Agent Configuration</h2>

              {/* Agent Name */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              {/* Model */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfig('model', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="llama-3.1-70b">Llama 3.1 70B (Self-hosted)</option>
                </select>
              </div>

              {/* Toggle Controls */}
              <div className="space-y-3 mb-4">
                {[
                  { key: 'hasAuditTrail' as const, label: 'Audit Trail (ProofGuard)' },
                  { key: 'hasHumanInLoop' as const, label: 'Human-in-the-Loop' },
                  { key: 'killSwitchEnabled' as const, label: 'Kill Switch' },
                  { key: 'outputFiltering' as const, label: 'Output Filtering' },
                  { key: 'encryptionAtRest' as const, label: 'Encryption at Rest' },
                  { key: 'encryptionInTransit' as const, label: 'Encryption in Transit' },
                  { key: 'accessControlEnabled' as const, label: 'Access Control' },
                  { key: 'vendorAssessment' as const, label: 'Vendor Assessment Done' },
                  { key: 'incidentResponsePlan' as const, label: 'Incident Response Plan' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                    <button
                      onClick={() => updateConfig(key, !config[key])}
                      className={`w-10 h-5 rounded-full transition-all relative ${
                        config[key] ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                        config[key] ? 'left-5.5 translate-x-1' : 'left-0.5'
                      }`} style={{ left: config[key] ? '22px' : '2px' }} />
                    </button>
                  </label>
                ))}
              </div>

              {/* PII Handling */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">PII Handling</label>
                <select
                  value={config.piiHandling}
                  onChange={(e) => updateConfig('piiHandling', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="none">No PII Processed</option>
                  <option value="anonymized">Anonymized</option>
                  <option value="encrypted">Encrypted</option>
                  <option value="raw">Raw (Unprotected)</option>
                </select>
              </div>

              {/* Logging Level */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Logging Level</label>
                <select
                  value={config.loggingLevel}
                  onChange={(e) => updateConfig('loggingLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="detailed">Detailed</option>
                  <option value="full">Full (Recommended)</option>
                </select>
              </div>

              {/* Data Retention */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Data Retention: {config.dataRetentionDays} days
                </label>
                <input
                  type="range"
                  min="7"
                  max="730"
                  value={config.dataRetentionDays}
                  onChange={(e) => updateConfig('dataRetentionDays', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>7d</span>
                  <span className="text-emerald-400">90d (recommended)</span>
                  <span>730d</span>
                </div>
              </div>

              {/* Framework Selection */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-2">Framework</label>
                <div className="flex gap-2">
                  {[
                    { id: 'all' as const, label: 'All' },
                    { id: 'soc2' as const, label: 'SOC 2' },
                    { id: 'ai_governance' as const, label: 'AI Gov' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFramework(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        framework === f.id
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Check Button */}
              <button
                onClick={handleRunCheck}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Running Compliance Check...' : 'Run Compliance Check'}
              </button>
            </div>
          </div>

          {/* Results Panel (Right) */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!report && !loading && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Configure and Run</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Set up your agent's security configuration on the left, then run the compliance check 
                  to see how it performs against enterprise standards.
                </p>
              </div>
            )}

            {report && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className={`p-6 rounded-2xl bg-gradient-to-r ${getOverallStatusColor(report.overallStatus)} bg-opacity-20`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Compliance Score</p>
                      <p className="text-5xl font-bold text-white mt-1">{report.overallScore}%</p>
                      <p className="text-white/70 text-sm mt-1 capitalize">{report.overallStatus.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs">{report.framework}</p>
                      <p className="text-white/60 text-xs mt-1">{report.agentName}</p>
                      <p className="text-white/60 text-xs mt-1">{new Date(report.timestamp).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex gap-3 mt-4">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white">
                      {report.summary.passed} Passed
                    </span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white">
                      {report.summary.failed} Failed
                    </span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white">
                      {report.summary.warnings} Warnings
                    </span>
                  </div>
                </div>

                {/* Individual Results */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Control Results</h3>
                  {report.results.map((result) => (
                    <div
                      key={result.controlId}
                      className={`p-4 rounded-xl border ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono opacity-70">{result.controlId}</span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              result.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' :
                              result.status === 'fail' ? 'bg-red-500/20 text-red-400' :
                              result.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{result.message}</p>
                          {result.remediation && (
                            <p className="text-xs mt-2 opacity-80 italic">
                              Fix: {result.remediation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Top Recommendations</h3>
                    <ol className="space-y-3">
                      {report.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <p className="text-slate-300 text-sm">{rec}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceLabPage;
