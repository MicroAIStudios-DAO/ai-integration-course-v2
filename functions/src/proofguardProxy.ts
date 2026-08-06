/**
 * proofguardProxy.ts — Secure proxy for ProofGuard AI attestation API
 * 
 * This function securely routes student attestation requests to the
 * MicroAIStudios-DAO/proofguard-ai backend, injecting the server-side
 * API key so it never touches the client.
 * 
 * Endpoint: /api/proofguard/attest (POST)
 * 
 * Flow:
 * 1. Verify Firebase Auth token
 * 2. Validate request body (agentDefinition, complianceTarget, studentContext)
 * 3. Forward to ProofGuard backend with server API key
 * 4. Return CQS score + attestation result to client
 * 5. Store attestation record in Firestore for competency tracking
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// SECURITY FIX (VULN-03 pattern): This endpoint verifies a Firebase Auth token
// and forwards it (via X-Student-UID) to the ProofGuard backend, so it must not
// echo a wildcard `Access-Control-Allow-Origin: *`. A wildcard on an
// authenticated endpoint lets any third-party site drive cross-origin requests
// on behalf of a logged-in user (CSRF / attestation abuse). Mirror the explicit
// origin allowlist already used by tutor.ts / tutorEngine.ts.
const ALLOWED_ORIGINS = [
  "https://aiintegrationcourse.com",
  "https://www.aiintegrationcourse.com",
  // Local development origins
  "http://localhost:3000",
  "http://localhost:5000",
];

function applyCors(req: functions.https.Request, res: any): void {
  const origin = req.headers.origin;
  if (typeof origin === "string" && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

interface AttestationRequest {
  agentDefinition: any; // Flowise export JSON
  complianceTarget: string; // e.g., 'IMDA/AICM'
  studentContext: string; // Industry context
  labId?: string; // Optional lab identifier for tracking
}

interface AttestationResult {
  cqsScore: number;
  attestationId: string;
  timestamp: string;
  complianceTarget: string;
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
    aicmControl?: string;
  }>;
  attestationHash?: string;
  tenonGatewayId?: string;
}

export const proofguardAttest = functions.https.onRequest(async (req, res) => {
  // CORS headers (explicit origin allowlist — no wildcard on an authenticated endpoint)
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // 1. Verify Firebase Auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  let uid: string;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;
  } catch (authError) {
    res.status(401).json({ error: "Invalid authentication token" });
    return;
  }

  // 2. Validate request body
  const { agentDefinition, complianceTarget, studentContext, labId } = req.body as AttestationRequest;

  if (!agentDefinition) {
    res.status(400).json({ error: "agentDefinition is required" });
    return;
  }

  // 3. Forward to ProofGuard backend
  const PROOFGUARD_API_URL = process.env.PROOFGUARD_API_URL || "https://proofguard.aiintegrationcourse.com/api";
  const PROOFGUARD_API_KEY = process.env.PROOFGUARD_API_KEY || "";

  try {
    const proofguardResponse = await fetch(`${PROOFGUARD_API_URL}/attest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PROOFGUARD_API_KEY,
        "X-Student-UID": uid,
      },
      body: JSON.stringify({
        agentDefinition,
        complianceTarget: complianceTarget || "IMDA/AICM",
        studentContext: studentContext || "General",
      }),
    });

    if (!proofguardResponse.ok) {
      const errorText = await proofguardResponse.text();
      console.error("ProofGuard API error:", proofguardResponse.status, errorText);
      res.status(502).json({
        error: "ProofGuard attestation service unavailable",
        details: proofguardResponse.status,
      });
      return;
    }

    const result: AttestationResult = await proofguardResponse.json();

    // 4. Store attestation record in Firestore for competency tracking
    const attestationRecord = {
      uid,
      labId: labId || "unknown",
      cqsScore: result.cqsScore,
      complianceTarget: result.complianceTarget,
      vulnerabilitiesCount: result.vulnerabilities?.length || 0,
      passed: result.cqsScore >= 90,
      attestationHash: result.attestationHash || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).collection("attestations").add(attestationRecord);

    // 5. Update competency graph if lab passed
    if (result.cqsScore >= 90 && labId) {
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      const competencyGraph = userData?.competencyGraph;

      if (competencyGraph?.nodes) {
        const updatedNodes = competencyGraph.nodes.map((node: any) => {
          if (node.nodeId === labId) {
            return {
              ...node,
              status: "mastered",
              score: result.cqsScore,
              lastAttemptAt: new Date().toISOString(),
              attempts: (node.attempts || 0) + 1,
            };
          }
          return node;
        });

        await db.collection("users").doc(uid).set(
          { competencyGraph: { ...competencyGraph, nodes: updatedNodes, updatedAt: new Date().toISOString() } },
          { merge: true }
        );
      }
    }

    // 6. Return result to client
    res.status(200).json(result);
  } catch (error: any) {
    console.error("ProofGuard proxy error:", error);
    res.status(500).json({
      error: "Internal server error during attestation",
      message: error.message,
    });
  }
});
