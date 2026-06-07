/**
 * Adaptive Learning Engine Types
 * 
 * These types define the Firestore schema extensions for the AI Tutor v2.0.
 * They are stored on the user document at users/{uid} and in subcollections.
 * 
 * Schema additions to users/{uid}:
 *   - studentProfile: StudentProfile
 *   - competencyGraph: CompetencyGraph
 * 
 * New subcollection: users/{uid}/tutorConversations
 *   - Documents with: { role, content, timestamp }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Student Profile (persisted after intake diagnostic)
// ─────────────────────────────────────────────────────────────────────────────

export type TechnicalVector = 'low' | 'medium' | 'high';
export type GovernancePosture = 'risk-averse' | 'balanced' | 'velocity-focused';

export interface StudentProfile {
  technicalVector: TechnicalVector;
  industryContext: string;
  governancePosture: GovernancePosture;
  preferredAnalogies: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Competency Graph (Knowledge DAG tracking)
// ─────────────────────────────────────────────────────────────────────────────

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface CompetencyNode {
  nodeId: string;
  title: string;
  status: NodeStatus;
  score: number; // 0-100
  attempts: number;
  lastAttemptAt: string | null;
}

export interface CompetencyGraph {
  nodes: CompetencyNode[];
  currentPathIds: string[]; // ordered nodeIds in the student's active path
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab Telemetry (sent from GovernanceLab component)
// ─────────────────────────────────────────────────────────────────────────────

export interface LabTelemetry {
  labId: string;
  proofguardAuditsPassed: number;
  proofguardAuditsFailed: number;
  consecutiveFailures: number;
  lastFailureReason: string | null;
  completionTimeMs: number | null;
  averageCompletionTimeMs: number;
  flowiseNodesUsed: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutor V2 API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TutorV2Request {
  lessonId?: string;
  question: string;
  labTelemetry?: LabTelemetry;
  isIntake?: boolean;
}

export type TutorState =
  | 'INTAKE'
  | 'PATH_GENERATION'
  | 'LESSON_ASSIST'
  | 'LAB_OBSERVATION'
  | 'INTERVENTION'
  | 'CHALLENGE_MODE';

// ─────────────────────────────────────────────────────────────────────────────
// Curriculum Knowledge Graph (static definition)
// ─────────────────────────────────────────────────────────────────────────────

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  technicalLevel: TechnicalVector;
  isGovernance: boolean;
  estimatedMinutes: number;
}

export const CURRICULUM_GRAPH: CurriculumNode[] = [
  {
    id: 'ai-fundamentals',
    title: 'AI Fundamentals & Landscape',
    description: 'Core concepts of AI, ML, and the current ecosystem.',
    prerequisites: [],
    technicalLevel: 'low',
    isGovernance: false,
    estimatedMinutes: 45,
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering Mastery',
    description: 'Crafting effective prompts for LLMs across use cases.',
    prerequisites: ['ai-fundamentals'],
    technicalLevel: 'low',
    isGovernance: false,
    estimatedMinutes: 60,
  },
  {
    id: 'flowise-basics',
    title: 'Flowise: Visual Agent Building',
    description: 'Drag-and-drop agent construction with FlowiseAI.',
    prerequisites: ['prompt-engineering'],
    technicalLevel: 'low',
    isGovernance: false,
    estimatedMinutes: 90,
  },
  {
    id: 'api-integration',
    title: 'API Integration & MCP Protocol',
    description: 'Connecting agents to external services via APIs and Model Context Protocol.',
    prerequisites: ['prompt-engineering'],
    technicalLevel: 'medium',
    isGovernance: false,
    estimatedMinutes: 75,
  },
  {
    id: 'vector-databases',
    title: 'Vector Databases & RAG Architecture',
    description: 'Building retrieval-augmented generation systems with Pinecone/Firestore.',
    prerequisites: ['api-integration'],
    technicalLevel: 'high',
    isGovernance: false,
    estimatedMinutes: 90,
  },
  {
    id: 'langchain-orchestration',
    title: 'LangChain/LangGraph Orchestration',
    description: 'Multi-step agent workflows with state machines.',
    prerequisites: ['api-integration'],
    technicalLevel: 'high',
    isGovernance: false,
    estimatedMinutes: 120,
  },
  {
    id: 'governance-lab-intro',
    title: 'Governance Lab: Trust-Anchor Architecture',
    description: 'Why black-box agents fail enterprise audits. Introduction to governed AI.',
    prerequisites: ['flowise-basics'],
    technicalLevel: 'low',
    isGovernance: true,
    estimatedMinutes: 60,
  },
  {
    id: 'proofguard-attestation',
    title: 'ProofGuard: Attestation & Audit Trails',
    description: 'Integrating tamper-proof audit trails into agent workflows.',
    prerequisites: ['governance-lab-intro'],
    technicalLevel: 'medium',
    isGovernance: true,
    estimatedMinutes: 90,
  },
  {
    id: 'compliance-automation',
    title: 'Automating IMDA/AICM Compliance',
    description: 'Policy agents, kill switches, and human-in-the-loop governance.',
    prerequisites: ['proofguard-attestation'],
    technicalLevel: 'medium',
    isGovernance: true,
    estimatedMinutes: 90,
  },
  {
    id: 'capstone-project',
    title: 'Capstone: Build a Governed Agent',
    description: 'End-to-end project: build, attest, certify.',
    prerequisites: ['compliance-automation'],
    technicalLevel: 'medium',
    isGovernance: true,
    estimatedMinutes: 180,
  },
];
