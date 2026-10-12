/**
 * Leverage Studios - High-Scale Plugin Catalog Generator
 * Generates an index of 1,000+ realistic, categorized plugins with WASM sandbox profiles
 * for high-concurrency search and execution.
 */

import { PluginManifest, PluginCategory, SecurityPermission } from './types.ts';

const CATEGORIES: PluginCategory[] = ['agent-tool', 'editor-extension', 'ui-panel', 'llm-provider'];

const AUTHORS = [
  { name: 'Leverage Core Team', verified: true },
  { name: 'Wasmtime Labs', verified: true },
  { name: 'Rust Embedded SIG', verified: true },
  { name: 'ByteDance Dev Infra', verified: true },
  { name: 'OpenCode Alliance', verified: false },
  { name: 'Cloudflare Workers Tooling', verified: true },
  { name: 'Extism Community', verified: true },
  { name: 'Vite Plugin Consortium', verified: false },
  { name: 'Anthropic Ecosystem', verified: true },
  { name: 'Google Cloud Tools', verified: true },
];

const SEED_TEMPLATES = [
  // agent-tool
  { prefix: 'AST Refactorer', cat: 'agent-tool' as PluginCategory, perms: ['FileSystem:WorkspaceOnly', 'FileSystem:Read', 'FileSystem:Write'] as SecurityPermission[], desc: 'Automated AST symbol rewrite and codemod runner' },
  { prefix: 'Docker Container Agent', cat: 'agent-tool' as PluginCategory, perms: ['ProcessExecution:CLI', 'Network:HTTP'] as SecurityPermission[], desc: 'Inspects and provisions development containers directly from agent prompts' },
  { prefix: 'PostgreSQL Schema Sync', cat: 'agent-tool' as PluginCategory, perms: ['Network:HTTP', 'FileSystem:WorkspaceOnly'] as SecurityPermission[], desc: 'Agent-driven database migration generation and schema diff inspector' },
  { prefix: 'Git Interactive Rebaser', cat: 'agent-tool' as PluginCategory, perms: ['ProcessExecution:CLI', 'FileSystem:WorkspaceOnly'] as SecurityPermission[], desc: 'Agent assistant for conflict resolution and semantic commit squashing' },
  { prefix: 'WASM Benchmark Profiler', cat: 'agent-tool' as PluginCategory, perms: ['ProcessExecution:Restricted'] as SecurityPermission[], desc: 'High-precision micro-benchmarking engine with nanosecond telemetry' },
  { prefix: 'Kubernetes Manifest Auditor', cat: 'agent-tool' as PluginCategory, perms: ['Network:HTTP', 'FileSystem:WorkspaceOnly'] as SecurityPermission[], desc: 'Validates Helm charts and K8s specs for security vulnerabilities' },
  { prefix: 'Python Virtualenv Manager', cat: 'agent-tool' as PluginCategory, perms: ['ProcessExecution:CLI', 'Environment:Read'] as SecurityPermission[], desc: 'Agent isolation runtime for Poetry, Conda, and uv environments' },
  { prefix: 'GraphQL Type Synthesizer', cat: 'agent-tool' as PluginCategory, perms: ['FileSystem:WorkspaceOnly', 'Network:HTTP'] as SecurityPermission[], desc: 'Auto-generates TypeScript queries and resolvers from schema ASTs' },

  // editor-extension
  { prefix: 'Monaco Ghost Text Autocomplete', cat: 'editor-extension' as PluginCategory, perms: ['FileSystem:Read'] as SecurityPermission[], desc: 'Zero-latency multi-line code ghost completions streaming at 120 FPS' },
  { prefix: 'Rainbow Bracket Matcher', cat: 'editor-extension' as PluginCategory, perms: [] as SecurityPermission[], desc: 'Colorizes matching delimiters and block indent scopes with high performance' },
  { prefix: 'Rust Cargo Check Diagnostics', cat: 'editor-extension' as PluginCategory, perms: ['ProcessExecution:Restricted', 'FileSystem:Read'] as SecurityPermission[], desc: 'Inline compiler error squiggles from rustc and cargo clippy' },
  { prefix: 'Tailwind CSS IntelliSense Lens', cat: 'editor-extension' as PluginCategory, perms: ['FileSystem:WorkspaceOnly'] as SecurityPermission[], desc: 'Color preview swatches and utility class sorting directly inside Monaco' },
  { prefix: 'Hex Color & CSS Inspector', cat: 'editor-extension' as PluginCategory, perms: [] as SecurityPermission[], desc: 'Inline color pickers with automatic design token substitution' },
  { prefix: 'Vim Keybindings Engine', cat: 'editor-extension' as PluginCategory, perms: ['Clipboard:Read', 'Clipboard:Write'] as SecurityPermission[], desc: 'Modal editing, macros, registers, and operator combinations' },

  // ui-panel
  { prefix: 'Agent DAG Workflow Visualizer', cat: 'ui-panel' as PluginCategory, perms: [] as SecurityPermission[], desc: 'Live topological node graph showing real-time agent multi-pass orchestration' },
  { prefix: 'Extism WASM Memory Profiler', cat: 'ui-panel' as PluginCategory, perms: [] as SecurityPermission[], desc: 'Real-time telemetry showing heap allocations, gas usage, and sandbox status' },
  { prefix: 'Terminal Multi-Split Multiplexer', cat: 'ui-panel' as PluginCategory, perms: ['ProcessExecution:CLI'] as SecurityPermission[], desc: 'High-speed GPU-accelerated terminal multiplexer supporting zsh, bash, and powershell' },
  { prefix: 'Database Query Workbench', cat: 'ui-panel' as PluginCategory, perms: ['Network:HTTP'] as SecurityPermission[], desc: 'Interactive table viewer with SQL execution and live latency graphs' },
  { prefix: 'API REST & WebSocket Tester', cat: 'ui-panel' as PluginCategory, perms: ['Network:HTTP', 'Network:WebSocket'] as SecurityPermission[], desc: 'Postman-grade API client embedded as an IDE panel with agent mocking' },

  // llm-provider
  { prefix: 'Claude 3.7 Sonnet Connector', cat: 'llm-provider' as PluginCategory, perms: ['Network:HTTP'] as SecurityPermission[], desc: 'Anthropic native client supporting extended thinking and streaming diffs' },
  { prefix: 'Gemini 2.5 Pro Multimodal', cat: 'llm-provider' as PluginCategory, perms: ['Network:HTTP'] as SecurityPermission[], desc: 'High context-window provider supporting audio, video, and multi-file codebases' },
  { prefix: 'Ollama Local Daemon Bridge', cat: 'llm-provider' as PluginCategory, perms: ['Network:HTTP'] as SecurityPermission[], desc: 'Connects to localhost:11434 with zero cloud egress for 100% private coding' },
  { prefix: 'WASM WebLLM In-Memory Runner', cat: 'llm-provider' as PluginCategory, perms: ['FileSystem:WorkspaceOnly'] as SecurityPermission[], desc: 'Runs quantized Llama 3 and Qwen models purely inside WebAssembly' },
  { prefix: 'DeepSeek Coder V2 Adapter', cat: 'llm-provider' as PluginCategory, perms: ['Network:HTTP'] as SecurityPermission[], desc: 'Cost-efficient specialized coding model adapter with FIM completion' },
];

const VARIANTS = [
  'Pro', 'Ultra', 'Fast', 'Enterprise', 'Cloud', 'Mini', 'Edge', 'Zero',
  'Vector', 'Turbo', 'Distributed', 'Autonomous', 'Smart', 'Express', 'Hyper', 'Compact'
];

export function generatePluginCatalog(count: number = 1024): PluginManifest[] {
  const plugins: PluginManifest[] = [];

  for (let i = 0; i < count; i++) {
    const template = SEED_TEMPLATES[i % SEED_TEMPLATES.length];
    const variant = VARIANTS[Math.floor(i / SEED_TEMPLATES.length) % VARIANTS.length];
    const author = AUTHORS[i % AUTHORS.length];
    const indexSuffix = i >= SEED_TEMPLATES.length ? ` (${variant} #${Math.floor(i / SEED_TEMPLATES.length)})` : '';
    
    const id = `plugin_${template.cat}_${i.toString().padStart(4, '0')}`;
    const name = `${template.prefix} ${indexSuffix}`.trim();
    const version = `${1 + Math.floor(i / 200)}.${Math.floor((i % 50) / 5)}.${i % 9}`;
    
    // Ratings and downloads
    const downloadsCount = 1200 + ((i * 347) % 89000);
    const rating = Math.round((4.0 + ((i * 7) % 10) * 0.1) * 10) / 10;

    const memoryMb = 16 * ((i % 4) + 1); // 16MB, 32MB, 48MB, 64MB
    const gasLimit = 500_000 + (i % 5) * 200_000;

    plugins.push({
      id,
      name,
      version,
      description: template.desc,
      category: template.cat,
      author,
      tags: [template.cat, variant.toLowerCase(), 'wasm', i % 2 === 0 ? 'verified' : 'community'],
      permissions: [...template.perms],
      wasm: {
        memoryLimitMb: memoryMb,
        gasLimit: gasLimit,
        allowedHosts: template.perms.includes('Network:HTTP') ? ['api.github.com', 'registry.npmjs.org'] : [],
        wasmRuntime: i % 3 === 0 ? 'extism' : 'wasmtime',
        entrypointExport: '_start',
      },
      minStudioVersion: '2.0.0',
      status: i < 5 ? 'active' : 'inactive',
      downloadsCount,
      rating,
      installedAt: i < 5 ? Date.now() - (i * 86400000) : undefined,
    });
  }

  return plugins;
}
