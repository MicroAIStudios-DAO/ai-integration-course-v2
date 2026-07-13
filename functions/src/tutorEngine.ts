/**
 * tutorEngine.ts — AI Tutor v2.0: Adaptive Learning Engine
 *
 * Architecture: LangGraph-inspired state-machine with Gemini 1.5 Pro as the LLM engine.
 * This replaces the stateless RAG responder with a stateful agentic tutor that:
 *   1. Runs an intake diagnostic to build a StudentProfile
 *   2. Generates dynamic DAG paths through the curriculum
 *   3. Observes lab state and triggers proactive coaching interventions
 *   4. Maintains long-term conversation memory via Firestore
 *
 * Backward Compatibility:
 *   - The original tutor.ts endpoint is preserved as a "legacy" fallback.
 *   - This engine is exposed as a NEW endpoint: /api/tutor-v2
 *   - The frontend AITutor component detects the student's profile and routes
 *     to v2 when a StudentProfile exists, otherwise falls back to v1.
 */

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// ─────────────────────────────────────────────────────────────────────────────
// SECRETS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const ALLOWED_ORIGINS = [
  'https://aiintegrationcourse.com',
  'https://www.aiintegrationcourse.com',
  'http://localhost:3000',
  'http://localhost:5000',
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES: State Machine & Student Profile
// ─────────────────────────────────────────────────────────────────────────────

/** The student's adaptive profile, persisted to Firestore users/{uid}.studentProfile */
export interface StudentProfile {
  technicalVector: 'low' | 'medium' | 'high';
  industryContext: string;
  governancePosture: 'risk-averse' | 'balanced' | 'velocity-focused';
  preferredAnalogies: string[]; // e.g., ['audio engineering', 'music production']
  createdAt: string;
  updatedAt: string;
}

/** Competency graph node tracking mastery of curriculum DAG nodes */
export interface CompetencyNode {
  nodeId: string;
  title: string;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  score: number; // 0-100
  attempts: number;
  lastAttemptAt: string | null;
}

/** The full competency graph stored at users/{uid}.competencyGraph */
export interface CompetencyGraph {
  nodes: CompetencyNode[];
  currentPathIds: string[]; // ordered list of nodeIds in the student's active path
  updatedAt: string;
}

/** Lab telemetry sent from the GovernanceLab frontend */
export interface LabTelemetry {
  labId: string;
  proofguardAuditsPassed: number;
  proofguardAuditsFailed: number;
  consecutiveFailures: number;
  lastFailureReason: string | null;
  completionTimeMs: number | null;
  averageCompletionTimeMs: number; // class average for comparison
  flowiseNodesUsed: string[];
}

/** State machine states for the tutor engine */
type TutorState =
  | 'INTAKE'
  | 'PATH_GENERATION'
  | 'LESSON_ASSIST'
  | 'LAB_OBSERVATION'
  | 'INTERVENTION'
  | 'CHALLENGE_MODE';

/** The full state object passed through the LangGraph-style pipeline */
interface TutorGraphState {
  currentState: TutorState;
  studentProfile: StudentProfile | null;
  competencyGraph: CompetencyGraph | null;
  labTelemetry: LabTelemetry | null;
  conversationHistory: Array<{ role: string; content: string }>;
  currentLessonId: string | null;
  interventionType: 'frustration' | 'boredom' | 'drift' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

async function callGemini(
  apiKey: string,
  systemInstruction: string,
  messages: GeminiMessage[],
  temperature: number = 0.7,
  maxOutputTokens: number = 2048
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function streamGemini(
  apiKey: string,
  systemInstruction: string,
  messages: GeminiMessage[],
  onChunk: (text: string) => void,
  temperature: number = 0.7,
  maxOutputTokens: number = 2048
): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini streaming error ${response.status}: ${errorText}`);
  }

  if (!response.body) throw new Error('No response body for streaming');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch { /* skip malformed chunks */ }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MACHINE: TRANSITION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function determineState(state: TutorGraphState): TutorState {
  // No profile yet → run intake diagnostic
  if (!state.studentProfile) return 'INTAKE';

  // Lab telemetry present → check for interventions
  if (state.labTelemetry) {
    const { consecutiveFailures, completionTimeMs, averageCompletionTimeMs } = state.labTelemetry;

    // Frustration trigger: 3+ consecutive failures
    if (consecutiveFailures >= 3) return 'INTERVENTION';

    // Boredom trigger: completed 50%+ faster than average
    if (completionTimeMs && averageCompletionTimeMs > 0) {
      if (completionTimeMs < averageCompletionTimeMs * 0.5) return 'CHALLENGE_MODE';
    }

    return 'LAB_OBSERVATION';
  }

  // If competency graph needs updating (new profile, no path)
  if (!state.competencyGraph || state.competencyGraph.currentPathIds.length === 0) {
    return 'PATH_GENERATION';
  }

  // Default: assist with the current lesson
  return 'LESSON_ASSIST';
}

function determineInterventionType(state: TutorGraphState): 'frustration' | 'boredom' | 'drift' {
  if (state.labTelemetry) {
    if (state.labTelemetry.consecutiveFailures >= 3) return 'frustration';
    if (
      state.labTelemetry.completionTimeMs &&
      state.labTelemetry.averageCompletionTimeMs > 0 &&
      state.labTelemetry.completionTimeMs < state.labTelemetry.averageCompletionTimeMs * 0.5
    ) return 'boredom';
  }
  return 'drift';
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS PER STATE
// ─────────────────────────────────────────────────────────────────────────────

function getIntakePrompt(): string {
  return `You are the AI Tutor for AIIntegrationCourse.com running the "Genesis Diagnostic."
Your goal is to build a StudentProfile in exactly 3-5 conversational exchanges.

Evaluate these three dimensions through natural conversation:
1. TECHNICAL VECTOR: Determine if the student is Low (no-code/Flowise only), Medium (some API/scripting), or High (Python/TypeScript fluent).
2. INDUSTRY CONTEXT: What domain do they work in? (Healthcare, Real Estate, Media/Audio, Finance, Legal, Education, etc.)
3. GOVERNANCE POSTURE: Are they Risk-Averse (enterprise/legal/compliance-first), Balanced, or Velocity-Focused (solopreneur/startup/ship-fast)?

Also identify preferred analogies based on their industry for future explanations.

Rules:
- Be warm, conversational, and efficient. This should feel like meeting a mentor, not filling out a form.
- Ask ONE question at a time. Each question should naturally reveal one or more dimensions.
- After gathering enough signal (usually 3-4 exchanges), output a JSON block wrapped in \`\`\`json ... \`\`\` with the StudentProfile.
- The JSON must match this schema exactly:
  { "technicalVector": "low"|"medium"|"high", "industryContext": "string", "governancePosture": "risk-averse"|"balanced"|"velocity-focused", "preferredAnalogies": ["string"] }
- Do NOT output the JSON until you have confident signal on all three dimensions.`;
}

function getPathGenerationPrompt(profile: StudentProfile): string {
  return `You are the Curriculum Pathfinder for AIIntegrationCourse.com.
Given the student's profile, generate a personalized learning path through the Knowledge Graph.

STUDENT PROFILE:
- Technical Level: ${profile.technicalVector}
- Industry: ${profile.industryContext}
- Governance Posture: ${profile.governancePosture}
- Preferred Analogies: ${profile.preferredAnalogies.join(', ')}

AVAILABLE CURRICULUM NODES (Knowledge Graph):
1. ai-fundamentals: "AI Fundamentals & Landscape" (prerequisite: none)
2. prompt-engineering: "Prompt Engineering Mastery" (prerequisite: ai-fundamentals)
3. flowise-basics: "Flowise: Visual Agent Building" (prerequisite: prompt-engineering)
4. api-integration: "API Integration & MCP Protocol" (prerequisite: prompt-engineering)
5. vector-databases: "Vector Databases & RAG Architecture" (prerequisite: api-integration)
6. langchain-orchestration: "LangChain/LangGraph Orchestration" (prerequisite: api-integration)
7. governance-lab-intro: "Governance Lab: Trust-Anchor Architecture" (prerequisite: flowise-basics OR langchain-orchestration)
8. proofguard-attestation: "ProofGuard: Attestation & Audit Trails" (prerequisite: governance-lab-intro)
9. compliance-automation: "Automating IMDA/AICM Compliance" (prerequisite: proofguard-attestation)
10. capstone-project: "Capstone: Build a Governed Agent" (prerequisite: compliance-automation)

ROUTING RULES:
- If technicalVector is "low": Skip "vector-databases" and "langchain-orchestration". Route through flowise-basics → governance-lab-intro.
- If technicalVector is "high": Include all nodes. Emphasize langchain-orchestration.
- If governancePosture is "risk-averse": Prioritize governance nodes earlier in the path.
- If governancePosture is "velocity-focused": Prioritize building nodes first, governance after.

OUTPUT: A JSON array of nodeIds in recommended order, wrapped in \`\`\`json ... \`\`\`.
Also provide a 2-sentence explanation of WHY this path was chosen, personalized to their industry.`;
}

function getLessonAssistPrompt(profile: StudentProfile, lessonContext: string): string {
  return `You are the AI Tutor for AIIntegrationCourse.com. You are a Socratic mentor, not an answer machine.

STUDENT PROFILE:
- Technical Level: ${profile.technicalVector}
- Industry: ${profile.industryContext}
- Governance Posture: ${profile.governancePosture}
- Preferred Analogies: ${profile.preferredAnalogies.join(', ')}

LESSON CONTEXT:
${lessonContext}

RULES:
1. Use ONLY the provided Lesson Context as ground truth. If the question is outside scope, say so.
2. ADAPT your explanations to the student's industry. Use analogies from their domain.
   Example: If they're in audio engineering, explain MCP as "routing a signal through a patch bay."
3. Be Socratic: Ask guiding questions rather than giving direct answers when appropriate.
4. Cite lesson sections inline: (Lesson §N).
5. If the student seems stuck, offer a hint rather than the full solution.
6. End with 2-3 follow-up questions tailored to their level and industry.
7. NEVER give medical, financial, or legal advice.`;
}

function getInterventionPrompt(
  profile: StudentProfile,
  interventionType: 'frustration' | 'boredom' | 'drift',
  labTelemetry: LabTelemetry
): string {
  const base = `You are the AI Tutor intervening proactively during a Governance Lab session.

STUDENT PROFILE:
- Technical Level: ${profile.technicalVector}
- Industry: ${profile.industryContext}
- Preferred Analogies: ${profile.preferredAnalogies.join(', ')}

LAB STATE:
- Lab: ${labTelemetry.labId}
- ProofGuard Audits Passed: ${labTelemetry.proofguardAuditsPassed}
- ProofGuard Audits Failed: ${labTelemetry.proofguardAuditsFailed}
- Consecutive Failures: ${labTelemetry.consecutiveFailures}
- Last Failure Reason: ${labTelemetry.lastFailureReason || 'N/A'}
- Flowise Nodes Used: ${labTelemetry.flowiseNodesUsed.join(', ')}`;

  if (interventionType === 'frustration') {
    return `${base}

INTERVENTION TYPE: FRUSTRATION (3+ consecutive failures)
Your job is to UNBLOCK the student without giving them the answer directly.
- Acknowledge their effort warmly.
- Identify the likely root cause from the lastFailureReason.
- Give a SPECIFIC hint about which Flowise node or configuration to check.
- Use their preferred analogies to reframe the problem.
- Offer to walk them through it step-by-step if they want.
- Do NOT just say "try again" — that's useless. Be specific.`;
  }

  if (interventionType === 'boredom') {
    return `${base}

INTERVENTION TYPE: BOREDOM (completed 50%+ faster than average)
The student is clearly advanced. Challenge them.
- Congratulate them genuinely (not patronizingly).
- Offer a "Challenge Mode" extension: a harder variant of the lab.
- Examples: "Can you make this agent self-correct using a reflection loop?"
  or "Can you add a second governance constraint without breaking the first?"
- Frame it as optional but rewarding (badge/credential implications).`;
  }

  return `${base}

INTERVENTION TYPE: DRIFT (student seems off-track)
- Gently redirect them to the lab objective.
- Summarize what they've accomplished so far.
- Suggest the next logical step.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const doc = await admin.firestore().doc(`users/${uid}`).get();
  return doc.data()?.studentProfile || null;
}

async function saveStudentProfile(uid: string, profile: StudentProfile): Promise<void> {
  await admin.firestore().doc(`users/${uid}`).set(
    { studentProfile: profile },
    { merge: true }
  );
}

async function getCompetencyGraph(uid: string): Promise<CompetencyGraph | null> {
  const doc = await admin.firestore().doc(`users/${uid}`).get();
  return doc.data()?.competencyGraph || null;
}

async function saveCompetencyGraph(uid: string, graph: CompetencyGraph): Promise<void> {
  await admin.firestore().doc(`users/${uid}`).set(
    { competencyGraph: graph },
    { merge: true }
  );
}

async function getConversationHistory(
  uid: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string }>> {
  const snapshot = await admin.firestore()
    .collection(`users/${uid}/tutorConversations`)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = snapshot.docs
    .map(d => d.data() as { role: string; content: string; timestamp: any })
    .reverse();

  return messages.map(m => ({ role: m.role, content: m.content }));
}

async function appendConversation(
  uid: string,
  role: string,
  content: string
): Promise<void> {
  await admin.firestore()
    .collection(`users/${uid}/tutorConversations`)
    .add({
      role,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getLessonContent(lessonPath: string): Promise<string> {
  try {
    const doc = await admin.firestore().doc(lessonPath).get();
    const data = doc.data();
    if (!data) return '';
    return data.md || data.content || data.markdownContent || '';
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

interface TutorV2Request {
  lessonId?: string;
  question: string;
  labTelemetry?: LabTelemetry | { currentLabState?: string; auditFeedback?: any };
  studentProfile?: Partial<StudentProfile>;
  isIntake?: boolean;
}

async function tutorV2Handler(req: any, res: any): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { lessonId, question, labTelemetry: rawLabTelemetry, isIntake } = req.body as TutorV2Request;
    if (!question) {
      res.status(400).send('Missing question');
      return;
    }

    // Normalize lab telemetry: accept both canonical LabTelemetry and simplified AITutorChat format
    let labTelemetry: LabTelemetry | null = null;
    if (rawLabTelemetry && 'labId' in rawLabTelemetry) {
      labTelemetry = rawLabTelemetry as LabTelemetry;
    } else if (rawLabTelemetry && 'currentLabState' in rawLabTelemetry) {
      // Convert simplified format from AITutorChat to LabTelemetry
      const simplified = rawLabTelemetry as { currentLabState?: string; auditFeedback?: any };
      labTelemetry = {
        labId: lessonId || 'unknown',
        proofguardAuditsPassed: simplified.auditFeedback?.passed ? 1 : 0,
        proofguardAuditsFailed: simplified.currentLabState === 'failed' ? 1 : 0,
        consecutiveFailures: simplified.currentLabState === 'failed' ? 1 : 0,
        lastFailureReason: simplified.auditFeedback?.vulnerabilities?.[0]?.description || null,
        completionTimeMs: null,
        averageCompletionTimeMs: 45 * 60 * 1000,
        flowiseNodesUsed: [],
      };
    }

    // Extract UID from Authorization header (Firebase ID token)
    let uid: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        res.status(401).send('Invalid authentication token');
        return;
      }
    }

    if (!uid) {
      res.status(401).send('Authentication required for AI Tutor v2');
      return;
    }

    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) {
      res.status(500).send('GEMINI_API_KEY not configured');
      return;
    }

    // Load student state
    const studentProfile = await getStudentProfile(uid);
    const competencyGraph = await getCompetencyGraph(uid);
    const conversationHistory = await getConversationHistory(uid, 20);

    // Build graph state
    const graphState: TutorGraphState = {
      currentState: 'LESSON_ASSIST',
      studentProfile,
      competencyGraph,
      labTelemetry,
      conversationHistory,
      currentLessonId: lessonId || null,
      interventionType: null,
    };

    // Determine state transition
    if (isIntake) {
      graphState.currentState = 'INTAKE';
    } else {
      graphState.currentState = determineState(graphState);
    }

    if (graphState.currentState === 'INTERVENTION') {
      graphState.interventionType = determineInterventionType(graphState);
    }

    // Build system prompt based on state
    let systemPrompt: string;
    let temperature = 0.7;

    switch (graphState.currentState) {
      case 'INTAKE':
        systemPrompt = getIntakePrompt();
        temperature = 0.8; // slightly more creative for conversation
        break;

      case 'PATH_GENERATION':
        systemPrompt = getPathGenerationPrompt(studentProfile!);
        temperature = 0.3; // more deterministic for path logic
        break;

      case 'INTERVENTION':
        systemPrompt = getInterventionPrompt(
          studentProfile!,
          graphState.interventionType || 'drift',
          labTelemetry!
        );
        temperature = 0.7;
        break;

      case 'CHALLENGE_MODE': {
        const challengeProfile = studentProfile!;
        const challengeTelemetry = labTelemetry!;
        systemPrompt = `You are the AI Tutor in CHALLENGE MODE.

The student completed the lab significantly faster than average, indicating advanced capability.

STUDENT PROFILE:
- Technical Level: ${challengeProfile.technicalVector}
- Industry: ${challengeProfile.industryContext}
- Preferred Analogies: ${challengeProfile.preferredAnalogies.join(', ')}

LAB STATE:
- Lab: ${challengeTelemetry.labId}
- Completion Time: ${challengeTelemetry.completionTimeMs ? Math.round(challengeTelemetry.completionTimeMs / 60000) + ' minutes' : 'unknown'}
- Average Time: ${Math.round(challengeTelemetry.averageCompletionTimeMs / 60000)} minutes
- CQS Audits Passed: ${challengeTelemetry.proofguardAuditsPassed}

YOUR JOB:
1. Congratulate them genuinely (not patronizingly).
2. Offer a "Challenge Mode" extension — a harder variant of the current lab.
3. Challenge ideas:
   - "Can you make this agent self-correct using a reflection loop?"
   - "Can you add a second governance constraint (e.g., data sovereignty) without breaking the first?"
   - "Can you reduce the agent's token usage by 40% while maintaining the same CQS score?"
   - "Can you implement a human-in-the-loop kill switch that activates on confidence < 0.7?"
4. Frame it as optional but rewarding — mention credential/badge implications.
5. Use their industry context to make the challenge relevant.`;
        temperature = 0.8;
        break;
      }

      case 'LAB_OBSERVATION': {
        // Active lab session — Socratic coaching with full lab context
        const labProfile = studentProfile!;
        const labTelem = labTelemetry!;
        systemPrompt = `You are the AI Tutor observing a live Governance Lab session.

STUDENT PROFILE:
- Technical Level: ${labProfile.technicalVector}
- Industry: ${labProfile.industryContext}
- Preferred Analogies: ${labProfile.preferredAnalogies.join(', ')}

LAB STATE:
- Lab: ${labTelem.labId}
- Audits Passed: ${labTelem.proofguardAuditsPassed} | Failed: ${labTelem.proofguardAuditsFailed}
- Consecutive Failures: ${labTelem.consecutiveFailures}
- Last Failure: ${labTelem.lastFailureReason || 'None'}
- Flowise Nodes Used: ${labTelem.flowiseNodesUsed.join(', ') || 'None yet'}

RULES:
1. Be SOCRATIC. Ask guiding questions rather than giving direct answers.
2. Reference the specific Flowise nodes they're using when giving hints.
3. Use analogies from their industry (${labProfile.industryContext}).
4. If they ask "what's wrong" after a failure, point them toward the specific AICM control that was violated.
5. Encourage iterative improvement — each audit attempt teaches something.
6. If they've passed, congratulate and suggest an extension challenge.
7. NEVER give the complete solution. Guide them to discover it.`;
        temperature = 0.7;
        break;
      }

      case 'LESSON_ASSIST':
      default: {
        const lessonContent = lessonId ? await getLessonContent(lessonId) : '';
        // Truncate to ~30k chars for Gemini's context window
        const truncatedContent = lessonContent.slice(0, 30000);
        systemPrompt = getLessonAssistPrompt(studentProfile!, truncatedContent);
        temperature = 0.6;
        break;
      }
    }

    // Build Gemini messages from conversation history + current question
    const geminiMessages: GeminiMessage[] = [];

    // Include recent conversation history for context continuity
    for (const msg of conversationHistory.slice(-10)) {
      geminiMessages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Add current question
    geminiMessages.push({
      role: 'user',
      parts: [{ text: question }],
    });

    // Save user message to conversation history
    await appendConversation(uid, 'user', question);

    // Stream response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullResponse = '';

    try {
      await streamGemini(
        apiKey,
        systemPrompt,
        geminiMessages,
        (chunk) => {
          fullResponse += chunk;
          res.write(chunk);
        },
        temperature,
        2048
      );
    } catch (streamError: any) {
      // Fallback to non-streaming if streaming fails
      console.error('Streaming failed, falling back:', streamError.message);
      try {
        fullResponse = await callGemini(apiKey, systemPrompt, geminiMessages, temperature, 2048);
        res.write(fullResponse);
      } catch (fallbackError: any) {
        res.write('The AI Tutor is temporarily unavailable. Please try again in a moment.');
        res.end();
        return;
      }
    }

    res.end();

    // Post-response processing (non-blocking)
    setImmediate(async () => {
      try {
        // Save assistant response
        await appendConversation(uid!, 'assistant', fullResponse);

        // If in INTAKE state, check if the response contains a StudentProfile JSON
        if (graphState.currentState === 'INTAKE') {
          const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              const profileData = JSON.parse(jsonMatch[1]);
              const newProfile: StudentProfile = {
                technicalVector: profileData.technicalVector || 'medium',
                industryContext: profileData.industryContext || 'general',
                governancePosture: profileData.governancePosture || 'balanced',
                preferredAnalogies: profileData.preferredAnalogies || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await saveStudentProfile(uid!, newProfile);

              // Immediately generate the learning path
              const pathPrompt = getPathGenerationPrompt(newProfile);
              const pathResponse = await callGemini(apiKey, pathPrompt, [
                { role: 'user', parts: [{ text: 'Generate my personalized learning path.' }] }
              ], 0.3, 1024);

              const pathMatch = pathResponse.match(/```json\s*([\s\S]*?)\s*```/);
              if (pathMatch) {
                const pathIds = JSON.parse(pathMatch[1]);
                const defaultNodes: CompetencyNode[] = [
                  { nodeId: 'ai-fundamentals', title: 'AI Fundamentals & Landscape', status: 'available', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'prompt-engineering', title: 'Prompt Engineering Mastery', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'flowise-basics', title: 'Flowise: Visual Agent Building', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'api-integration', title: 'API Integration & MCP Protocol', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'vector-databases', title: 'Vector Databases & RAG Architecture', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'langchain-orchestration', title: 'LangChain/LangGraph Orchestration', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'governance-lab-intro', title: 'Governance Lab: Trust-Anchor Architecture', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'proofguard-attestation', title: 'ProofGuard: Attestation & Audit Trails', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'compliance-automation', title: 'Automating IMDA/AICM Compliance', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                  { nodeId: 'capstone-project', title: 'Capstone: Build a Governed Agent', status: 'locked', score: 0, attempts: 0, lastAttemptAt: null },
                ];

                // Unlock nodes in the generated path
                const pathArray = Array.isArray(pathIds) ? pathIds : [];
                for (const node of defaultNodes) {
                  if (pathArray.includes(node.nodeId)) {
                    node.status = node.nodeId === pathArray[0] ? 'available' : 'locked';
                  }
                }

                const graph: CompetencyGraph = {
                  nodes: defaultNodes,
                  currentPathIds: pathArray,
                  updatedAt: new Date().toISOString(),
                };
                await saveCompetencyGraph(uid!, graph);
              }
            } catch (parseErr) {
              console.error('Failed to parse StudentProfile from intake:', parseErr);
            }
          }
        }

        // If in LAB_OBSERVATION, update competency scores
        if (graphState.currentState === 'LAB_OBSERVATION' && labTelemetry && competencyGraph) {
          const updatedGraph = { ...competencyGraph };
          // Hoist out of the closure below: TS drops the `labTelemetry` non-null
          // narrowing inside the .find() callback (TS18047).
          const labId = labTelemetry.labId;
          const labNode = updatedGraph.nodes.find(n => n.nodeId === labId);
          if (labNode) {
            labNode.attempts += 1;
            labNode.lastAttemptAt = new Date().toISOString();
            if (labTelemetry.proofguardAuditsPassed > 0) {
              labNode.status = 'in_progress';
              const passRate = labTelemetry.proofguardAuditsPassed /
                (labTelemetry.proofguardAuditsPassed + labTelemetry.proofguardAuditsFailed);
              labNode.score = Math.round(passRate * 100);
              if (labNode.score >= 80) {
                labNode.status = 'mastered';
                // Unlock next node in path
                const currentIdx = updatedGraph.currentPathIds.indexOf(labNode.nodeId);
                if (currentIdx >= 0 && currentIdx < updatedGraph.currentPathIds.length - 1) {
                  const nextNodeId = updatedGraph.currentPathIds[currentIdx + 1];
                  const nextNode = updatedGraph.nodes.find(n => n.nodeId === nextNodeId);
                  if (nextNode) nextNode.status = 'available';
                }
              }
            }
            updatedGraph.updatedAt = new Date().toISOString();
            await saveCompetencyGraph(uid!, updatedGraph);
          }
        }
      } catch (postErr) {
        console.error('Post-response processing error:', postErr);
      }
    });
  } catch (e: any) {
    console.error('TutorV2 error:', e?.message || e);
    if (!res.headersSent) {
      res.status(500).send(e?.message || 'Tutor engine error');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: Firebase Function
// ─────────────────────────────────────────────────────────────────────────────

export const tutorV2 = onRequest({
  cors: ALLOWED_ORIGINS,
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 120,
  secrets: [GEMINI_API_KEY],
}, tutorV2Handler);

// Export types for frontend consumption
export type { TutorV2Request, TutorState, TutorGraphState };
