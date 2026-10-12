/**
 * Leverage Studios - Documentation & Plugin Developer Portal
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { WasmSandboxRunner } from '@leverage/plugin-sdk';

export const DocsPortal: React.FC<{ onSwitchToStudio: () => void }> = ({ onSwitchToStudio }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'wasm-spec' | 'security' | 'dag-orchestrator' | 'playground'>('quickstart');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Playground state
  const [testRuntime, setTestRuntime] = useState<'extism' | 'wasmtime'>('extism');
  const [testMemoryMb, setTestMemoryMb] = useState<number>(32);
  const [testGasLimit, setTestGasLimit] = useState<number>(1000000);
  const [networkPerm, setNetworkPerm] = useState<boolean>(true);
  const [fsPerm, setFsPerm] = useState<boolean>(false);
  const [procPerm, setProcPerm] = useState<boolean>(false);
  const [testFunction, setTestFunction] = useState<string>('format_code');
  const [testPayload, setTestPayload] = useState<string>('{\n  "code": "const x:number=42;console.log(x);"\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const runPlaygroundSandbox = async () => {
    setIsRunning(true);
    setTestResult(null);

    const permissions: any[] = [];
    if (networkPerm) permissions.push('Network:HTTP');
    if (fsPerm) permissions.push('FileSystem:Write');
    if (procPerm) permissions.push('ProcessExecution:CLI');

    const runner = new WasmSandboxRunner(
      {
        memoryLimitMb: testMemoryMb,
        gasLimit: testGasLimit,
        allowedHosts: ['api.github.com'],
        wasmRuntime: testRuntime,
        entrypointExport: '_start',
      },
      permissions
    );

    try {
      const parsed = JSON.parse(testPayload);
      const res = await runner.execute(testFunction, parsed);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: `Payload parse error: ${err.message}`,
        logs: [`JSON error: ${err.message}`],
        gasConsumed: 0,
        memoryPeakBytes: 0,
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0c0e14] text-[#e1e4ea] overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#1e2330] px-6 py-4 bg-[#11141d]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Developer Documentation & Plugin Portal</h1>
            <p className="text-xs text-neutral-400">Leverage Studios Architecture, Extism/Wasmtime Sandbox Specs, and SDK Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToStudio}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            Launch Studio IDE <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-[#1e2330] bg-[#0e1118] p-4 flex flex-col gap-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Documentation
          </div>
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
              activeTab === 'quickstart' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-[#161a23] hover:text-white'
            }`}
          >
            <Code2 className="h-4 w-4" /> 01. Plugin Quickstart
          </button>
          <button
            onClick={() => setActiveTab('wasm-spec')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
              activeTab === 'wasm-spec' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-[#161a23] hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" /> 02. WASM Sandbox Engine
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
              activeTab === 'security' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-[#161a23] hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> 03. Zero-Trust Security Scopes
          </button>
          <button
            onClick={() => setActiveTab('dag-orchestrator')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
              activeTab === 'dag-orchestrator' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-[#161a23] hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" /> 04. Multi-Agent DAG Engine
          </button>

          <div className="mt-6 px-3 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Interactive Testbed
          </div>
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
              activeTab === 'playground' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:bg-[#161a23] hover:text-white'
            }`}
          >
            <Terminal className="h-4 w-4" /> Sandbox Live Simulator
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 max-w-5xl mx-auto overflow-y-auto">
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Guide</span>
                <h2 className="text-2xl font-bold text-white mt-1">Authoring Your First Leverage WASM Plugin</h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Leverage Studios runs plugins in isolated WebAssembly runtimes using Extism and Wasmtime.
                  Plugins can be compiled from Rust, C, Go, or AssemblyScript with sub-millisecond execution overhead.
                </p>
              </div>

              {/* Step 1 */}
              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">1. Create Rust Library (Cargo.toml)</h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `[package]\nname = "my-leverage-plugin"\nversion = "0.1.0"\nedition = "2021"\n\n[lib]\ncrate-type = ["cdylib"]\n\n[dependencies]\nextism-pdk = "1.0.0"\nserde = { version = "1.0", features = ["derive"] }\nserde_json = "1.0"`,
                        'step1'
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    {copiedSection === 'step1' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#0a0c10] text-xs font-mono text-neutral-300 overflow-x-auto border border-[#1a1e29]">
{`[package]
name = "my-leverage-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
extism-pdk = "1.0.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`}
                </pre>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">2. Implement Exported Plugin Function (src/lib.rs)</h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `use extism_pdk::*;\nuse serde::{Deserialize, Serialize};\n\n#[derive(Deserialize)]\nstruct InputPayload {\n    code: String,\n}\n\n#[derive(Serialize)]\nstruct OutputPayload {\n    formatted: String,\n    changed: bool,\n}\n\n#[plugin_fn]\npub fn format_code(Json(input): Json<InputPayload>) -> FnResult<Json<OutputPayload>> {\n    let trimmed = input.code.trim().to_string();\n    Ok(Json(OutputPayload {\n        formatted: trimmed,\n        changed: true,\n    }))\n}`,
                        'step2'
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    {copiedSection === 'step2' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#0a0c10] text-xs font-mono text-neutral-300 overflow-x-auto border border-[#1a1e29]">
{`use extism_pdk::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct InputPayload {
    code: String,
}

#[derive(Serialize)]
struct OutputPayload {
    formatted: String,
    changed: bool,
}

#[plugin_fn]
pub fn format_code(Json(input): Json<InputPayload>) -> FnResult<Json<OutputPayload>> {
    let trimmed = input.code.trim().to_string();
    Ok(Json(OutputPayload {
        formatted: trimmed,
        changed: true,
    }))
}`}
                </pre>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5">
                <h3 className="text-sm font-semibold text-white mb-2">3. Compile to WebAssembly Target</h3>
                <pre className="p-3 rounded-lg bg-[#0a0c10] text-xs font-mono text-indigo-300 overflow-x-auto border border-[#1a1e29]">
cargo build --target wasm32-wasip1 --release
                </pre>
                <p className="text-xs text-neutral-400 mt-2">
                  The compiled <code>.wasm</code> binary is copied to your plugin root and declared in <code>plugin.json</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'wasm-spec' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Architecture</span>
                <h2 className="text-2xl font-bold text-white mt-1">WASM Sandboxing & Isolation Architecture</h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Leverage Studios allows running over 1,000 plugins concurrently without thread starvations or memory corruption.
                  Extism and Wasmtime runtimes guarantee sub-millisecond cold starts with deterministic memory caps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#1e2330] bg-[#11141d]">
                  <div className="text-indigo-400 font-mono text-xl font-bold">16MB - 64MB</div>
                  <div className="text-xs font-medium text-white mt-1">Strict Memory Ceilings</div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Every plugin sandbox allocates linear memory bounded by static limits. Runaway allocations trigger an immediate trap.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#1e2330] bg-[#11141d]">
                  <div className="text-emerald-400 font-mono text-xl font-bold">&lt; 0.8ms</div>
                  <div className="text-xs font-medium text-white mt-1">Near-Zero Startup Latency</div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Pre-compiled WASM bytecode allows instant on-demand instantiation during agent typing or keystrokes.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#1e2330] bg-[#11141d]">
                  <div className="text-amber-400 font-mono text-xl font-bold">Gas Metered</div>
                  <div className="text-xs font-medium text-white mt-1">Execution Loop Protection</div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Gas counters decrease on every instruction block. Infinite loops are terminated safely without locking the UI thread.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Tauri Rust Host Binding Example</h3>
                <pre className="p-3 rounded-lg bg-[#0a0c10] text-xs font-mono text-neutral-300 overflow-x-auto border border-[#1a1e29]">
{`// src-tauri/src/wasm_engine.rs
pub fn execute_sandboxed(&self, payload: WasmExecutionPayload) -> WasmExecutionResponse {
    let mut manifest = Manifest::new([Wasm::file("plugin.wasm")]);
    manifest.set_memory_max(payload.memory_limit_mb * 1024 * 1024);
    
    let plugin = Plugin::new(&manifest, [], true).expect("WASM plugin compilation failed");
    let result = plugin.call(&payload.function_name, &payload.input_json);
    ...
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Security</span>
                <h2 className="text-2xl font-bold text-white mt-1">Zero-Trust Capability Permissions</h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Third-party plugins have zero default access to system resources. All IO, sockets, and subprocesses
                  require explicit manifest permissions audited during activation.
                </p>
              </div>

              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161a23] text-neutral-400 font-medium border-b border-[#1e2330]">
                    <tr>
                      <th className="p-3">Capability</th>
                      <th className="p-3">Risk Level</th>
                      <th className="p-3">Allowed Actions</th>
                      <th className="p-3">Restrictions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330] text-neutral-300">
                    <tr>
                      <td className="p-3 font-mono text-indigo-300">FileSystem:WorkspaceOnly</td>
                      <td className="p-3 text-emerald-400">Low</td>
                      <td className="p-3">Read/write inside project root directory</td>
                      <td className="p-3 text-neutral-400">Symlinks outside project are blocked</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-300">Network:HTTP</td>
                      <td className="p-3 text-amber-400">Medium</td>
                      <td className="p-3">Outbound REST/GraphQL queries to declared hosts</td>
                      <td className="p-3 text-neutral-400">Only allowed hosts in manifest can be pinged</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-300">ProcessExecution:CLI</td>
                      <td className="p-3 text-rose-400">High</td>
                      <td className="p-3">Spawn compilers, git, docker, and test runners</td>
                      <td className="p-3 text-neutral-400">Requires explicit user elevation confirmation</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-300">Clipboard:Read/Write</td>
                      <td className="p-3 text-amber-400">Medium</td>
                      <td className="p-3">Interact with system clipboard for snippets</td>
                      <td className="p-3 text-neutral-400">Only when window has user focus</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dag-orchestrator' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Orchestration</span>
                <h2 className="text-2xl font-bold text-white mt-1">Multi-Agent DAG Workflow Execution</h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Instead of single monolithic prompts, Leverage Studios constructs Directed Acyclic Graphs (DAGs)
                  where specialized agents (Architect, Coder, Reviewer, Security Auditor, Debugger) collaborate
                  with streaming diff handoffs.
                </p>
              </div>

              <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Workflow Declaration Format</h3>
                <pre className="p-3 rounded-lg bg-[#0a0c10] text-xs font-mono text-neutral-300 overflow-x-auto border border-[#1a1e29]">
{`const workflow: DAGWorkflow = {
  id: "wf_pr_review",
  name: "Autonomous PR Pipeline",
  nodes: [
    { id: "node_1", agentId: "agent_architect", title: "Analyze Intent", dependencies: [] },
    { id: "node_2", agentId: "agent_coder", title: "Synthesize Patch", dependencies: ["node_1"] },
    { id: "node_3", agentId: "agent_security", title: "WASM Audit", dependencies: ["node_2"] },
    { id: "node_4", agentId: "agent_reviewer", title: "Verify Types", dependencies: ["node_2"] },
    { id: "node_5", agentId: "agent_debugger", title: "Run Tests", dependencies: ["node_3", "node_4"] },
  ],
  edges: [
    { fromNodeId: "node_1", toNodeId: "node_2" },
    { fromNodeId: "node_2", toNodeId: "node_3" },
    { fromNodeId: "node_2", toNodeId: "node_4" },
    { fromNodeId: "node_3", toNodeId: "node_5" },
    { fromNodeId: "node_4", toNodeId: "node_5" },
  ]
};`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Testbed</span>
                <h2 className="text-2xl font-bold text-white mt-1">Interactive WASM Sandbox Simulator</h2>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Test plugin execution bounds, verify permission gating, and observe real-time gas metering
                  and memory allocation in the live simulator.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration form */}
                <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Sandbox Parameters</h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-neutral-400 block mb-1">WASM Engine</label>
                      <select
                        value={testRuntime}
                        onChange={(e) => setTestRuntime(e.target.value as any)}
                        className="w-full rounded-lg bg-[#0e1118] border border-[#1e2330] px-3 py-2 text-white"
                      >
                        <option value="extism">Extism 1.4</option>
                        <option value="wasmtime">Wasmtime 24.0</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Function Entrypoint</label>
                      <select
                        value={testFunction}
                        onChange={(e) => setTestFunction(e.target.value)}
                        className="w-full rounded-lg bg-[#0e1118] border border-[#1e2330] px-3 py-2 text-white"
                      >
                        <option value="format_code">format_code</option>
                        <option value="lint_ast">lint_ast</option>
                        <option value="query_llm">query_llm</option>
                        <option value="fetch_remote_spec">fetch_remote_spec (Network Guard)</option>
                        <option value="write_disk_cache">write_disk_cache (Disk Guard)</option>
                        <option value="exec_host_sh">exec_host_sh (Process Guard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-neutral-400 block mb-1">Memory Cap: {testMemoryMb}MB</label>
                      <input
                        type="range"
                        min="16"
                        max="128"
                        step="16"
                        value={testMemoryMb}
                        onChange={(e) => setTestMemoryMb(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Gas Limit: {testGasLimit.toLocaleString()}</label>
                      <input
                        type="range"
                        min="200000"
                        max="2000000"
                        step="100000"
                        value={testGasLimit}
                        onChange={(e) => setTestGasLimit(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Granted Security Capabilities</label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <label className="flex items-center gap-1.5 bg-[#0e1118] px-2.5 py-1 rounded border border-[#1e2330] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={networkPerm}
                          onChange={(e) => setNetworkPerm(e.target.checked)}
                          className="rounded border-[#1e2330] text-indigo-600 focus:ring-0"
                        />
                        <span className="text-neutral-300">Network:HTTP</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-[#0e1118] px-2.5 py-1 rounded border border-[#1e2330] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fsPerm}
                          onChange={(e) => setFsPerm(e.target.checked)}
                          className="rounded border-[#1e2330] text-indigo-600 focus:ring-0"
                        />
                        <span className="text-neutral-300">FileSystem:Write</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-[#0e1118] px-2.5 py-1 rounded border border-[#1e2330] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={procPerm}
                          onChange={(e) => setProcPerm(e.target.checked)}
                          className="rounded border-[#1e2330] text-indigo-600 focus:ring-0"
                        />
                        <span className="text-neutral-300">ProcessExecution:CLI</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Input JSON Payload</label>
                    <textarea
                      rows={4}
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="w-full rounded-lg bg-[#0e1118] border border-[#1e2330] p-2.5 text-xs font-mono text-neutral-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={runPlaygroundSandbox}
                    disabled={isRunning}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {isRunning ? 'Executing WASM Sandbox...' : 'Run Sandboxed WASM Execution'}
                  </button>
                </div>

                {/* Execution Telemetry Result */}
                <div className="rounded-xl border border-[#1e2330] bg-[#11141d] p-5 flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-3">Runtime Sandbox Telemetry</h3>

                  {testResult ? (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-[#0e1118] border border-[#1e2330]">
                          <div className="text-neutral-400 text-[10px]">Status</div>
                          <div className={`font-semibold mt-0.5 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {testResult.success ? 'Success' : 'Security Trap'}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0e1118] border border-[#1e2330]">
                          <div className="text-neutral-400 text-[10px]">Gas Meter</div>
                          <div className="font-mono text-amber-400 font-semibold mt-0.5">
                            {testResult.gasConsumed?.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-[#0e1118] border border-[#1e2330]">
                          <div className="text-neutral-400 text-[10px]">Duration</div>
                          <div className="font-mono text-indigo-400 font-semibold mt-0.5">
                            {testResult.durationMs}ms
                          </div>
                        </div>
                      </div>

                      {testResult.error && (
                        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                          <div>
                            <div className="font-semibold">Execution Blocked</div>
                            <div className="mt-0.5">{testResult.error}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 flex flex-col">
                        <label className="text-[11px] text-neutral-400 font-medium mb-1">Sandbox Execution Logs</label>
                        <div className="flex-1 p-3 rounded-lg bg-[#0a0c10] border border-[#1a1e29] font-mono text-[11px] text-neutral-300 overflow-y-auto space-y-1">
                          {testResult.logs?.map((log: string, idx: number) => (
                            <div key={idx}>{log}</div>
                          ))}
                        </div>
                      </div>

                      {testResult.output && (
                        <div>
                          <label className="text-[11px] text-neutral-400 font-medium mb-1">Serialized Output</label>
                          <pre className="p-2 rounded-lg bg-[#0a0c10] border border-[#1a1e29] font-mono text-[11px] text-emerald-400 overflow-x-auto">
                            {JSON.stringify(testResult.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                      <Cpu className="h-10 w-10 text-neutral-600 mb-2" />
                      <p className="text-xs">Configure sandbox parameters and click "Run Sandboxed WASM Execution" to inspect memory and gas telemetry.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
