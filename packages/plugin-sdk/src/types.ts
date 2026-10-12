/**
 * Leverage Studios - Plugin SDK Types
 * Defines plugin contracts, security permission scopes, WASM sandbox profiles,
 * and lifecycle hooks for the 1,000+ plugin ecosystem.
 */

export type PluginCategory =
  | 'agent-tool'
  | 'editor-extension'
  | 'ui-panel'
  | 'llm-provider';

export type SecurityPermission =
  | 'Network:HTTP'
  | 'Network:WebSocket'
  | 'FileSystem:Read'
  | 'FileSystem:Write'
  | 'FileSystem:WorkspaceOnly'
  | 'ProcessExecution:CLI'
  | 'ProcessExecution:Restricted'
  | 'Clipboard:Read'
  | 'Clipboard:Write'
  | 'Environment:Read';

export interface PluginAuthor {
  name: string;
  url?: string;
  verified?: boolean;
}

export interface WasmSandboxConfig {
  memoryLimitMb: number; // e.g. 16MB - 64MB
  gasLimit: number; // Gas metering units to prevent infinite loops
  allowedHosts: string[];
  wasmRuntime: 'extism' | 'wasmtime';
  entrypointExport: string; // e.g., "_start" or "call_plugin"
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  author: PluginAuthor;
  icon?: string;
  tags: string[];
  permissions: SecurityPermission[];
  wasm?: WasmSandboxConfig;
  minStudioVersion: string;
  status: 'active' | 'inactive' | 'untrusted' | 'error';
  downloadsCount: number;
  rating: number; // 0 - 5.0
  installedAt?: number;
}

export interface PluginExecutionContext {
  pluginId: string;
  workspacePath: string;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
  requestPermission: (permission: SecurityPermission) => Promise<boolean>;
  gasUsed: number;
}

export interface PluginInstance {
  manifest: PluginManifest;
  activate: (context: PluginExecutionContext) => Promise<void>;
  deactivate: () => Promise<void>;
  execute?: (functionName: string, inputPayload: any) => Promise<any>;
}

export interface PluginSearchFilter {
  query?: string;
  category?: PluginCategory | 'all';
  permission?: SecurityPermission | 'all';
  installedOnly?: boolean;
  sortBy?: 'popular' | 'rating' | 'name' | 'newest';
}
