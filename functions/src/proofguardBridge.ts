/**
 * proofguardBridge.ts — The Attestation Bridge (Firebase Callable Function)
 *
 * This is the secure middleman between the GovernanceLab frontend and the
 * MicroAIStudios-DAO/proofguard-ai Tenon Gateway. It:
 *
 * 1. Authenticates the student via Firebase Auth (automatic with onCall)
 * 2. Takes the Flowise JSON export from the student's workspace
 * 3. Attaches the student's secure auth token + industry context
 * 4. Forwards to ProofGuard's Tenon Gateway for CQS attestation
 * 5. Writes the attestation result back to the student's competency_graph
 * 6. Unlocks downstream DAG nodes when prerequisites are met
 * 7. Returns the full audit report to the client for UI rendering
 *
 * Endpoint: Callable (invoked via Firebase SDK, not REST)
 * Security: Firebase Auth required (enforced by onCall)
 * Environment: PROOFGUARD_API_URL, PROOFGUARD_SERVICE_KEY
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AttestationRequest {
  agentDefinition: Record<string, unknown>; // Flowise export JSON
  complianceTarget: string;                 // e.g., 'IMDA/AICM', 'SOC2', 'GDPR'
  studentContext: string;                   // Industry context from StudentProfile
  labId: string;                            // Lab identifier for competency tracking
}

interface Vulnerability {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  recommendation: string;
  aicmControl?: string;    // Mapped AICM control ID (e.g., "AC-01", "TR-03")
  imda_principle?: string; // Mapped IMDA principle
}

interface AttestationResult {
  cqsScore: number;                // Compliance Quality Score (0-100)
  attestationId: string;           // Unique attestation identifier
  timestamp: string;               // ISO timestamp
  complianceTarget: string;        // What was audited against
  passed: boolean;                 // cqsScore >= 90
  vulnerabilities: Vulnerability[];
  attestationHash?: string;        // Blockchain/IPFS hash for verification
  tenonGatewayId?: string;         // Tenon Gateway transaction ID
  recommendations: string[];       // Actionable next steps
}

interface CompetencyNode {
  nodeId: string;
  title: string;
  status: "locked" | "available" | "in_progress" | "mastered";
  score: number;
  attempts: number;
  lastAttemptAt: string | null;
  prerequisites: string[];
}

interface CompetencyGraph {
  nodes: CompetencyNode[];
  currentPathIds: string[];
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAG UNLOCKING LOGIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a competency graph, check if any locked nodes should be unlocked
 * because all their prerequisites are now mastered.
 */
function computeUnlockedNodes(graph: CompetencyGraph): CompetencyGraph {
  const masteredIds = new Set(
    graph.nodes.filter((n) => n.status === "mastered").map((n) => n.nodeId)
  );

  const updatedNodes = graph.nodes.map((node) => {
    if (node.status === "locked") {
      const allPrereqsMet =
        node.prerequisites.length === 0 ||
        node.prerequisites.every((prereq) => masteredIds.has(prereq));

      if (allPrereqsMet) {
        return { ...node, status: "available" as const };
      }
    }
    return node;
  });

  return { ...graph, nodes: updatedNodes, updatedAt: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALLABLE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export const attestAgent = onCall(
  {
    // Allow generous timeout for ProofGuard analysis
    timeoutSeconds: 120,
    memory: "512MiB",
    // Enforce authentication
    enforceAppCheck: false, // Enable when App Check is configured
  },
  async (request) => {
    // 1. Verify authentication (automatic with onCall, but double-check)
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be logged in to audit agents. Please sign in to continue."
      );
    }

    const uid = request.auth.uid;
    const { agentDefinition, complianceTarget, studentContext, labId } =
      request.data as AttestationRequest;

    // 2. Validate request payload
    if (!agentDefinition || typeof agentDefinition !== "object") {
      throw new HttpsError(
        "invalid-argument",
        "agentDefinition must be a valid JSON object (Flowise export)."
      );
    }

    if (!labId) {
      throw new HttpsError(
        "invalid-argument",
        "labId is required for competency tracking."
      );
    }

    // 3. Get environment config
    const PROOFGUARD_API_URL =
      process.env.PROOFGUARD_API_URL || "https://proofguard.aiintegrationcourse.com/api";
    const PROOFGUARD_SERVICE_KEY = process.env.PROOFGUARD_SERVICE_KEY;

    if (!PROOFGUARD_SERVICE_KEY) {
      console.error("[ProofGuard Bridge] PROOFGUARD_SERVICE_KEY not configured");
      throw new HttpsError(
        "failed-precondition",
        "Attestation service is not configured. Contact support."
      );
    }

    // 4. Fetch student profile for context enrichment
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const studentProfile = userData?.studentProfile;

    // 5. Call the ProofGuard Tenon Gateway
    try {
      const response = await fetch(`${PROOFGUARD_API_URL}/v1/attest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PROOFGUARD_SERVICE_KEY}`,
          "X-Student-ID": uid,
          "X-Tenant": "aiintegrationcourse",
        },
        body: JSON.stringify({
          agentDefinition,
          complianceTarget: complianceTarget || "IMDA/AICM",
          studentContext: studentContext || studentProfile?.industryContext || "General",
          // Enrich with student's governance posture for calibrated scoring
          governancePosture: studentProfile?.governancePosture || "balanced",
          technicalVector: studentProfile?.technicalVector || "medium",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `[ProofGuard Bridge] API error ${response.status}:`,
          errorBody
        );

        if (response.status === 429) {
          throw new HttpsError(
            "resource-exhausted",
            "Attestation rate limit reached. Please wait a moment and try again."
          );
        }

        throw new HttpsError(
          "internal",
          "ProofGuard attestation service returned an error. Please try again."
        );
      }

      const result: AttestationResult = await response.json();
      result.passed = result.cqsScore >= 90;

      // 6. Store attestation record in Firestore
      const attestationRecord = {
        uid,
        labId,
        cqsScore: result.cqsScore,
        passed: result.passed,
        complianceTarget: result.complianceTarget,
        vulnerabilitiesCount: result.vulnerabilities?.length || 0,
        criticalVulnerabilities: result.vulnerabilities?.filter(
          (v) => v.severity === "critical"
        ).length || 0,
        attestationHash: result.attestationHash || null,
        tenonGatewayId: result.tenonGatewayId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      const attestationRef = await db
        .collection("users")
        .doc(uid)
        .collection("attestations")
        .add(attestationRecord);

      // 7. Update competency graph
      let competencyGraph: CompetencyGraph = userData?.competencyGraph || {
        nodes: [],
        currentPathIds: [],
        updatedAt: new Date().toISOString(),
      };

      // Find and update the relevant node
      const nodeIndex = competencyGraph.nodes.findIndex(
        (n) => n.nodeId === labId
      );

      if (nodeIndex >= 0) {
        const node = competencyGraph.nodes[nodeIndex];
        const updatedNode: CompetencyNode = {
          ...node,
          score: Math.max(node.score, result.cqsScore), // Keep highest score
          attempts: node.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
          status: result.passed ? "mastered" : "in_progress",
        };
        competencyGraph.nodes[nodeIndex] = updatedNode;

        // Unlock downstream nodes if this one was just mastered
        if (result.passed && node.status !== "mastered") {
          competencyGraph = computeUnlockedNodes(competencyGraph);
        }
      } else {
        // Node not in graph yet — add it (first attempt at an untracked lab)
        competencyGraph.nodes.push({
          nodeId: labId,
          title: labId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          status: result.passed ? "mastered" : "in_progress",
          score: result.cqsScore,
          attempts: 1,
          lastAttemptAt: new Date().toISOString(),
          prerequisites: [],
        });
        competencyGraph = computeUnlockedNodes(competencyGraph);
      }

      // Write updated competency graph back to Firestore
      await db.collection("users").doc(uid).set(
        {
          competencyGraph,
          lastAttestationAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 8. Log for analytics
      console.log(
        `[ProofGuard Bridge] Student ${uid} | Lab: ${labId} | ` +
          `CQS: ${result.cqsScore} | Passed: ${result.passed} | ` +
          `Vulnerabilities: ${result.vulnerabilities?.length || 0}`
      );

      // 9. Return enriched result to client
      return {
        ...result,
        attestationRecordId: attestationRef.id,
        competencyUpdate: {
          nodeId: labId,
          newStatus: result.passed ? "mastered" : "in_progress",
          unlockedNodes: competencyGraph.nodes
            .filter((n) => n.status === "available")
            .map((n) => n.nodeId),
        },
      };
    } catch (error: unknown) {
      // Re-throw HttpsErrors as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      const err = error as { message?: string };
      console.error("[ProofGuard Bridge] Unexpected error:", err.message);
      throw new HttpsError(
        "internal",
        "Failed to complete agent attestation. Please try again."
      );
    }
  }
);
