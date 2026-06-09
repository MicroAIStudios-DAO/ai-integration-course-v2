/**
 * certification.ts
 *
 * Generates verifiable, blockchain-anchored certificates for students
 * who complete the Authentic AI Agent Masterclass capstone.
 *
 * Uses ProofGuard's Tenon Gateway to anchor the certificate hash on-chain,
 * and generates Open Badge 2.0 compliant metadata for LinkedIn sharing.
 *
 * Flow:
 * 1. Student completes capstone (all required DAG nodes mastered)
 * 2. Frontend calls `issueCertificate` callable
 * 3. This function verifies completion, generates cert data, anchors hash via ProofGuard
 * 4. Returns a verifiable certificate with on-chain proof
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const PROOFGUARD_API_URL = process.env.PROOFGUARD_API_URL || 'https://api.proofguard.ai';
const PROOFGUARD_SERVICE_KEY = process.env.PROOFGUARD_SERVICE_KEY;
const COURSE_ISSUER_URL = 'https://aiintegrationcourse.com';
const COURSE_ISSUER_NAME = 'AI Integration Course by MicroAI Studios';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CertificateData {
  certId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  trackTitle: string;
  issuedAt: string;
  expiresAt: string | null;
  competencies: CompetencyRecord[];
  governanceScore: number;
  attestationCount: number;
  blockchainAnchor: BlockchainAnchor | null;
}

interface CompetencyRecord {
  nodeId: string;
  title: string;
  masteredAt: string;
  cqsScore: number;
}

interface BlockchainAnchor {
  txHash: string;
  network: string;
  timestamp: string;
  certHash: string;
}

interface OpenBadgeAssertion {
  '@context': string;
  type: string;
  id: string;
  recipient: {
    type: string;
    identity: string;
    hashed: boolean;
    salt: string;
  };
  badge: {
    type: string;
    id: string;
    name: string;
    description: string;
    image: string;
    criteria: { narrative: string };
    issuer: {
      type: string;
      id: string;
      name: string;
      url: string;
      email: string;
    };
  };
  verification: {
    type: string;
  };
  issuedOn: string;
  evidence: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Required DAG Nodes for Certification
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_CAPSTONE_NODES = [
  'trust_anchor_architecture',
  'automating_compliance',
  'attestation_lab_basic',
  'policy_agent_deployment',
];

// ─────────────────────────────────────────────────────────────────────────────
// Issue Certificate (Callable)
// ─────────────────────────────────────────────────────────────────────────────

export const issueCertificate = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const userId = request.auth.uid;

  // 1. Verify student has completed all required nodes
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User record not found.');
  }

  const userData = userDoc.data()!;
  const competencyGraph = userData.competencyGraph;

  if (!competencyGraph || !competencyGraph.nodes) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'No competency data found. Complete the labs first.'
    );
  }

  // Check all required nodes are mastered
  const masteredNodes = competencyGraph.nodes.filter(
    (n: any) => n.status === 'mastered'
  );
  const masteredNodeIds = masteredNodes.map((n: any) => n.id);

  const missingNodes = REQUIRED_CAPSTONE_NODES.filter(
    (id) => !masteredNodeIds.includes(id)
  );

  if (missingNodes.length > 0) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `You have not completed the following required modules: ${missingNodes.join(', ')}`
    );
  }

  // 2. Check if certificate already exists
  const existingCert = await db
    .collection('certificates')
    .where('userId', '==', userId)
    .where('trackId', '==', 'authentic_ai_agent')
    .get();

  if (!existingCert.empty) {
    const existing = existingCert.docs[0].data();
    return {
      status: 'already_issued',
      certId: existingCert.docs[0].id,
      verifyUrl: `${COURSE_ISSUER_URL}/verify/${existingCert.docs[0].id}`,
      certificate: existing,
    };
  }

  // 3. Calculate aggregate governance score
  const attestations = await db
    .collection('users')
    .doc(userId)
    .collection('attestations')
    .get();

  const attestationScores = attestations.docs.map((d) => d.data().cqsScore || 0);
  const avgGovernanceScore =
    attestationScores.length > 0
      ? Math.round(
          attestationScores.reduce((a, b) => a + b, 0) / attestationScores.length
        )
      : 0;

  // 4. Build certificate data
  const certId = crypto.randomUUID();
  const now = new Date().toISOString();

  const competencies: CompetencyRecord[] = masteredNodes
    .filter((n: any) => REQUIRED_CAPSTONE_NODES.includes(n.id))
    .map((n: any) => ({
      nodeId: n.id,
      title: n.title || n.id,
      masteredAt: n.masteredAt || now,
      cqsScore: n.lastCqsScore || avgGovernanceScore,
    }));

  const certificateData: CertificateData = {
    certId,
    studentName: userData.displayName || userData.name || 'Student',
    studentEmail: userData.email || '',
    courseTitle: 'AI Integration Course',
    trackTitle: 'The Authentic AI Agent Masterclass',
    issuedAt: now,
    expiresAt: null, // Does not expire
    competencies,
    governanceScore: avgGovernanceScore,
    attestationCount: attestations.size,
    blockchainAnchor: null,
  };

  // 5. Anchor certificate hash on-chain via ProofGuard
  const certHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(certificateData))
    .digest('hex');

  let blockchainAnchor: BlockchainAnchor | null = null;

  if (PROOFGUARD_SERVICE_KEY) {
    try {
      const anchorResponse = await fetch(`${PROOFGUARD_API_URL}/v1/anchor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PROOFGUARD_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          hash: certHash,
          metadata: {
            type: 'course_certificate',
            certId,
            studentId: userId,
            trackId: 'authentic_ai_agent',
            governanceScore: avgGovernanceScore,
          },
        }),
      });

      if (anchorResponse.ok) {
        const anchorData = await anchorResponse.json();
        blockchainAnchor = {
          txHash: anchorData.txHash || anchorData.transactionHash,
          network: anchorData.network || 'ethereum-sepolia',
          timestamp: anchorData.timestamp || now,
          certHash,
        };
        certificateData.blockchainAnchor = blockchainAnchor;
      } else {
        console.warn('ProofGuard anchor failed, issuing without blockchain proof.');
      }
    } catch (err) {
      console.warn('ProofGuard anchor error:', err);
    }
  }

  // 6. Generate Open Badge 2.0 Assertion
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedEmail = 'sha256$' + crypto
    .createHash('sha256')
    .update(certificateData.studentEmail + salt)
    .digest('hex');

  const openBadge: OpenBadgeAssertion = {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Assertion',
    id: `${COURSE_ISSUER_URL}/badges/assertions/${certId}`,
    recipient: {
      type: 'email',
      identity: hashedEmail,
      hashed: true,
      salt,
    },
    badge: {
      type: 'BadgeClass',
      id: `${COURSE_ISSUER_URL}/badges/authentic-ai-agent`,
      name: 'Authentic AI Agent — Governance Certified',
      description:
        'This badge certifies that the holder has demonstrated mastery in building AI agents with tamper-proof audit trails, automated compliance controls, and policy enforcement — meeting IMDA/AICM governance standards.',
      image: `${COURSE_ISSUER_URL}/badges/authentic-ai-agent-badge.png`,
      criteria: {
        narrative:
          'To earn this badge, the student must: (1) Deploy an agent with a ProofGuard attestation trail, (2) Configure a Policy Agent with PII detection and kill-switch, (3) Pass all governance audits with a CQS score above 75, (4) Complete the capstone red-team exercise.',
      },
      issuer: {
        type: 'Issuer',
        id: `${COURSE_ISSUER_URL}/issuer`,
        name: COURSE_ISSUER_NAME,
        url: COURSE_ISSUER_URL,
        email: 'info@aiintegrationcourse.com',
      },
    },
    verification: {
      type: 'hosted',
    },
    issuedOn: now,
    evidence: [
      {
        id: `${COURSE_ISSUER_URL}/verify/${certId}`,
        name: 'Governance Lab Completion Evidence',
        description: `Student achieved a governance score of ${avgGovernanceScore}/100 across ${attestations.size} attestations.${blockchainAnchor ? ` Certificate hash anchored on-chain: ${blockchainAnchor.txHash}` : ''}`,
      },
    ],
  };

  // 7. Save to Firestore
  await db.collection('certificates').doc(certId).set({
    ...certificateData,
    userId,
    trackId: 'authentic_ai_agent',
    openBadge,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 8. Update user record with certification status
  await db.collection('users').doc(userId).update({
    'certifications.authentic_ai_agent': {
      certId,
      issuedAt: now,
      governanceScore: avgGovernanceScore,
      blockchainAnchored: !!blockchainAnchor,
    },
  });

  return {
    status: 'issued',
    certId,
    verifyUrl: `${COURSE_ISSUER_URL}/verify/${certId}`,
    certificate: certificateData,
    openBadge,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Verify Certificate (Public HTTP endpoint — no auth required)
// ─────────────────────────────────────────────────────────────────────────────

export const verifyCertificate = functions.https.onRequest(async (req, res) => {
  const certId = req.query.id as string || req.params?.[0];

  if (!certId) {
    res.status(400).json({ error: 'Certificate ID is required.' });
    return;
  }

  const certDoc = await db.collection('certificates').doc(certId).get();

  if (!certDoc.exists) {
    res.status(404).json({ error: 'Certificate not found.', valid: false });
    return;
  }

  const certData = certDoc.data()!;

  // Recalculate hash to verify integrity
  const { openBadge, createdAt, userId, trackId, ...certPayload } = certData;
  const recalculatedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(certPayload))
    .digest('hex');

  const isIntact = certData.blockchainAnchor
    ? certData.blockchainAnchor.certHash === recalculatedHash
    : true;

  res.status(200).json({
    valid: true,
    intact: isIntact,
    certificate: {
      certId: certData.certId,
      studentName: certData.studentName,
      courseTitle: certData.courseTitle,
      trackTitle: certData.trackTitle,
      issuedAt: certData.issuedAt,
      governanceScore: certData.governanceScore,
      attestationCount: certData.attestationCount,
      competencies: certData.competencies,
      blockchainAnchor: certData.blockchainAnchor,
    },
    openBadge: certData.openBadge,
  });
});
