/**
 * Leverage Studios - Core Types & Execution Contracts
 * Defines Agent architectures, lifecycle states, AST representation,
 * streaming diff interfaces, and Tauri-Node-Python IPC contracts.
 */

export type AgentLifecycleState =
  | 'Idle'
  | 'Planning'
  | 'Executing Tool'
  | 'Debugging'
  | 'Completed'
  | 'Failed';

export type AgentRole =
  | 'architect'
  | 'coder'
  | 'reviewer'
  | 'debugger'
  | 'tester'
  | 'security-auditor'
  | 'orchestrator';

export interface AgentModelConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'local-wasm';
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  streaming?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  model: AgentModelConfig;
  allowedTools: string[];
  maxIterations?: number;
  timeoutMs?: number;
  canSpawnSubAgents?: boolean;
  securitySandbox?: 'strict' | 'workspace-only' | 'unrestricted';
}

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  enum?: string[];
}

export interface AgentToolDefinition {
  name: string;
  description: string;
  category: 'fs' | 'git' | 'ast' | 'terminal' | 'browser' | 'wasm';
  parameters: Record<string, ToolParameterSchema>;
  requiredPermissions: string[];
  handler: (args: Record<string, any>, context: AgentExecutionContext) => Promise<any>;
}

export interface AgentExecutionContext {
  agentId: string;
  workspaceRoot: string;
  activeFilePath?: string;
  environmentVariables: Record<string, string>;
  emitLog: (level: 'info' | 'warn' | 'error' | 'debug', message: string, payload?: any) => void;
  emitDiff: (diff: StreamingDiff) => void;
  invokeIpc: (channel: string, payload: any) => Promise<any>;
  abortSignal: AbortSignal;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[]; // prefixed with '+', '-', or ' '
}

export interface StreamingDiff {
  id: string;
  filePath: string;
  language: string;
  originalContent: string;
  modifiedContent: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  status: 'streaming' | 'ready' | 'applied' | 'rejected';
  timestamp: number;
}

export interface AgentStep {
  id: string;
  agentId: string;
  timestamp: number;
  type: 'thought' | 'plan' | 'tool_call' | 'tool_result' | 'code_diff' | 'diagnostic' | 'message';
  content: string;
  metadata?: {
    toolName?: string;
    toolArgs?: Record<string, any>;
    toolResult?: any;
    diffId?: string;
    durationMs?: number;
    error?: string;
  };
}

export interface DAGNode {
  id: string;
  agentId: string;
  title: string;
  role: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputs: string[];
  outputs: string[];
  dependencies: string[]; // Node IDs that must complete first
  progress?: number;
  errorMessage?: string;
}

export interface DAGEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  dataKey?: string;
}

export interface DAGWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: DAGNode[];
  edges: DAGEdge[];
  status: 'idle' | 'running' | 'completed' | 'paused' | 'failed';
  startedAt?: number;
  completedAt?: number;
}

export interface ASTNode {
  type: 'FunctionDeclaration' | 'ClassDeclaration' | 'ImportDeclaration' | 'ExportNamedDeclaration' | 'VariableDeclaration' | 'InterfaceDeclaration' | 'TypeAliasDeclaration' | 'Comment' | 'Unknown';
  name?: string;
  startLine: number;
  endLine: number;
  signature?: string;
  docstring?: string;
  children?: ASTNode[];
}

export interface ASTAnalysisResult {
  filePath: string;
  language: string;
  imports: string[];
  exports: string[];
  declarations: ASTNode[];
  complexityScore: number;
  tokenCountEstimate: number;
}

export type IPCRuntimeTarget = 'tauri-rust' | 'node-worker' | 'python-runtime' | 'wasm-sandbox';

export interface IPCMessage<T = any> {
  id: string;
  channel: string;
  sender: IPCRuntimeTarget;
  target: IPCRuntimeTarget;
  payload: T;
  timestamp: number;
  replyTo?: string;
}

export interface IPCResponse<T = any> {
  id: string;
  correlationId: string;
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
