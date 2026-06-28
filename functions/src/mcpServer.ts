/**
 * Model Context Protocol (MCP) Server Module
 *
 * Firebase Cloud Functions that expose the course platform as an MCP-compatible server.
 * Students learn to:
 *   1. Understand MCP architecture (the "USB-C for AI agents")
 *   2. Query course data through a standardized tool interface
 *   3. Build their own MCP servers using the provided template
 *
 * MCP Endpoints:
 *   - mcpListTools — Returns available tools (MCP discovery)
 *   - mcpCallTool — Executes a tool call and returns structured results
 *   - mcpGetSchema — Returns the JSON Schema for the MCP server capabilities
 *
 * This implements a simplified MCP server that students can connect to from
 * Claude Desktop, Cursor, or any MCP-compatible client.
 *
 * Reference: https://modelcontextprotocol.io/docs
 */

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// ─── MCP Types (simplified for educational purposes) ────────────────────────

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

interface MCPToolCallRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

interface MCPToolCallResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: { uri: string; mimeType: string; text: string };
  }>;
  isError?: boolean;
}

// ─── Available Tools ────────────────────────────────────────────────────────

const MCP_TOOLS: MCPTool[] = [
  {
    name: 'search_lessons',
    description: 'Search course lessons by keyword or topic. Returns matching lesson titles, descriptions, and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (keyword or topic)' },
        module: { type: 'string', description: 'Optional: filter by module (governance, infrastructure, orchestration)' },
        limit: { type: 'string', description: 'Maximum number of results (default: 5, max: 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_lesson_content',
    description: 'Retrieve the full content of a specific lesson by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        lessonId: { type: 'string', description: 'The unique lesson identifier' },
      },
      required: ['lessonId'],
    },
  },
  {
    name: 'get_student_progress',
    description: 'Get the current student progress including competency graph, completed lessons, and governance score.',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Firebase user ID' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'list_labs',
    description: 'List all available hands-on labs with their status and prerequisites.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by lab status',
          enum: ['available', 'locked', 'completed', 'all'],
        },
      },
    },
  },
  {
    name: 'get_governance_score',
    description: 'Calculate and return the governance score for a student based on their attestation history.',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Firebase user ID' },
      },
      required: ['uid'],
    },
  },
];

// ─── Tool Implementations ───────────────────────────────────────────────────

async function executeSearchLessons(args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  const db = getFirestore();
  const query = (args.query as string || '').toLowerCase();
  const moduleFilter = args.module as string | undefined;
  const limit = Math.min(parseInt(args.limit as string || '5', 10), 20);

  // Query all lessons across courses
  const lessonsSnap = await db.collectionGroup('lessons').limit(100).get();
  
  const matches = lessonsSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        module: data.module || '',
        durationMinutes: data.durationMinutes || 0,
        isFree: data.isFree || false,
      };
    })
    .filter((lesson) => {
      const matchesQuery = lesson.title.toLowerCase().includes(query) ||
        lesson.description.toLowerCase().includes(query);
      const matchesModule = !moduleFilter || lesson.module.toLowerCase() === moduleFilter.toLowerCase();
      return matchesQuery && matchesModule;
    })
    .slice(0, limit);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        results: matches,
        totalFound: matches.length,
        query,
        ...(moduleFilter ? { moduleFilter } : {}),
      }, null, 2),
    }],
  };
}

async function executeGetLessonContent(args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  const db = getFirestore();
  const lessonId = args.lessonId as string;

  if (!lessonId) {
    return { content: [{ type: 'text', text: 'Error: lessonId is required' }], isError: true };
  }

  // Search across all courses/modules for this lesson
  const lessonsSnap = await db.collectionGroup('lessons')
    .where('__name__', '==', lessonId)
    .limit(1)
    .get();

  if (lessonsSnap.empty) {
    // Try by document ID match
    const allLessons = await db.collectionGroup('lessons').limit(200).get();
    const found = allLessons.docs.find((d) => d.id === lessonId);
    if (!found) {
      return { content: [{ type: 'text', text: `Lesson "${lessonId}" not found.` }], isError: true };
    }
    const data = found.data();
    return {
      content: [{
        type: 'resource',
        resource: {
          uri: `course://lessons/${lessonId}`,
          mimeType: 'application/json',
          text: JSON.stringify({
            id: found.id,
            title: data.title,
            description: data.description,
            content: data.markdownContent || data.content || '(Content available in full course)',
            durationMinutes: data.durationMinutes,
            module: data.module,
            prerequisites: data.prerequisites || [],
          }, null, 2),
        },
      }],
    };
  }

  const doc = lessonsSnap.docs[0];
  const data = doc.data();
  return {
    content: [{
      type: 'resource',
      resource: {
        uri: `course://lessons/${lessonId}`,
        mimeType: 'application/json',
        text: JSON.stringify({
          id: doc.id,
          title: data.title,
          description: data.description,
          content: data.markdownContent || data.content || '(Content available in full course)',
          durationMinutes: data.durationMinutes,
          module: data.module,
          prerequisites: data.prerequisites || [],
        }, null, 2),
      },
    }],
  };
}

async function executeGetStudentProgress(args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  const db = getFirestore();
  const uid = args.uid as string;

  if (!uid) {
    return { content: [{ type: 'text', text: 'Error: uid is required' }], isError: true };
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    return { content: [{ type: 'text', text: `User "${uid}" not found.` }], isError: true };
  }

  const data = userDoc.data()!;
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        studentProfile: data.studentProfile || null,
        competencyGraph: data.competencyGraph || null,
        premium: data.premium || false,
        subscriptionStatus: data.subscriptionStatus || 'free',
        completedLessons: data.completedLessons || [],
        lastActiveAt: data.lastActiveAt || null,
      }, null, 2),
    }],
  };
}

async function executeListLabs(args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  const db = getFirestore();
  const statusFilter = (args.status as string) || 'all';

  const labsSnap = await db.collection('labs').get();
  let labs = labsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (statusFilter !== 'all') {
    labs = labs.filter((lab: any) => lab.status === statusFilter);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ labs, totalCount: labs.length }, null, 2),
    }],
  };
}

async function executeGetGovernanceScore(args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  const db = getFirestore();
  const uid = args.uid as string;

  if (!uid) {
    return { content: [{ type: 'text', text: 'Error: uid is required' }], isError: true };
  }

  const attestationsSnap = await db
    .collection('users').doc(uid)
    .collection('attestations')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const attestations = attestationsSnap.docs.map((doc) => doc.data());
  const totalAttempts = attestations.length;
  const passed = attestations.filter((a: any) => a.passed === true).length;
  const averageCqs = attestations.length > 0
    ? attestations.reduce((sum: number, a: any) => sum + (a.cqsScore || 0), 0) / attestations.length
    : 0;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        uid,
        governanceScore: Math.round(averageCqs),
        totalAttempts,
        passed,
        passRate: totalAttempts > 0 ? `${Math.round((passed / totalAttempts) * 100)}%` : 'N/A',
        lastAttestation: attestations[0] || null,
      }, null, 2),
    }],
  };
}

// ─── Route tool calls ───────────────────────────────────────────────────────

async function routeToolCall(toolName: string, args: Record<string, unknown>): Promise<MCPToolCallResponse> {
  switch (toolName) {
    case 'search_lessons': return executeSearchLessons(args);
    case 'get_lesson_content': return executeGetLessonContent(args);
    case 'get_student_progress': return executeGetStudentProgress(args);
    case 'list_labs': return executeListLabs(args);
    case 'get_governance_score': return executeGetGovernanceScore(args);
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

// ─── Exported Functions ─────────────────────────────────────────────────────

/**
 * MCP List Tools — Discovery endpoint
 * Returns all available tools with their schemas
 */
export const mcpListTools = onCall(
  { enforceAppCheck: false, cors: true },
  async () => {
    return {
      tools: MCP_TOOLS,
      serverInfo: {
        name: 'ai-integration-course-mcp',
        version: '1.0.0',
        description: 'MCP server for the AI Integration Course platform. Exposes course content, student progress, and governance data.',
      },
    };
  }
);

/**
 * MCP Call Tool — Execute a tool call
 */
export const mcpCallTool = onCall(
  { enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to use MCP tools.');
    }

    const { tool, arguments: args } = request.data as MCPToolCallRequest;

    if (!tool) {
      throw new HttpsError('invalid-argument', 'Must specify a tool name.');
    }

    const validTools = MCP_TOOLS.map((t) => t.name);
    if (!validTools.includes(tool)) {
      throw new HttpsError('invalid-argument', `Unknown tool "${tool}". Available: ${validTools.join(', ')}`);
    }

    const result = await routeToolCall(tool, args || {});
    return result;
  }
);

/**
 * MCP HTTP Endpoint — For external MCP clients (Claude Desktop, Cursor, etc.)
 * Implements the MCP JSON-RPC protocol over HTTP
 */
export const mcpEndpoint = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    const { method, params, id } = req.body as {
      method: string;
      params?: Record<string, unknown>;
      id?: string | number;
    };

    try {
      let result: unknown;

      switch (method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: {
              name: 'ai-integration-course',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          result = { tools: MCP_TOOLS };
          break;

        case 'tools/call': {
          const toolName = (params as any)?.name as string;
          const toolArgs = (params as any)?.arguments || {};
          result = await routeToolCall(toolName, toolArgs);
          break;
        }

        default:
          result = { error: { code: -32601, message: `Method not found: ${method}` } };
      }

      res.status(200).json({
        jsonrpc: '2.0',
        id: id || null,
        result,
      });
    } catch (err: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32603, message: err.message || 'Internal error' },
      });
    }
  }
);
