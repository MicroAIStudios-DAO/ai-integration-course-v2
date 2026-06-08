/**
 * bootstrap-adaptive-learning.js
 *
 * Database bootstrap script for the Adaptive Learning Engine.
 * Initializes the Knowledge Graph (DAG) template, lab configurations,
 * and creates the Firestore indexes required for competency tracking.
 *
 * Usage:
 *   node scripts/bootstrap-adaptive-learning.js
 *
 * Prerequisites:
 *   - Firebase Admin SDK credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
 *   - Or run via: firebase functions:shell (for local testing)
 *
 * This script:
 *   1. Seeds the `labs` collection with the Authentic AI Agent curriculum
 *   2. Creates a template `competencyGraph` that gets cloned to each new student
 *   3. Seeds a `dagTemplates` collection for the dynamic path generation engine
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE GRAPH (DAG) TEMPLATE
// This is the master curriculum graph. When a student completes intake,
// the LangGraph engine selects a subset of these nodes based on their profile.
// ─────────────────────────────────────────────────────────────────────────────

const COMPETENCY_GRAPH_TEMPLATE = {
  version: "2.0",
  updatedAt: new Date().toISOString(),
  nodes: [
    // ── FOUNDATION TIER ──
    {
      nodeId: "ai-fundamentals",
      title: "AI Fundamentals & Mental Models",
      tier: "foundation",
      status: "available",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: [],
      labId: null,
      estimatedMinutes: 30,
      description: "Core concepts: LLMs, tokens, context windows, temperature, embeddings.",
    },
    {
      nodeId: "prompt-engineering",
      title: "Prompt Engineering for Agents",
      tier: "foundation",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["ai-fundamentals"],
      labId: null,
      estimatedMinutes: 45,
      description: "System prompts, few-shot patterns, chain-of-thought, structured output.",
    },
    {
      nodeId: "flowise-basics",
      title: "Visual Agent Building with Flowise",
      tier: "foundation",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["prompt-engineering"],
      labId: null,
      estimatedMinutes: 60,
      description: "Drag-and-drop agent construction, node types, flow export/import.",
    },

    // ── GOVERNANCE TIER ──
    {
      nodeId: "governance-intro",
      title: "Why Agents Need Governance",
      tier: "governance",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["flowise-basics"],
      labId: null,
      estimatedMinutes: 25,
      description: "Black box problem, enterprise audit failures, trust deficit.",
    },
    {
      nodeId: "trust-anchor-lab",
      title: "The Trust-Anchor Architecture",
      tier: "governance",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["governance-intro"],
      labId: "trust-anchor-lab",
      estimatedMinutes: 90,
      description: "Deploy a basic agent and hook it into ProofGuard for tamper-proof audit trails.",
    },
    {
      nodeId: "compliance-automation-lab",
      title: "Automating Compliance",
      tier: "governance",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["trust-anchor-lab"],
      labId: "compliance-automation-lab",
      estimatedMinutes: 90,
      description: "Configure a Policy Agent that monitors calls and triggers kill switches on PII leakage.",
    },

    // ── ADVANCED TIER ──
    {
      nodeId: "mcp-interoperability",
      title: "Model Context Protocol (MCP)",
      tier: "advanced",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["trust-anchor-lab"],
      labId: null,
      estimatedMinutes: 60,
      description: "Standardized API connectivity for agentic interoperability.",
    },
    {
      nodeId: "rag-vector-databases",
      title: "RAG & Vector Databases",
      tier: "advanced",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["prompt-engineering"],
      labId: null,
      estimatedMinutes: 75,
      description: "Retrieval-Augmented Generation with Pinecone/Firestore vector search.",
    },
    {
      nodeId: "multi-agent-orchestration",
      title: "Multi-Agent Orchestration",
      tier: "advanced",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["mcp-interoperability", "compliance-automation-lab"],
      labId: "multi-agent-orchestration-lab",
      estimatedMinutes: 120,
      description: "LangGraph state machines, agent delegation, supervisor patterns.",
    },

    // ── CAPSTONE ──
    {
      nodeId: "capstone-authentic-agent",
      title: "Capstone: The Authentic AI Agent",
      tier: "capstone",
      status: "locked",
      score: 0,
      attempts: 0,
      lastAttemptAt: null,
      prerequisites: ["multi-agent-orchestration", "compliance-automation-lab"],
      labId: "capstone-authentic-agent",
      estimatedMinutes: 180,
      description: "Build, govern, and certify a production-ready multi-agent system.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LAB CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const LABS = [
  {
    labId: "trust-anchor-lab",
    title: "The Trust-Anchor Architecture",
    description:
      "Deploy a basic agent in Flowise and hook it into the ProofGuard API to sign its outputs with a tamper-proof audit trail.",
    lessonPath: "courses/authentic-ai-agent/modules/governance/lessons/trust-anchor",
    flowiseTemplateUrl: "https://flowise.aiintegrationcourse.com/templates/trust-anchor",
    proofguardEndpoint: "/api/proofguard/attest",
    complianceTarget: "IMDA/AICM",
    passingScore: 90,
    maxAttempts: null,
    premium: true,
    tier: "governance",
    estimatedMinutes: 90,
    objectives: [
      "Deploy a conversational agent in Flowise",
      "Connect the agent to ProofGuard attestation API",
      "Achieve a CQS score >= 90 on the IMDA/AICM compliance target",
      "Understand the tamper-proof audit trail architecture",
    ],
    hints: [
      "Make sure your agent has a system prompt that declares its purpose",
      "Check that all user inputs pass through a sanitization node before the LLM",
      "Ensure output logging is enabled on every response node",
    ],
  },
  {
    labId: "compliance-automation-lab",
    title: "Automating Compliance",
    description:
      "Configure a Policy Agent that monitors your main agent's calls and triggers a Kill Switch or Human-in-the-Loop notification if a compliance threshold (like PII leakage) is breached.",
    lessonPath: "courses/authentic-ai-agent/modules/governance/lessons/automating-compliance",
    flowiseTemplateUrl: "https://flowise.aiintegrationcourse.com/templates/compliance-automation",
    proofguardEndpoint: "/api/proofguard/attest",
    complianceTarget: "IMDA/AICM",
    passingScore: 90,
    maxAttempts: null,
    premium: true,
    tier: "governance",
    estimatedMinutes: 90,
    objectives: [
      "Build a Policy Agent that intercepts main agent calls",
      "Implement PII detection using regex and NER nodes",
      "Configure kill switch trigger on critical violations",
      "Set up Human-in-the-Loop notification for medium-severity issues",
      "Pass ProofGuard attestation with CQS >= 90",
    ],
    hints: [
      "The Policy Agent should sit between the user input and the main LLM call",
      "Use a conditional router node to branch on PII detection confidence",
      "Remember: the kill switch should return a safe fallback message, not crash",
    ],
  },
  {
    labId: "multi-agent-orchestration-lab",
    title: "Multi-Agent Orchestration",
    description:
      "Build a LangGraph-style state machine with multiple specialized agents that delegate tasks, share context, and maintain governance compliance across the entire pipeline.",
    lessonPath: "courses/authentic-ai-agent/modules/advanced/lessons/multi-agent-orchestration",
    flowiseTemplateUrl: "https://flowise.aiintegrationcourse.com/templates/multi-agent",
    proofguardEndpoint: "/api/proofguard/attest",
    complianceTarget: "IMDA/AICM",
    passingScore: 90,
    maxAttempts: null,
    premium: true,
    tier: "advanced",
    estimatedMinutes: 120,
    objectives: [
      "Design a supervisor agent that delegates to specialist sub-agents",
      "Implement state management across agent transitions",
      "Ensure each sub-agent has its own compliance boundary",
      "Achieve end-to-end attestation across the full pipeline",
    ],
    hints: [
      "Start with 2 agents before scaling to 3+",
      "The supervisor needs access to all sub-agent outputs for final attestation",
      "Use structured JSON for inter-agent communication, not free text",
    ],
  },
  {
    labId: "capstone-authentic-agent",
    title: "Capstone: The Authentic AI Agent",
    description:
      "The final challenge: build a production-ready multi-agent system that is fully governed, self-healing, and certifiably compliant. Passing this lab earns your blockchain-backed Authentic AI Agent certification.",
    lessonPath: "courses/authentic-ai-agent/modules/capstone/lessons/final-project",
    flowiseTemplateUrl: "https://flowise.aiintegrationcourse.com/templates/capstone",
    proofguardEndpoint: "/api/proofguard/attest",
    complianceTarget: "IMDA/AICM",
    passingScore: 95,
    maxAttempts: null,
    premium: true,
    tier: "capstone",
    estimatedMinutes: 180,
    objectives: [
      "Build a multi-agent system with at least 3 specialized agents",
      "Implement self-healing: agent auto-corrects on ProofGuard feedback",
      "Achieve CQS >= 95 on comprehensive IMDA/AICM audit",
      "Generate a verifiable certification hash via ProofGuard",
      "Document your architecture decisions in a governance report",
    ],
    hints: [
      "The self-healing loop should re-run the failing node with modified parameters",
      "Your governance report should map each agent to specific AICM controls",
      "Think about what happens when the supervisor agent itself fails",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PROFILE TEMPLATE
// This is what gets created during the Intake Diagnostic
// ─────────────────────────────────────────────────────────────────────────────

const STUDENT_PROFILE_TEMPLATE = {
  technicalVector: null, // "low" | "medium" | "high" — set during intake
  industryContext: null, // Free text — set during intake
  governancePosture: null, // "risk-averse" | "balanced" | "velocity-focused"
  preferredAnalogies: [], // Populated by LangGraph based on industry
  learningStyle: null, // "visual" | "hands-on" | "conceptual"
  createdAt: null, // ISO timestamp
  updatedAt: null, // ISO timestamp
  intakeComplete: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE INDEXES (to be created via firebase.json or CLI)
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_INDEXES = [
  {
    collectionGroup: "attestations",
    fields: [
      { fieldPath: "uid", order: "ASCENDING" },
      { fieldPath: "timestamp", order: "DESCENDING" },
    ],
    queryScope: "COLLECTION",
  },
  {
    collectionGroup: "attestations",
    fields: [
      { fieldPath: "labId", order: "ASCENDING" },
      { fieldPath: "cqsScore", order: "DESCENDING" },
    ],
    queryScope: "COLLECTION",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

async function bootstrap() {
  console.log("🚀 Bootstrapping Adaptive Learning Engine...\n");

  // 1. Seed labs collection
  console.log("📋 Seeding labs collection...");
  const labsBatch = db.batch();
  for (const lab of LABS) {
    const ref = db.collection("labs").doc(lab.labId);
    labsBatch.set(ref, {
      ...lab,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await labsBatch.commit();
  console.log(`   ✓ ${LABS.length} labs seeded`);

  // 2. Store the DAG template
  console.log("🌳 Storing competency graph template...");
  await db.collection("dagTemplates").doc("authentic-ai-agent-v2").set({
    ...COMPETENCY_GRAPH_TEMPLATE,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("   ✓ DAG template stored");

  // 3. Store the student profile template
  console.log("👤 Storing student profile template...");
  await db.collection("dagTemplates").doc("student-profile-template").set({
    template: STUDENT_PROFILE_TEMPLATE,
    version: "2.0",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("   ✓ Student profile template stored");

  // 4. Log required indexes
  console.log("\n📇 Required Firestore Indexes (create via CLI or console):");
  for (const idx of REQUIRED_INDEXES) {
    const fields = idx.fields.map((f) => `${f.fieldPath} (${f.order})`).join(", ");
    console.log(`   - ${idx.collectionGroup}: ${fields}`);
  }

  console.log("\n✅ Bootstrap complete!");
  console.log("\nNext steps:");
  console.log("  1. Run: firebase deploy --only firestore:rules");
  console.log("  2. Create the indexes above via Firebase Console or CLI");
  console.log("  3. Set secrets: firebase functions:secrets:set PROOFGUARD_SERVICE_KEY");
  console.log("  4. Deploy functions: firebase deploy --only functions");
}

// Run
bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Bootstrap failed:", err);
    process.exit(1);
  });
