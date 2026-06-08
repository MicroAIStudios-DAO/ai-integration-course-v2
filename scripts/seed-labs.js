/**
 * seed-labs.js — Populate the Firestore `labs` collection with
 * the initial "Authentic AI Agent" curriculum lab configurations.
 * 
 * Usage:
 *   node scripts/seed-labs.js
 * 
 * Prerequisites:
 *   - Firebase Admin SDK service account key at the path specified by
 *     GOOGLE_APPLICATION_CREDENTIALS env var, or run from a GCP environment
 *     with default credentials.
 *   - Or use: firebase emulators:exec "node scripts/seed-labs.js"
 */

const admin = require('firebase-admin');

// Initialize with service account or default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ai-integra-course-v2',
  });
}

const db = admin.firestore();

const LABS = [
  {
    labId: 'governance-lab-intro',
    lessonId: 'courses/ai-governance/modules/trust-architecture/lessons/trust-anchor',
    title: 'The Trust-Anchor Architecture',
    description: 'Deploy a basic agent in Flowise and hook it into the ProofGuard API to create a tamper-proof audit trail of the agent\'s decision-making process.',
    flowiseUrl: 'https://flowise.aiintegrationcourse.com',
    proofguardApiUrl: 'https://proofguard.aiintegrationcourse.com/api',
    premium: true,
    order: 1,
    module: 'trust-architecture',
    objectives: [
      'Understand why black-box agents fail enterprise audits',
      'Deploy a basic conversational agent using Flowise',
      'Integrate ProofGuard attestation to log decision trails',
      'Achieve a CQS score of 70+ on the basic compliance check',
    ],
    complianceTarget: 'IMDA/AICM',
    estimatedMinutes: 45,
    difficulty: 'intermediate',
  },
  {
    labId: 'governance-lab-compliance',
    lessonId: 'courses/ai-governance/modules/automated-compliance/lessons/automating-compliance',
    title: 'Automating Compliance',
    description: 'Configure a "Policy Agent" that monitors your main agent\'s calls and triggers a Kill Switch or Human-in-the-Loop notification if a compliance threshold (like PII leakage) is breached.',
    flowiseUrl: 'https://flowise.aiintegrationcourse.com',
    proofguardApiUrl: 'https://proofguard.aiintegrationcourse.com/api',
    premium: true,
    order: 2,
    module: 'automated-compliance',
    objectives: [
      'Map IMDA/AICM requirements to automated agentic constraints',
      'Build a Policy Agent that monitors another agent\'s API calls',
      'Implement a Kill Switch triggered by PII leakage detection',
      'Configure Human-in-the-Loop escalation workflows',
      'Achieve a CQS score of 90+ for full compliance certification',
    ],
    complianceTarget: 'IMDA/AICM',
    estimatedMinutes: 60,
    difficulty: 'advanced',
  },
  {
    labId: 'governance-lab-attestation',
    lessonId: 'courses/ai-governance/modules/attestation-lab/lessons/proof-of-agent',
    title: 'Proof-of-Agent Attestation Lab',
    description: 'Deploy a complete agent workflow, sign its outputs with ProofGuard, and generate a blockchain-anchored attestation certificate proving your agent meets safety and compliance standards.',
    flowiseUrl: 'https://flowise.aiintegrationcourse.com',
    proofguardApiUrl: 'https://proofguard.aiintegrationcourse.com/api',
    premium: true,
    order: 3,
    module: 'attestation-lab',
    objectives: [
      'Build a multi-step agent with input validation, processing, and output signing',
      'Integrate the full ProofGuard attestation pipeline',
      'Generate a verifiable, blockchain-backed compliance certificate',
      'Understand Tenon Gateway IoT attestation for edge deployments',
    ],
    complianceTarget: 'IMDA/AICM',
    estimatedMinutes: 75,
    difficulty: 'advanced',
  },
  {
    labId: 'governance-lab-capstone',
    lessonId: 'courses/ai-governance/modules/capstone/lessons/capstone-project',
    title: 'Capstone: Enterprise-Grade Governed Agent',
    description: 'Build a complete enterprise-grade AI agent with full governance guardrails, automated compliance monitoring, and verifiable attestation. This is your certification project.',
    flowiseUrl: 'https://flowise.aiintegrationcourse.com',
    proofguardApiUrl: 'https://proofguard.aiintegrationcourse.com/api',
    premium: true,
    order: 4,
    module: 'capstone',
    objectives: [
      'Design and deploy a multi-agent system with governance-first architecture',
      'Implement industry-specific compliance rules based on your StudentProfile',
      'Pass all ProofGuard attestation checks with CQS 95+',
      'Generate your verifiable Authentic AI Agent certification credential',
    ],
    complianceTarget: 'IMDA/AICM',
    estimatedMinutes: 120,
    difficulty: 'expert',
    isCertificationLab: true,
  },
];

async function seedLabs() {
  console.log('Seeding labs collection...\n');

  const batch = db.batch();

  for (const lab of LABS) {
    const docRef = db.collection('labs').doc(lab.labId);
    batch.set(docRef, {
      ...lab,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  + ${lab.labId}: "${lab.title}"`);
  }

  await batch.commit();
  console.log(`\nDone. ${LABS.length} labs seeded successfully.`);
}

seedLabs().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
