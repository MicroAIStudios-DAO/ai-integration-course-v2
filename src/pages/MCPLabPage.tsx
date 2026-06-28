import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

interface ToolCallResult {
  content: Array<{ type: string; text?: string; resource?: { uri: string; text: string } }>;
  isError?: boolean;
}

type LabSection = 'overview' | 'discover' | 'execute' | 'build';

// ─── Component ──────────────────────────────────────────────────────────────

const MCPLabPage: React.FC = () => {
  const { user } = useAuth();
  const [section, setSection] = useState<LabSection>('overview');
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [result, setResult] = useState<ToolCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Discover tools ─────────────────────────────────────────────────────────

  const handleDiscoverTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const listTools = httpsCallable(functions, 'mcpListTools');
      const response = await listTools({});
      const data = response.data as { tools: MCPTool[] };
      setTools(data.tools);
      setSection('discover');
    } catch (err: any) {
      setError(err.message || 'Failed to discover tools');
    } finally {
      setLoading(false);
    }
  };

  // ─── Execute tool call ──────────────────────────────────────────────────────

  const handleCallTool = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(toolArgs);
      } catch {
        setError('Invalid JSON in arguments field');
        setLoading(false);
        return;
      }

      const callTool = httpsCallable(functions, 'mcpCallTool');
      const response = await callTool({ tool: selectedTool, arguments: parsedArgs });
      setResult(response.data as ToolCallResult);
    } catch (err: any) {
      setError(err.message || 'Tool call failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-400">Please log in to access the MCP Protocol Lab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Model Context Protocol (MCP)</h1>
              <p className="text-slate-400 text-sm">The USB-C for AI Agents</p>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-3xl">
            MCP is an open standard (created by Anthropic) that lets AI models access external tools and data 
            through a universal interface. In this lab, you'll discover tools, execute calls, and learn to 
            build your own MCP server.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview' as LabSection, label: 'Overview' },
            { id: 'discover' as LabSection, label: 'Discover Tools' },
            { id: 'execute' as LabSection, label: 'Execute Calls' },
            { id: 'build' as LabSection, label: 'Build Your Own' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                section === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {/* Overview */}
          {section === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">What is MCP?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                  <h3 className="text-violet-400 font-semibold mb-2">The Problem</h3>
                  <p className="text-slate-300 text-sm">
                    Every AI tool integration requires custom code. An agent that uses 10 tools needs 10 
                    different API integrations, each with its own auth, schema, and error handling.
                  </p>
                </div>
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <h3 className="text-emerald-400 font-semibold mb-2">The MCP Solution</h3>
                  <p className="text-slate-300 text-sm">
                    MCP provides a single protocol for tool discovery, execution, and data access. 
                    Build one MCP server, and any MCP client (Claude, Cursor, custom agents) can use it.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-600/30">
                <h3 className="text-lg font-semibold text-white mb-4">MCP Architecture</h3>
                <div className="font-mono text-sm text-slate-300 space-y-2">
                  <p className="text-violet-400">┌─────────────────────────────────────────────┐</p>
                  <p className="text-violet-400">│  <span className="text-white">MCP Client</span> (Claude Desktop, Cursor, Agent)   │</p>
                  <p className="text-violet-400">└────────────────────┬────────────────────────┘</p>
                  <p className="text-slate-500">                     │ JSON-RPC over stdio/HTTP</p>
                  <p className="text-violet-400">┌────────────────────┴────────────────────────┐</p>
                  <p className="text-violet-400">│  <span className="text-white">MCP Server</span> (Your course platform)            │</p>
                  <p className="text-violet-400">│                                             │</p>
                  <p className="text-violet-400">│  Tools:                                     │</p>
                  <p className="text-violet-400">│    • search_lessons                         │</p>
                  <p className="text-violet-400">│    • get_lesson_content                     │</p>
                  <p className="text-violet-400">│    • get_student_progress                   │</p>
                  <p className="text-violet-400">│    • list_labs                              │</p>
                  <p className="text-violet-400">│    • get_governance_score                   │</p>
                  <p className="text-violet-400">└─────────────────────────────────────────────┘</p>
                </div>
              </div>

              <button
                onClick={handleDiscoverTools}
                disabled={loading}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Discovering...' : 'Discover Available Tools →'}
              </button>
            </div>
          )}

          {/* Discover Tools */}
          {section === 'discover' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Available MCP Tools</h2>
              
              {tools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">No tools loaded yet.</p>
                  <button
                    onClick={handleDiscoverTools}
                    disabled={loading}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm"
                  >
                    {loading ? 'Loading...' : 'Load Tools'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedTool === tool.name
                          ? 'bg-violet-500/10 border-violet-500/50'
                          : 'bg-slate-900/30 border-slate-700/50 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedTool(tool.name);
                        // Pre-populate args based on schema
                        const defaultArgs: Record<string, string> = {};
                        if (tool.inputSchema.required) {
                          tool.inputSchema.required.forEach((key) => {
                            if (key === 'uid' && user) defaultArgs[key] = user.uid;
                            else if (key === 'query') defaultArgs[key] = 'governance';
                            else defaultArgs[key] = '';
                          });
                        }
                        setToolArgs(JSON.stringify(defaultArgs, null, 2));
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-semibold font-mono text-sm">{tool.name}</h3>
                          <p className="text-slate-400 text-sm mt-1">{tool.description}</p>
                        </div>
                        {selectedTool === tool.name && (
                          <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">Selected</span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(tool.inputSchema.properties).map(([key, prop]) => (
                          <span
                            key={key}
                            className={`text-xs px-2 py-1 rounded ${
                              tool.inputSchema.required?.includes(key)
                                ? 'bg-violet-500/20 text-violet-300'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {key}: {prop.type}
                            {tool.inputSchema.required?.includes(key) && ' *'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setSection('execute')}
                    disabled={!selectedTool}
                    className="mt-4 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all"
                  >
                    Execute Selected Tool →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Execute Tool Call */}
          {section === 'execute' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Execute Tool Call</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Tool</label>
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600/50 rounded-xl text-white mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="">Select a tool...</option>
                    {tools.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>

                  <label className="block text-sm font-medium text-slate-400 mb-2">Arguments (JSON)</label>
                  <textarea
                    value={toolArgs}
                    onChange={(e) => setToolArgs(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600/50 rounded-xl text-white font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                    placeholder='{"query": "governance"}'
                  />

                  <button
                    onClick={handleCallTool}
                    disabled={loading || !selectedTool}
                    className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all"
                  >
                    {loading ? 'Executing...' : 'Call Tool'}
                  </button>
                </div>

                {/* Output */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Response</label>
                  <div className="h-[320px] overflow-auto bg-slate-900/80 border border-slate-600/50 rounded-xl p-4">
                    {result ? (
                      <pre className={`text-sm font-mono whitespace-pre-wrap ${result.isError ? 'text-red-400' : 'text-emerald-300'}`}>
                        {result.content.map((c) => c.text || c.resource?.text || '').join('\n')}
                      </pre>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Response will appear here after executing a tool call.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Build Your Own */}
          {section === 'build' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Build Your Own MCP Server</h2>
              <p className="text-slate-300 mb-6">
                Use this template to create your own MCP server. This Node.js template implements the 
                MCP protocol and can be connected to Claude Desktop, Cursor, or any MCP-compatible client.
              </p>

              <div className="bg-slate-900/80 rounded-xl p-6 mb-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-500">mcp-server-template/index.ts</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(MCP_TEMPLATE_CODE)}
                    className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {MCP_TEMPLATE_CODE}
                </pre>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
                <h3 className="text-violet-400 font-semibold mb-3">Quick Start</h3>
                <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Clone the template: <code className="text-violet-300">npx create-mcp-server my-server</code></li>
                  <li>Define your tools in <code className="text-violet-300">tools.ts</code></li>
                  <li>Implement tool handlers that query your data sources</li>
                  <li>Add to Claude Desktop config: <code className="text-violet-300">~/.config/claude/claude_desktop_config.json</code></li>
                  <li>Test with: <code className="text-violet-300">npx @modelcontextprotocol/inspector</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MCP Server Template Code ───────────────────────────────────────────────

const MCP_TEMPLATE_CODE = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create the MCP server
const server = new Server(
  { name: "my-course-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_content",
      description: "Search course content by topic",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search_content": {
      const query = args?.query as string;
      // Replace with your actual data source query
      const results = await searchYourDatabase(query);
      return {
        content: [{ type: "text", text: JSON.stringify(results) }],
      };
    }
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Your data source function
async function searchYourDatabase(query: string) {
  // Connect to Firestore, Pinecone, or any data source
  return [{ title: "Example Result", relevance: 0.95 }];
}`;

export default MCPLabPage;
