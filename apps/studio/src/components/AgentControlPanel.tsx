/**
 * Leverage Studios - Agent Control Panel
 * Includes:
 * 1. Visual DAG Workflow Builder (Node dependencies, multi-agent pipeline)
 * 2. Real-Time Agent Console (Lifecycle states: Idle, Planning, Executing Tool, Debugging, Completed)
 * 3. High-Scale Plugin Manager (1,000+ plugins indexed, security permissions, WASM memory metrics)
 * 4. Tauri Rust IPC & System Diagnostics
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Terminal,
  Puzzle,
  Cpu,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Shield,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Box,
  HardDrive,
  Wrench,
  Radio,
  Sliders,
  Send,
} from 'lucide-react';
import {
  AgentManager,
  BaseAgent,
  DAGWorkflow,
  DAGNode,
  AgentLifecycleState,
  StreamingDiff,
  IPCBridge,
} from '@leverage/core';
import { PluginRegistry, PluginManifest, PluginCategory } from '@leverage/plugin-sdk';
import { sandboxRuntime, SandboxExecutionResult } from './../../../../src/lib/runtime/sandbox.ts';
import { RightPanelTab } from '../types.ts';

interface AgentControlPanelProps {
  activeFilePath?: string;
  fileContent?: string;
  onApplyDiff: (diff: StreamingDiff) => void;
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
}

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  activeFilePath,
  fileContent,
  onApplyDiff,
  tab,
  onTabChange,
}) => {
  const agentManager = AgentManager.getInstance();
  const pluginRegistry = PluginRegistry.getInstance();
  const ipcBridge = IPCBridge.getInstance();

  // Workflow state
  const [workflows, setWorkflows] = useState<DAGWorkflow[]>(agentManager.getWorkflows());
  const [selectedWorkflow, setSelectedWorkflow] = useState<DAGWorkflow>(workflows[0]);
  const [selectedNode, setSelectedNode] = useState<DAGNode | null>(workflows[0]?.nodes[0] || null);
  const [isExecutingWf, setIsExecutingWf] = useState<boolean>(false);

  // Agent Console state
  const [agents, setAgents] = useState<BaseAgent[]>(agentManager.listAgents());
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.config.id || 'agent_coder');
  const [consoleInstruction, setConsoleInstruction] = useState<string>('Refactor function error handling with strict AST safety invariants');
  const [consoleLogs, setConsoleLogs] = useState<any[]>([]);
  const [activeDiffs, setActiveDiffs] = useState<StreamingDiff[]>([]);

  // Plugin Manager state
  const [pluginSearch, setPluginSearch] = useState<string>('');
  const [pluginCategory, setPluginCategory] = useState<PluginCategory | 'all'>('all');
  const [installedOnly, setInstalledOnly] = useState<boolean>(false);
  const [pluginList, setPluginList] = useState<PluginManifest[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [telemetry, setTelemetry] = useState(pluginRegistry.getEcosystemTelemetry());

  // System Diagnostics state
  const [ipcTelemetry, setIpcTelemetry] = useState(ipcBridge.getTelemetryHistory());
  const [systemDiag, setSystemDiag] = useState<any>(null);

  // Real Iframe Sandbox Execution state
  const [sandboxCode, setSandboxCode] = useState<string>(
    'function run(input) {\n  console.log("Isolated sandbox execution for:", input.name);\n  return { status: "success", executedAt: Date.now(), input: input };\n}'
  );
  const [isExecutingSandbox, setIsExecutingSandbox] = useState<boolean>(false);
  const [sandboxExecResult, setSandboxExecResult] = useState<SandboxExecutionResult | null>(null);

  const handleRunInIframeSandbox = async () => {
    if (!selectedPlugin) return;
    setIsExecutingSandbox(true);
    setSandboxExecResult(null);

    try {
      const res = await sandboxRuntime.executePluginCode(
        sandboxCode,
        {
          id: selectedPlugin.id,
          name: selectedPlugin.name,
          category: selectedPlugin.category,
          permissions: selectedPlugin.permissions,
        },
        { functionName: 'run', timeoutMs: 6000 }
      );
      setSandboxExecResult(res);
    } catch (err: any) {
      setSandboxExecResult({
        success: false,
        result: null,
        logs: [`[FATAL ERROR] ${err?.message || 'Execution failed'}`],
        durationMs: 0,
        error: err?.message || 'Execution error',
      });
    } finally {
      setIsExecutingSandbox(false);
    }
  };

  // Subscribe to changes
  useEffect(() => {
    const unsubAgents = agentManager.subscribe(() => {
      setWorkflows([...agentManager.getWorkflows()]);
      const current = agentManager.getWorkflow(selectedWorkflow.id);
      if (current) setSelectedWorkflow({ ...current });
      setActiveDiffs([...agentManager.getDiffHistory()]);
    });

    const unsubPlugins = pluginRegistry.subscribe(() => {
      refreshPlugins();
      setTelemetry(pluginRegistry.getEcosystemTelemetry());
    });

    refreshPlugins();

    ipcBridge.send('tauri:system:info', {}).then((diag) => {
      setSystemDiag(diag);
    });

    return () => {
      unsubAgents();
      unsubPlugins();
    };
  }, [selectedWorkflow.id]);

  const refreshPlugins = () => {
    const results = pluginRegistry.searchPlugins({
      query: pluginSearch,
      category: pluginCategory,
      installedOnly,
      sortBy: 'popular',
    });
    setPluginList(results.slice(0, 80)); // Virtualized slice for snappy 60fps rendering
  };

  useEffect(() => {
    refreshPlugins();
  }, [pluginSearch, pluginCategory, installedOnly]);

  // Execute single agent task
  const handleExecuteSingleAgent = async () => {
    const agent = agentManager.getAgent(selectedAgentId);
    if (!agent) return;

    setConsoleLogs((prev) => [
      ...prev,
      { type: 'user', content: consoleInstruction, timestamp: Date.now() },
    ]);

    const res = await agent.executeTask(consoleInstruction, {
      workspaceRoot: '/workspace',
      activeFilePath,
      fileContent,
    });

    setConsoleLogs(agent.getSteps());
    if (res.diffs.length > 0) {
      setActiveDiffs(res.diffs);
    }
  };

  // Execute full DAG workflow
  const handleExecuteWorkflow = async () => {
    setIsExecutingWf(true);
    try {
      await agentManager.executeWorkflow(selectedWorkflow.id, {
        workspaceRoot: '/workspace',
        activeFilePath,
        fileContent,
      });
      // Refresh selected workflow reference
      const updated = agentManager.getWorkflow(selectedWorkflow.id);
      if (updated) setSelectedWorkflow({ ...updated });
    } finally {
      setIsExecutingWf(false);
    }
  };

  const getStatusBadge = (state: AgentLifecycleState | string) => {
    switch (state) {
      case 'Planning':
        return <span className="text-sky-400 font-mono text-[11px]">Planning</span>;
      case 'Executing Tool':
      case 'running':
        return <span className="text-amber-400 font-mono text-[11px]">Executing Tool</span>;
      case 'Debugging':
        return <span className="text-purple-400 font-mono text-[11px]">Debugging</span>;
      case 'Completed':
      case 'completed':
        return <span className="text-emerald-400 font-mono text-[11px]">Completed</span>;
      case 'failed':
      case 'Failed':
        return <span className="text-rose-400 font-mono text-[11px]">Failed</span>;
      default:
        return <span className="text-neutral-500 font-mono text-[11px]">Idle</span>;
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0f121a] border-l border-[#1a1e29] select-none text-xs">
      {/* Top Section Nav Tabs */}
      <div className="flex items-center justify-between border-b border-[#1a1e29] bg-[#11141e] px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('dag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === 'dag' ? 'bg-[#1d2232] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" /> Visual DAG
          </button>
          <button
            onClick={() => onTabChange('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === 'console' ? 'bg-[#1d2232] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-sky-400" /> Agent Console
          </button>
          <button
            onClick={() => onTabChange('plugins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === 'plugins' ? 'bg-[#1d2232] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Puzzle className="h-3.5 w-3.5 text-emerald-400" /> Plugins ({telemetry.totalRegistered})
          </button>
          <button
            onClick={() => onTabChange('ipc-diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              tab === 'ipc-diagnostics' ? 'bg-[#1d2232] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-orange-400" /> Tauri IPC
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL DAG WORKFLOW BUILDER */}
      {tab === 'dag' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Workflow Header & Trigger */}
          <div className="flex items-center justify-between border-b border-[#1a1e29] px-4 py-2.5 bg-[#121622]">
            <div>
              <div className="font-semibold text-white text-xs">{selectedWorkflow.name}</div>
              <div className="text-[11px] text-neutral-400">{selectedWorkflow.nodes.length} connected agents · Status: {getStatusBadge(selectedWorkflow.status)}</div>
            </div>
            <button
              onClick={handleExecuteWorkflow}
              disabled={isExecutingWf}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isExecutingWf ? 'Orchestrating...' : 'Run DAG Pipeline'}
            </button>
          </div>

          {/* Interactive DAG Pipeline Graph */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0c0e14]">
            <div className="text-[11px] text-neutral-400 mb-2">
              Directed Acyclic Graph Execution Pipeline (Click node to inspect agent spec):
            </div>

            <div className="space-y-3 relative">
              {selectedWorkflow.nodes.map((node, index) => {
                const isSelected = selectedNode?.id === node.id;
                const agent = agentManager.getAgent(node.agentId);

                return (
                  <div key={node.id} className="relative">
                    {/* Visual Connector Edge */}
                    {index < selectedWorkflow.nodes.length - 1 && (
                      <div className="absolute left-6 top-12 h-6 w-0.5 bg-[#252b3b]" />
                    )}

                    <div
                      onClick={() => setSelectedNode(node)}
                      className={`relative flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-[#151926] shadow-sm'
                          : 'border-[#1e2330] bg-[#11141d] hover:border-[#2f374a]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Step indicator circle */}
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold font-mono ${
                            node.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : node.status === 'running'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <div className="font-medium text-white text-xs flex items-center gap-2">
                            <span>{node.title}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">({node.role})</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Agent: {agent?.config.name || node.agentId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {node.progress !== undefined && node.status === 'running' && (
                          <div className="w-16 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${node.progress}%` }}
                            />
                          </div>
                        )}
                        <div>{getStatusBadge(node.status)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Inspector Card */}
            {selectedNode && (
              <div className="mt-4 rounded-xl border border-[#1e2330] bg-[#11141d] p-3 text-xs">
                <div className="font-semibold text-white mb-2 flex items-center justify-between">
                  <span>Inspecting Node: {selectedNode.title}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{selectedNode.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Inputs:</span> {selectedNode.inputs.join(', ')}
                  </div>
                  <div>
                    <span className="text-neutral-500">Outputs:</span> {selectedNode.outputs.join(', ')}
                  </div>
                  <div>
                    <span className="text-neutral-500">Dependencies:</span> {selectedNode.dependencies.join(', ') || 'Root node'}
                  </div>
                  <div>
                    <span className="text-neutral-500">Assigned Agent:</span> {selectedNode.agentId}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AGENT CONSOLE */}
      {tab === 'console' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Agent Selector & State Header */}
          <div className="flex items-center justify-between border-b border-[#1a1e29] px-4 py-2 bg-[#121622]">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Active Agent:</span>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="rounded bg-[#0b0d13] border border-[#1a1e29] px-2 py-1 text-white text-xs focus:outline-none"
              >
                {agents.map((a) => (
                  <option key={a.config.id} value={a.config.id}>
                    {a.config.name} ({a.config.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              Status: {getStatusBadge(agentManager.getAgent(selectedAgentId)?.getState() || 'Idle')}
            </div>
          </div>

          {/* Console Step Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[11px] bg-[#0c0e14]">
            {consoleLogs.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                Agent console ready. Enter an instruction below to execute autonomous reasoning and streaming diffs.
              </div>
            ) : (
              consoleLogs.map((step, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-2.5 border ${
                    step.type === 'thought'
                      ? 'border-indigo-900/40 bg-indigo-950/20 text-indigo-300'
                      : step.type === 'plan'
                      ? 'border-purple-900/40 bg-purple-950/20 text-purple-300'
                      : step.type === 'tool_call'
                      ? 'border-amber-900/40 bg-amber-950/20 text-amber-300'
                      : step.type === 'code_diff'
                      ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-300'
                      : 'border-[#1e2330] bg-[#11141d] text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                    <span className="uppercase tracking-wider font-semibold">[{step.type}]</span>
                    <span>{new Date(step.timestamp || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{step.content}</div>

                  {step.metadata?.diffId && (
                    <button
                      onClick={() => {
                        const d = agentManager.getDiffHistory().find((x) => x.id === step.metadata.diffId);
                        if (d) onApplyDiff(d);
                      }}
                      className="mt-2 flex items-center gap-1 rounded bg-emerald-600/30 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50"
                    >
                      <Sparkles className="h-3 w-3" /> View & Accept Patch
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="border-t border-[#1a1e29] p-3 bg-[#11141e]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={consoleInstruction}
                onChange={(e) => setConsoleInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSingleAgent()}
                placeholder="Instruct agent..."
                className="flex-1 rounded-lg bg-[#0b0d13] border border-[#1a1e29] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleExecuteSingleAgent}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HIGH-SCALE PLUGIN MANAGER (1,000+ Plugins) */}
      {tab === 'plugins' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Ecosystem Telemetry Banner */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#121622] border-b border-[#1a1e29] text-center">
            <div className="rounded bg-[#0b0d13] p-1.5 border border-[#1a1e29]">
              <div className="text-[10px] text-neutral-400">Total Indexed</div>
              <div className="font-mono text-white font-semibold text-xs mt-0.5">
                {telemetry.totalRegistered.toLocaleString()} Plugins
              </div>
            </div>
            <div className="rounded bg-[#0b0d13] p-1.5 border border-[#1a1e29]">
              <div className="text-[10px] text-neutral-400">Active Sandboxes</div>
              <div className="font-mono text-emerald-400 font-semibold text-xs mt-0.5">
                {telemetry.activePlugins} Running
              </div>
            </div>
            <div className="rounded bg-[#0b0d13] p-1.5 border border-[#1a1e29]">
              <div className="text-[10px] text-neutral-400">Memory Cap</div>
              <div className="font-mono text-indigo-400 font-semibold text-xs mt-0.5">
                {telemetry.totalMemoryAllocatedMb} MB
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-[#1a1e29] bg-[#0f121a] space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search across 1,000+ plugins by keyword, tag, or author..."
                value={pluginSearch}
                onChange={(e) => setPluginSearch(e.target.value)}
                className="w-full rounded bg-[#0b0d13] border border-[#1a1e29] pl-8 pr-2 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category Segmented Controls */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              {(['all', 'agent-tool', 'editor-extension', 'ui-panel', 'llm-provider'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPluginCategory(cat)}
                  className={`rounded px-2.5 py-1 whitespace-nowrap transition-colors ${
                    pluginCategory === cat ? 'bg-indigo-600 text-white font-medium' : 'bg-[#181d2a] text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All (1,024)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Plugin Virtualized List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0c0e14]">
            {pluginList.map((p) => {
              const isSelected = selectedPlugin?.id === p.id;
              const isActive = p.status === 'active';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlugin(p)}
                  className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-[#151926]'
                      : 'border-[#1e2330] bg-[#11141d] hover:border-[#2f374a]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">v{p.version}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{p.description}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        pluginRegistry.togglePlugin(p.id);
                      }}
                      className={`px-3 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ml-2 ${
                        isActive
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-950/40 hover:text-rose-300'
                          : 'bg-[#1e2330] text-neutral-300 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      {isActive ? 'Active' : 'Enable'}
                    </button>
                  </div>

                  {/* Metadata and Permissions */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-neutral-500">By {p.author.name}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-amber-400 font-mono">★ {p.rating}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-400">{p.downloadsCount.toLocaleString()} dl</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-indigo-400 font-mono">{p.wasm?.wasmRuntime}</span>

                    {/* Permissions list */}
                    {p.permissions.slice(0, 2).map((perm, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-[#1a1e29] px-1.5 py-0.5 text-neutral-300 font-mono"
                      >
                        {perm}
                      </span>
                    ))}
                    {p.permissions.length > 2 && (
                      <span className="text-neutral-500">+{p.permissions.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plugin Detail Inspector Footer if selected */}
          {selectedPlugin && (
            <div className="p-3 border-t border-[#1a1e29] bg-[#121622] text-xs space-y-3">
              <div className="flex items-center justify-between font-semibold text-white">
                <div className="flex items-center gap-2">
                  <span>{selectedPlugin.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    sandbox="allow-scripts"
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">ID: {selectedPlugin.id}</span>
              </div>
              <div className="text-neutral-300 text-[11px]">{selectedPlugin.description}</div>

              {/* Real Isolated Iframe Sandbox Runner */}
              <div className="rounded-lg bg-[#0a0c10] border border-[#1e2330] p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-indigo-400" />
                    Isolated Execution Container (postMessage)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">No same-origin access</span>
                </div>

                <textarea
                  rows={3}
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="w-full rounded bg-[#11141d] border border-[#1e2330] p-2 font-mono text-[11px] text-neutral-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter guest plugin code..."
                />

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={handleRunInIframeSandbox}
                    disabled={isExecutingSandbox}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    {isExecutingSandbox ? 'Executing in Iframe...' : 'Run in Isolated Sandbox'}
                  </button>
                  <button
                    onClick={async () => {
                      const res = await pluginRegistry.runSimulatedPreviewPlugin(selectedPlugin.id, 'format_code', { ping: true });
                      setSandboxExecResult({
                        success: res.success,
                        result: res.output,
                        logs: res.logs,
                        durationMs: res.durationMs,
                        error: res.error,
                      });
                    }}
                    title="Run preview simulation without guest container"
                    className="rounded bg-[#1a1e29] hover:bg-[#222838] px-2.5 py-1.5 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors"
                  >
                    Preview Simulation
                  </button>
                </div>

                {/* Live Sandbox Execution Output */}
                {sandboxExecResult && (
                  <div className="mt-2 rounded bg-[#07090e] border border-[#1e2330] p-2 space-y-1 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className={sandboxExecResult.success ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {sandboxExecResult.success ? '✓ Container Success' : '✗ Sandbox Fault'}
                      </span>
                      <span className="text-neutral-500">{sandboxExecResult.durationMs}ms</span>
                    </div>

                    {sandboxExecResult.error && (
                      <div className="text-rose-400">{sandboxExecResult.error}</div>
                    )}

                    {sandboxExecResult.logs?.length > 0 && (
                      <div className="text-neutral-400 max-h-16 overflow-y-auto space-y-0.5">
                        {sandboxExecResult.logs.map((log, idx) => (
                          <div key={idx}>{log}</div>
                        ))}
                      </div>
                    )}

                    {sandboxExecResult.result && (
                      <div className="text-indigo-300 max-h-20 overflow-y-auto">
                        Output: {JSON.stringify(sandboxExecResult.result)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-neutral-400 space-y-0.5 font-mono">
                <div>WASM Runtime Profile: {selectedPlugin.wasm?.wasmRuntime} (Mem Limit: {selectedPlugin.wasm?.memoryLimitMb}MB)</div>
                <div>Declared Scopes: {selectedPlugin.permissions.join(', ') || 'Strict Zero-Trust'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TAURI RUST IPC & SYSTEM DIAGNOSTICS */}
      {tab === 'ipc-diagnostics' && (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0c0e14] p-4 space-y-4">
          <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-4">
            <h3 className="font-semibold text-white text-xs mb-2">Native Rust Core Subsystem (Tauri 2.0)</h3>
            <div className="grid grid-cols-2 gap-3 text-neutral-300 font-mono text-[11px]">
              <div>Operating System: <span className="text-white">{systemDiag?.os || 'Linux / Windows'}</span></div>
              <div>Architecture: <span className="text-white">{systemDiag?.arch || 'x86_64'}</span></div>
              <div>Tauri Runtime: <span className="text-indigo-400">{systemDiag?.tauriVersion || '2.0.4'}</span></div>
              <div>Rust Compiler: <span className="text-orange-400">{systemDiag?.rustEngine || 'rustc 1.84.0'}</span></div>
            </div>
          </div>

          <div className="flex-1 flex flex-col rounded-xl border border-[#1e2330] bg-[#11141d] p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-xs">IPC Channel Transmissions</h3>
              <span className="text-[10px] text-neutral-500 font-mono">Real-time trace</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
              {ipcTelemetry.map((msg, i) => (
                <div key={i} className="p-2 rounded bg-[#0a0c10] border border-[#1a1e29] text-neutral-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-semibold">{msg.channel}</span>
                    <span className="text-neutral-500">&rarr;</span>
                    <span className="text-neutral-400">{msg.target}</span>
                  </div>
                  <span className="text-neutral-500 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
