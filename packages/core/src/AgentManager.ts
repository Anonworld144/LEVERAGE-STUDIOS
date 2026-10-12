/**
 * Leverage Studios - AgentManager
 * Multi-Agent Orchestration Engine: manages agent registry, lifecycle events,
 * and executes visual DAG (Directed Acyclic Graph) agent workflows.
 */

import { BaseAgent } from './BaseAgent.ts';
import { AgentConfig, DAGWorkflow, DAGNode, DAGEdge, StreamingDiff } from './types.ts';

export class AgentManager {
  private static instance: AgentManager;
  private agents: Map<string, BaseAgent> = new Map();
  private workflows: Map<string, DAGWorkflow> = new Map();
  private activeWorkflowId: string | null = null;
  private globalDiffHistory: StreamingDiff[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.seedDefaultAgents();
    this.seedDefaultWorkflows();
  }

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  public registerAgent(config: AgentConfig): BaseAgent {
    const agent = new BaseAgent(config);
    this.agents.set(config.id, agent);
    this.notify();
    return agent;
  }

  public getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  public listAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  public getWorkflows(): DAGWorkflow[] {
    return Array.from(this.workflows.values());
  }

  public getWorkflow(id: string): DAGWorkflow | undefined {
    return this.workflows.get(id);
  }

  public setWorkflow(workflow: DAGWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Execute a DAG workflow sequentially and concurrently based on topological ordering
   */
  public async executeWorkflow(
    workflowId: string,
    context: { workspaceRoot: string; activeFilePath?: string; fileContent?: string }
  ): Promise<void> {
    const wf = this.workflows.get(workflowId);
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);

    wf.status = 'running';
    wf.startedAt = Date.now();
    this.activeWorkflowId = workflowId;
    this.notify();

    // Reset node statuses
    wf.nodes.forEach((n) => {
      n.status = 'pending';
      n.progress = 0;
      n.errorMessage = undefined;
    });

    const completedNodeIds = new Set<string>();

    try {
      while (completedNodeIds.size < wf.nodes.length) {
        // Find nodes ready to run (all dependencies completed)
        const readyNodes = wf.nodes.filter(
          (n) => n.status === 'pending' && n.dependencies.every((dep) => completedNodeIds.has(dep))
        );

        if (readyNodes.length === 0) {
          // If nodes remain pending but none are ready, cycle or deadlock
          const pendingRemaining = wf.nodes.filter((n) => n.status === 'pending');
          if (pendingRemaining.length > 0) {
            throw new Error('Cyclic dependency or unresolvable edge in agent DAG workflow');
          }
          break;
        }

        // Execute ready nodes concurrently
        await Promise.all(
          readyNodes.map(async (node) => {
            node.status = 'running';
            node.progress = 25;
            this.notify();

            const agent = this.agents.get(node.agentId);
            if (!agent) {
              node.status = 'failed';
              node.errorMessage = `Agent ${node.agentId} not registered`;
              this.notify();
              return;
            }

            try {
              node.progress = 50;
              this.notify();

              const res = await agent.executeTask(node.title, context);
              if (res.success) {
                node.status = 'completed';
                node.progress = 100;
                completedNodeIds.add(node.id);
                if (res.diffs.length > 0) {
                  this.globalDiffHistory.push(...res.diffs);
                }
              } else {
                node.status = 'failed';
                node.errorMessage = res.result;
              }
            } catch (err: any) {
              node.status = 'failed';
              node.errorMessage = err.message;
            }
            this.notify();
          })
        );
      }

      const allSuccess = wf.nodes.every((n) => n.status === 'completed');
      wf.status = allSuccess ? 'completed' : 'failed';
      wf.completedAt = Date.now();
    } catch (err: any) {
      wf.status = 'failed';
    } finally {
      this.notify();
    }
  }

  public getDiffHistory(): StreamingDiff[] {
    return [...this.globalDiffHistory];
  }

  private seedDefaultAgents(): void {
    const agentsData: AgentConfig[] = [
      {
        id: 'agent_architect',
        name: 'Athena Architect',
        role: 'architect',
        description: 'System design, interface abstraction, and monorepo modularization strategist',
        systemPrompt: 'You are an elite Principal Architect. Analyze requirements, design clear interfaces, and break down tasks.',
        model: { provider: 'anthropic', modelId: 'claude-3-7-sonnet', streaming: true },
        allowedTools: ['fs_read_file', 'ast_find_symbols', 'git_status'],
      },
      {
        id: 'agent_coder',
        name: 'Vulcan Coder',
        role: 'coder',
        description: 'High-speed autonomous implementation agent specialized in TypeScript, Rust, and Python',
        systemPrompt: 'You write pristine, strongly-typed code adhering to strict production standards.',
        model: { provider: 'anthropic', modelId: 'claude-3-5-sonnet', streaming: true },
        allowedTools: ['fs_read_file', 'ast_find_symbols', 'exec_command'],
      },
      {
        id: 'agent_reviewer',
        name: 'Argus Reviewer',
        role: 'reviewer',
        description: 'Deep code quality, performance profiling, and invariant checker',
        systemPrompt: 'You inspect proposed diffs for security vulnerabilities, logic leaks, and edge cases.',
        model: { provider: 'openai', modelId: 'gpt-4o', streaming: true },
        allowedTools: ['fs_read_file', 'ast_find_symbols'],
      },
      {
        id: 'agent_debugger',
        name: 'Hephaestus Debugger',
        role: 'debugger',
        description: 'Automated test execution, runtime stacktrace analysis, and self-healing patch solver',
        systemPrompt: 'You isolate failing tests, inspect trace logs, and craft surgical fixes.',
        model: { provider: 'gemini', modelId: 'gemini-2.5-pro', streaming: true },
        allowedTools: ['fs_read_file', 'exec_command', 'git_status'],
      },
      {
        id: 'agent_security',
        name: 'Aegis Security Auditor',
        role: 'security-auditor',
        description: 'Zero-trust sandbox validator, WASM gas meter, and memory bounds auditor',
        systemPrompt: 'You enforce zero-trust security boundaries, verifying WASM capabilities and sanitizing inputs.',
        model: { provider: 'local-wasm', modelId: 'llama-3.2-3b-wasm', streaming: true },
        allowedTools: ['fs_read_file'],
      },
    ];

    agentsData.forEach((cfg) => this.registerAgent(cfg));
  }

  private seedDefaultWorkflows(): void {
    const defaultWf: DAGWorkflow = {
      id: 'wf_feature_pipeline',
      name: 'Full Feature Synthesis & Verification',
      description: 'End-to-end multi-agent orchestration: Architecture planning -> Code generation -> Invariant review -> Security audit',
      status: 'idle',
      nodes: [
        {
          id: 'node_1',
          agentId: 'agent_architect',
          title: 'Plan Interface Architecture',
          role: 'architect',
          status: 'pending',
          inputs: ['User Feature Prompt'],
          outputs: ['AST Signature Spec'],
          dependencies: [],
          progress: 0,
        },
        {
          id: 'node_2',
          agentId: 'agent_coder',
          title: 'Implement Core Components',
          role: 'coder',
          status: 'pending',
          inputs: ['AST Signature Spec'],
          outputs: ['Unified Code Diff'],
          dependencies: ['node_1'],
          progress: 0,
        },
        {
          id: 'node_3',
          agentId: 'agent_reviewer',
          title: 'Review Type Invariants',
          role: 'reviewer',
          status: 'pending',
          inputs: ['Unified Code Diff'],
          outputs: ['Quality Seal'],
          dependencies: ['node_2'],
          progress: 0,
        },
        {
          id: 'node_4',
          agentId: 'agent_security',
          title: 'WASM Sandbox Security Audit',
          role: 'security-auditor',
          status: 'pending',
          inputs: ['Unified Code Diff'],
          outputs: ['Security Clearance'],
          dependencies: ['node_2'],
          progress: 0,
        },
        {
          id: 'node_5',
          agentId: 'agent_debugger',
          title: 'Automated Test & Verification',
          role: 'debugger',
          status: 'pending',
          inputs: ['Quality Seal', 'Security Clearance'],
          outputs: ['Deployment Artifact'],
          dependencies: ['node_3', 'node_4'],
          progress: 0,
        },
      ],
      edges: [
        { id: 'edge_1_2', fromNodeId: 'node_1', toNodeId: 'node_2' },
        { id: 'edge_2_3', fromNodeId: 'node_2', toNodeId: 'node_3' },
        { id: 'edge_2_4', fromNodeId: 'node_2', toNodeId: 'node_4' },
        { id: 'edge_3_5', fromNodeId: 'node_3', toNodeId: 'node_5' },
        { id: 'edge_4_5', fromNodeId: 'node_4', toNodeId: 'node_5' },
      ],
    };

    this.setWorkflow(defaultWf);
  }
}
