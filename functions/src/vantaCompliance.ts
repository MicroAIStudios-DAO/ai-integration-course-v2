/**
 * Vanta Compliance & Enterprise AI Governance Module
 *
 * Firebase Cloud Functions that simulate enterprise compliance workflows.
 * Students learn to:
 *   1. Understand SOC 2, ISO 27001, and HIPAA compliance requirements for AI systems
 *   2. Run pre-deployment compliance checks against their agent configurations
 *   3. Generate compliance reports with remediation recommendations
 *   4. Integrate compliance gates into CI/CD pipelines
 *
 * This module provides a mock compliance API that mirrors the Vanta Developer Hub
 * patterns, allowing students to practice without needing a $10K/year Vanta subscription.
 *
 * Endpoints:
 *   - complianceCheck — Run a compliance check against an agent configuration
 *   - complianceReport — Generate a full compliance report for a student's project
 *   - complianceFrameworks — List available compliance frameworks and their controls
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ComplianceControl {
  id: string;
  framework: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  automatable: boolean;
}

interface ComplianceCheckResult {
  controlId: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  message: string;
  remediation?: string;
  evidence?: string;
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

interface ComplianceReport {
  reportId: string;
  timestamp: string;
  framework: string;
  agentName: string;
  overallScore: number;
  overallStatus: 'compliant' | 'non_compliant' | 'partially_compliant';
  results: ComplianceCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
  };
  recommendations: string[];
}

// ─── Compliance Frameworks ──────────────────────────────────────────────────

const SOC2_CONTROLS: ComplianceControl[] = [
  {
    id: 'SOC2-CC6.1',
    framework: 'SOC 2 Type II',
    category: 'Logical & Physical Access',
    title: 'Access Control Implementation',
    description: 'The entity implements logical access security measures to protect against unauthorized access.',
    severity: 'critical',
    automatable: true,
  },
  {
    id: 'SOC2-CC6.6',
    framework: 'SOC 2 Type II',
    category: 'Logical & Physical Access',
    title: 'Encryption in Transit',
    description: 'The entity implements encryption for data in transit to protect against interception.',
    severity: 'critical',
    automatable: true,
  },
  {
    id: 'SOC2-CC6.7',
    framework: 'SOC 2 Type II',
    category: 'Logical & Physical Access',
    title: 'Encryption at Rest',
    description: 'The entity implements encryption for data at rest to protect against unauthorized disclosure.',
    severity: 'high',
    automatable: true,
  },
  {
    id: 'SOC2-CC7.2',
    framework: 'SOC 2 Type II',
    category: 'System Operations',
    title: 'Monitoring & Detection',
    description: 'The entity monitors system components for anomalies and security events.',
    severity: 'high',
    automatable: true,
  },
  {
    id: 'SOC2-CC7.3',
    framework: 'SOC 2 Type II',
    category: 'System Operations',
    title: 'Incident Response',
    description: 'The entity has procedures to respond to identified security incidents.',
    severity: 'high',
    automatable: false,
  },
  {
    id: 'SOC2-CC8.1',
    framework: 'SOC 2 Type II',
    category: 'Change Management',
    title: 'Change Authorization',
    description: 'Changes to infrastructure and software are authorized and tested before deployment.',
    severity: 'medium',
    automatable: true,
  },
];

const AI_GOVERNANCE_CONTROLS: ComplianceControl[] = [
  {
    id: 'AIGOV-1',
    framework: 'AI Governance',
    category: 'Transparency',
    title: 'Audit Trail Completeness',
    description: 'All AI agent decisions must have a complete, tamper-proof audit trail.',
    severity: 'critical',
    automatable: true,
  },
  {
    id: 'AIGOV-2',
    framework: 'AI Governance',
    category: 'Human Oversight',
    title: 'Human-in-the-Loop Controls',
    description: 'High-impact decisions require human approval before execution.',
    severity: 'critical',
    automatable: true,
  },
  {
    id: 'AIGOV-3',
    framework: 'AI Governance',
    category: 'Safety',
    title: 'Kill Switch Availability',
    description: 'Agent must have an immediately accessible kill switch for emergency shutdown.',
    severity: 'critical',
    automatable: true,
  },
  {
    id: 'AIGOV-4',
    framework: 'AI Governance',
    category: 'Data Protection',
    title: 'PII Handling Compliance',
    description: 'Personal data must be anonymized or encrypted; raw PII storage is prohibited.',
    severity: 'high',
    automatable: true,
  },
  {
    id: 'AIGOV-5',
    framework: 'AI Governance',
    category: 'Output Safety',
    title: 'Output Filtering & Guardrails',
    description: 'Agent outputs must pass through content filtering before reaching end users.',
    severity: 'high',
    automatable: true,
  },
  {
    id: 'AIGOV-6',
    framework: 'AI Governance',
    category: 'Vendor Management',
    title: 'Third-Party Model Assessment',
    description: 'External AI model providers must be assessed for security and reliability.',
    severity: 'medium',
    automatable: false,
  },
  {
    id: 'AIGOV-7',
    framework: 'AI Governance',
    category: 'Data Retention',
    title: 'Data Retention Policy',
    description: 'Conversation and telemetry data must have defined retention periods (max 90 days for PII).',
    severity: 'medium',
    automatable: true,
  },
];

const ALL_CONTROLS = [...SOC2_CONTROLS, ...AI_GOVERNANCE_CONTROLS];

// ─── Compliance Check Logic ─────────────────────────────────────────────────

function evaluateControl(control: ComplianceControl, config: AgentConfig): ComplianceCheckResult {
  switch (control.id) {
    case 'SOC2-CC6.1':
      return {
        controlId: control.id,
        status: config.accessControlEnabled ? 'pass' : 'fail',
        message: config.accessControlEnabled
          ? 'Access control is properly implemented.'
          : 'No access control detected. Agent endpoints are publicly accessible.',
        remediation: !config.accessControlEnabled
          ? 'Implement Firebase Auth or API key validation on all agent endpoints.'
          : undefined,
      };

    case 'SOC2-CC6.6':
      return {
        controlId: control.id,
        status: config.encryptionInTransit ? 'pass' : 'fail',
        message: config.encryptionInTransit
          ? 'All communications use TLS/HTTPS encryption.'
          : 'Unencrypted communication channels detected.',
        remediation: !config.encryptionInTransit
          ? 'Enforce HTTPS on all endpoints. Use Firebase Hosting (auto-TLS) or configure SSL certificates.'
          : undefined,
      };

    case 'SOC2-CC6.7':
      return {
        controlId: control.id,
        status: config.encryptionAtRest ? 'pass' : 'fail',
        message: config.encryptionAtRest
          ? 'Data at rest is encrypted (Firestore default encryption).'
          : 'Data at rest encryption not confirmed.',
        remediation: !config.encryptionAtRest
          ? 'Firestore encrypts at rest by default. Verify no unencrypted local storage of sensitive data.'
          : undefined,
      };

    case 'SOC2-CC7.2':
      return {
        controlId: control.id,
        status: config.loggingLevel === 'full' || config.loggingLevel === 'detailed' ? 'pass' :
          config.loggingLevel === 'basic' ? 'warning' : 'fail',
        message: config.loggingLevel === 'none'
          ? 'No monitoring or logging configured.'
          : `Logging level: ${config.loggingLevel}. ${config.loggingLevel === 'basic' ? 'Consider upgrading to detailed logging.' : 'Comprehensive monitoring in place.'}`,
        remediation: config.loggingLevel === 'none'
          ? 'Enable Cloud Logging and set up alerting policies for anomalous behavior.'
          : undefined,
      };

    case 'SOC2-CC7.3':
      return {
        controlId: control.id,
        status: config.incidentResponsePlan ? 'pass' : 'fail',
        message: config.incidentResponsePlan
          ? 'Incident response plan documented and accessible.'
          : 'No incident response plan detected.',
        remediation: !config.incidentResponsePlan
          ? 'Create an incident response runbook covering: detection, containment, eradication, recovery, and lessons learned.'
          : undefined,
      };

    case 'SOC2-CC8.1':
      return {
        controlId: control.id,
        status: 'pass', // Assumed if using Firebase deployment pipeline
        message: 'Firebase deployment pipeline provides change management controls.',
        evidence: 'Firebase Functions predeploy hooks enforce build validation.',
      };

    case 'AIGOV-1':
      return {
        controlId: control.id,
        status: config.hasAuditTrail ? 'pass' : 'fail',
        message: config.hasAuditTrail
          ? 'Complete audit trail via ProofGuard attestation system.'
          : 'No audit trail for agent decisions detected.',
        remediation: !config.hasAuditTrail
          ? 'Integrate ProofGuard Tenon Gateway to create tamper-proof attestation records for all agent decisions.'
          : undefined,
      };

    case 'AIGOV-2':
      return {
        controlId: control.id,
        status: config.hasHumanInLoop ? 'pass' : 'fail',
        message: config.hasHumanInLoop
          ? 'Human-in-the-loop approval gates are configured.'
          : 'Agent operates autonomously without human oversight.',
        remediation: !config.hasHumanInLoop
          ? 'Add approval workflows for high-impact actions (e.g., financial transactions, data deletion, external communications).'
          : undefined,
      };

    case 'AIGOV-3':
      return {
        controlId: control.id,
        status: config.killSwitchEnabled ? 'pass' : 'fail',
        message: config.killSwitchEnabled
          ? 'Kill switch is available and tested.'
          : 'No emergency shutdown mechanism detected.',
        remediation: !config.killSwitchEnabled
          ? 'Implement a kill switch: a single Firestore flag or Remote Config value that immediately halts all agent operations.'
          : undefined,
      };

    case 'AIGOV-4':
      return {
        controlId: control.id,
        status: config.piiHandling === 'raw' ? 'fail' :
          config.piiHandling === 'none' ? 'not_applicable' : 'pass',
        message: config.piiHandling === 'raw'
          ? 'PII is stored in raw form without protection.'
          : config.piiHandling === 'none'
            ? 'No PII handling detected (not applicable).'
            : `PII is ${config.piiHandling} before storage.`,
        remediation: config.piiHandling === 'raw'
          ? 'Implement PII anonymization (hash emails, mask names) or encrypt PII fields with customer-managed encryption keys.'
          : undefined,
      };

    case 'AIGOV-5':
      return {
        controlId: control.id,
        status: config.outputFiltering ? 'pass' : 'warning',
        message: config.outputFiltering
          ? 'Output filtering and content guardrails are active.'
          : 'No output filtering detected. Agent may produce harmful or inappropriate content.',
        remediation: !config.outputFiltering
          ? 'Add output filtering: content moderation API, regex-based PII detection, and topic guardrails.'
          : undefined,
      };

    case 'AIGOV-6':
      return {
        controlId: control.id,
        status: config.vendorAssessment ? 'pass' : 'warning',
        message: config.vendorAssessment
          ? 'Third-party model provider has been assessed.'
          : 'No vendor assessment documentation found.',
        remediation: !config.vendorAssessment
          ? 'Document your AI model provider assessment: data handling, uptime SLA, security certifications, and data residency.'
          : undefined,
      };

    case 'AIGOV-7':
      return {
        controlId: control.id,
        status: config.dataRetentionDays <= 90 ? 'pass' :
          config.dataRetentionDays <= 365 ? 'warning' : 'fail',
        message: `Data retention: ${config.dataRetentionDays} days. ${
          config.dataRetentionDays <= 90 ? 'Within recommended limits.' :
            config.dataRetentionDays <= 365 ? 'Consider reducing retention period.' :
              'Exceeds maximum recommended retention.'
        }`,
        remediation: config.dataRetentionDays > 90
          ? 'Implement automated data purging with TTL policies. PII should be retained for max 90 days unless legally required.'
          : undefined,
      };

    default:
      return {
        controlId: control.id,
        status: 'not_applicable',
        message: 'Control evaluation not implemented.',
      };
  }
}

// ─── 1. complianceCheck — Run compliance check ──────────────────────────────

export const complianceCheck = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to run compliance checks.');
    }

    const { agentConfig, framework = 'all' } = request.data as {
      agentConfig: AgentConfig;
      framework?: 'soc2' | 'ai_governance' | 'all';
    };

    if (!agentConfig || !agentConfig.name) {
      throw new HttpsError('invalid-argument', 'Must provide an agentConfig with at least a name field.');
    }

    // Select controls based on framework
    let controls: ComplianceControl[];
    switch (framework) {
      case 'soc2': controls = SOC2_CONTROLS; break;
      case 'ai_governance': controls = AI_GOVERNANCE_CONTROLS; break;
      default: controls = ALL_CONTROLS;
    }

    // Evaluate each control
    const results = controls.map((control) => evaluateControl(control, agentConfig));

    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const warnings = results.filter((r) => r.status === 'warning').length;
    const notApplicable = results.filter((r) => r.status === 'not_applicable').length;

    const score = Math.round((passed / (results.length - notApplicable)) * 100);
    const overallStatus: ComplianceReport['overallStatus'] =
      failed === 0 ? 'compliant' :
        failed <= 2 ? 'partially_compliant' : 'non_compliant';

    const reportId = `CR-${Date.now()}-${request.auth.uid.slice(0, 6)}`;

    const report: ComplianceReport = {
      reportId,
      timestamp: new Date().toISOString(),
      framework: framework === 'all' ? 'SOC 2 + AI Governance' : framework === 'soc2' ? 'SOC 2 Type II' : 'AI Governance',
      agentName: agentConfig.name,
      overallScore: score,
      overallStatus,
      results,
      summary: { total: results.length, passed, failed, warnings, notApplicable },
      recommendations: results
        .filter((r) => r.remediation)
        .map((r) => r.remediation!)
        .slice(0, 5),
    };

    // Store report in Firestore
    const db = getFirestore();
    await db.collection('users').doc(request.auth.uid)
      .collection('complianceReports').doc(reportId).set(report);

    // Update lab telemetry
    await db.collection('users').doc(request.auth.uid).update({
      'labTelemetry.vanta.checkCount': FieldValue.increment(1),
      'labTelemetry.vanta.lastCheckAt': FieldValue.serverTimestamp(),
      'labTelemetry.vanta.lastScore': score,
    });

    return report;
  }
);

// ─── 2. complianceReport — Get historical reports ───────────────────────────

export const complianceReport = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to view compliance reports.');
    }

    const { reportId } = request.data as { reportId?: string };
    const db = getFirestore();

    if (reportId) {
      const doc = await db.collection('users').doc(request.auth.uid)
        .collection('complianceReports').doc(reportId).get();
      if (!doc.exists) {
        throw new HttpsError('not-found', `Report ${reportId} not found.`);
      }
      return doc.data();
    }

    // Return last 10 reports
    const reportsSnap = await db.collection('users').doc(request.auth.uid)
      .collection('complianceReports')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    return {
      reports: reportsSnap.docs.map((doc) => ({
        reportId: doc.id,
        ...doc.data(),
      })),
    };
  }
);

// ─── 3. complianceFrameworks — List available frameworks ────────────────────

export const complianceFrameworks = onCall(
  { enforceAppCheck: false, cors: true },
  async () => {
    return {
      frameworks: [
        {
          id: 'soc2',
          name: 'SOC 2 Type II',
          description: 'Service Organization Control 2 — Trust Services Criteria for security, availability, and confidentiality.',
          controlCount: SOC2_CONTROLS.length,
          categories: [...new Set(SOC2_CONTROLS.map((c) => c.category))],
        },
        {
          id: 'ai_governance',
          name: 'AI Governance',
          description: 'Enterprise AI governance controls covering transparency, safety, human oversight, and data protection.',
          controlCount: AI_GOVERNANCE_CONTROLS.length,
          categories: [...new Set(AI_GOVERNANCE_CONTROLS.map((c) => c.category))],
        },
      ],
      totalControls: ALL_CONTROLS.length,
    };
  }
);
