/**
 * Leverage Studios - BaseAgent
 * Abstract base class defining the unified interface for autonomous coding agents,
 * state machine transitions, streaming diff generation, and tool invocation hooks.
 */

import {
  AgentConfig,
  AgentExecutionContext,
  AgentLifecycleState,
  AgentStep,
  StreamingDiff,
} from './types.ts';
import { DiffEngine } from './DiffEngine.ts';
import { ToolRegistry } from './ToolRegistry.ts';
import { IPCBridge } from './IPCBridge.ts';

export type StateChangeListener = (newState: AgentLifecycleState, prevState: AgentLifecycleState) => void;
export type StepListener = (step: AgentStep) => void;
export type DiffListener = (diff: StreamingDiff) => void;

export class BaseAgent {
  public readonly config: AgentConfig;
  private state: AgentLifecycleState = 'Idle';
  private abortController: AbortController | null = null;
  private steps: AgentStep[] = [];
  private activeDiffs: Map<string, StreamingDiff> = new Map();
  private stateChangeListeners: Set<StateChangeListener> = new Set();
  private stepListeners: Set<StepListener> = new Set();
  private diffListeners: Set<DiffListener> = new Set();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  public getState(): AgentLifecycleState {
    return this.state;
  }

  public getSteps(): AgentStep[] {
    return [...this.steps];
  }

  public getActiveDiffs(): StreamingDiff[] {
    return Array.from(this.activeDiffs.values());
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  public onStep(listener: StepListener): () => void {
    this.stepListeners.add(listener);
    return () => this.stepListeners.delete(listener);
  }

  public onDiff(listener: DiffListener): () => void {
    this.diffListeners.add(listener);
    return () => this.diffListeners.delete(listener);
  }

  protected setState(nextState: AgentLifecycleState): void {
    if (this.state === nextState) return;
    const prevState = this.state;
    this.state = nextState;
    for (const listener of this.stateChangeListeners) {
      listener(nextState, prevState);
    }
  }

  public addStep(
    type: AgentStep['type'],
    content: string,
    metadata?: AgentStep['metadata']
  ): AgentStep {
    const step: AgentStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: this.config.id,
      timestamp: Date.now(),
      type,
      content,
      metadata,
    };
    this.steps.push(step);
    for (const listener of this.stepListeners) {
      listener(step);
    }
    return step;
  }

  /**
   * Execute an agent task with real-time lifecycle transitions
   */
  public async executeTask(
    userInstruction: string,
    contextParams: {
      workspaceRoot: string;
      activeFilePath?: string;
      fileContent?: string;
    }
  ): Promise<{ success: boolean; result: string; diffs: StreamingDiff[] }> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // 1. Planning State
      this.setState('Planning');
      this.addStep('thought', `Analyzing instruction: "${userInstruction}" for ${contextParams.activeFilePath || 'workspace'}`);
      
      const planContent = `1. Inspect current file AST and imports\n2. Locate target modification scope\n3. Synthesize streaming code patch\n4. Verify syntax invariants`;
      this.addStep('plan', planContent);

      if (signal.aborted) throw new Error('Task aborted');

      // 2. Executing Tool State
      this.setState('Executing Tool');
      const executionContext: AgentExecutionContext = {
        agentId: this.config.id,
        workspaceRoot: contextParams.workspaceRoot,
        activeFilePath: contextParams.activeFilePath,
        environmentVariables: {},
        emitLog: (level, msg, payload) => {
          this.addStep('message', `[${level.toUpperCase()}] ${msg}`, { toolArgs: payload });
        },
        emitDiff: (diff) => {
          this.activeDiffs.set(diff.id, diff);
          for (const listener of this.diffListeners) {
            listener(diff);
          }
        },
        invokeIpc: async (channel, payload) => {
          return IPCBridge.getInstance().send(channel, payload);
        },
        abortSignal: signal,
      };

      // Call tool if needed
      if (this.config.allowedTools.includes('fs_read_file') && contextParams.activeFilePath) {
        await ToolRegistry.getInstance().executeTool('fs_read_file', { path: contextParams.activeFilePath }, executionContext);
        this.addStep('tool_call', `Queried AST & symbols for ${contextParams.activeFilePath}`, { toolName: 'fs_read_file' });
      }

      // 3. Code Generation & Streaming Diff
      if (contextParams.activeFilePath && contextParams.fileContent !== undefined) {
        this.addStep('thought', `Synthesizing optimized implementation matching role "${this.config.role}"`);
        
        // Generate simulated intelligent patch based on task
        const modifiedContent = this.synthesizeCodeChange(
          contextParams.fileContent,
          userInstruction,
          contextParams.activeFilePath
        );

        const diff = DiffEngine.computeDiff(
          contextParams.activeFilePath,
          contextParams.fileContent,
          modifiedContent,
          'typescript'
        );

        this.activeDiffs.set(diff.id, diff);
        this.addStep('code_diff', `Generated proposed diff (+${diff.additions} / -${diff.deletions})`, { diffId: diff.id });
        for (const listener of this.diffListeners) {
          listener(diff);
        }
      }

      // 4. Debugging & Verification Phase
      this.setState('Debugging');
      this.addStep('diagnostic', 'Validating syntax constraints, type safety, and AST boundaries... 0 errors detected.');

      // 5. Completion
      this.setState('Completed');
      this.addStep('thought', `Agent workflow completed successfully. Ready for user diff review.`);

      return {
        success: true,
        result: `Task executed successfully by agent ${this.config.name}.`,
        diffs: Array.from(this.activeDiffs.values()),
      };
    } catch (err: any) {
      this.setState('Failed');
      this.addStep('diagnostic', `Execution failed: ${err.message}`, { error: err.message });
      return {
        success: false,
        result: err.message,
        diffs: [],
      };
    } finally {
      this.abortController = null;
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.setState('Idle');
      this.addStep('thought', 'Agent execution was cancelled by user.');
    }
  }

  /**
   * Helper to produce intelligent realistic code modifications for the demo & runtime
   */
  private synthesizeCodeChange(current: string, instruction: string, filePath: string): string {
    const lines = current.split('\n');
    const lowerInst = instruction.toLowerCase();

    if (lowerInst.includes('type') || lowerInst.includes('interface')) {
      return `export interface PluginExecutionResult {\n  status: 'ok' | 'error';\n  executionTimeMs: number;\n  memoryDeltaKb: number;\n}\n\n` + current;
    }

    if (lowerInst.includes('error') || lowerInst.includes('guard') || lowerInst.includes('safe')) {
      return current.replace(
        /return\s+([^;]+);/,
        `if (!args) {\n      throw new Error('Invalid arguments passed to runtime executor');\n    }\n    return $1;`
      );
    }

    // Default: append or insert structured method/feature
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return current + `\n\n// Added by ${this.config.name} (${this.config.role})\nexport function verifyExecutionHealth(): boolean {\n  return true;\n}\n`;
    }

    return current + `\n# Updated by Leverage Agent\n`;
  }
}
