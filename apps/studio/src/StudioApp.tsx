import React, { useState } from 'react';
import { StudioTitlebar } from './components/StudioTitlebar.tsx';
import { FileExplorer } from './components/FileExplorer.tsx';
import { MonacoEditorWrapper } from './components/MonacoEditorWrapper.tsx';
import { AgentControlPanel } from './components/AgentControlPanel.tsx';
import { WorkspaceFile, RightPanelTab } from './types.ts';
import { StreamingDiff, AgentManager, DiffEngine, SettingsStore } from '@leverage/core';
import { DocsPortal } from '@docs/DocsPortal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'f_base_agent',
    name: 'BaseAgent.ts',
    path: 'packages/core/src/BaseAgent.ts',
    language: 'typescript',
    content: `/**
 * Leverage Studios - BaseAgent Class
 * Autonomous agent state machine & streaming diff emitter
 */

import { AgentConfig, AgentLifecycleState, StreamingDiff } from './types.ts';

export class BaseAgent {
  public readonly config: AgentConfig;
  private state: AgentLifecycleState = 'Idle';

  constructor(config: AgentConfig) {
    this.config = config;
  }

  public getState(): AgentLifecycleState {
    return this.state;
  }

  public async executeTask(prompt: string): Promise<StreamingDiff | null> {
    this.state = 'Planning';
    // Analyze intent and compute AST transformation
    this.state = 'Executing Tool';
    return null;
  }
}
`,
  },
  {
    id: 'f_wasm_sandbox',
    name: 'WasmSandbox.ts',
    path: 'packages/plugin-sdk/src/WasmSandbox.ts',
    language: 'typescript',
    content: `/**
 * Leverage Studios - WASM Sandbox Engine (Extism/Wasmtime)
 * Memory-isolated, gas-metered execution for 1,000+ plugins
 */

export class WasmSandboxRunner {
  private memoryLimitMb: number = 32;
  private gasLimit: number = 1000000;

  public async execute(functionName: string, payload: any): Promise<any> {
    // Isolated WebAssembly host boundary
    return { status: 'success', fn: functionName };
  }
}
`,
  },
  {
    id: 'f_rust_main',
    name: 'main.rs',
    path: 'src-tauri/src/main.rs',
    language: 'rust',
    content: `// Leverage Studios - Tauri 2.0 Rust Desktop Shell
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    println!("Leverage Studios Native Engine Starting...");
    leverage_studios_lib::run();
}
`,
  },
  {
    id: 'f_ci_workflow',
    name: 'build-release.yml',
    path: '.github/workflows/build-release.yml',
    language: 'yaml',
    content: `name: Leverage Studios Desktop Release CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-tauri:
    strategy:
      matrix:
        include:
          - platform: 'windows-latest'
            target: 'x86_64-pc-windows-msvc'
          - platform: 'ubuntu-22.04'
            target: 'x86_64-unknown-linux-gnu'
`,
  },
  {
    id: 'f_pnpm_workspace',
    name: 'pnpm-workspace.yaml',
    path: 'pnpm-workspace.yaml',
    language: 'yaml',
    content: `packages:
  - 'apps/*'
  - 'packages/*'
`,
  },
];

export const StudioApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'studio' | 'docs'>('studio');
  const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_WORKSPACE_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(INITIAL_WORKSPACE_FILES[0].id);
  const [pendingDiff, setPendingDiff] = useState<StreamingDiff | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('dag');
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(() => {
    const store = SettingsStore.getInstance();
    return store.hasKey('gemini') || store.hasKey('openai') || store.hasKey('anthropic');
  });

  React.useEffect(() => {
    const unsub = SettingsStore.getInstance().subscribe(() => {
      const store = SettingsStore.getInstance();
      setHasConfiguredKey(store.hasKey('gemini') || store.hasKey('openai') || store.hasKey('anthropic'));
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  const handleSelectFile = (file: WorkspaceFile) => {
    setActiveFileId(file.id);
  };

  const handleCreateFile = (name: string) => {
    const newFile: WorkspaceFile = {
      id: `file_${Date.now()}`,
      name,
      path: `src/${name}`,
      language: name.endsWith('.rs') ? 'rust' : name.endsWith('.py') ? 'python' : name.endsWith('.json') ? 'json' : 'typescript',
      content: `// New file: ${name}\n`,
      isModified: true,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId) {
        setActiveFileId(remaining[0]?.id ?? '');
      }
      return remaining;
    });
  };

  const handleChangeContent = (newContent: string) => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: newContent, isModified: true } : f))
    );
  };

  const handleAcceptDiff = (diff: StreamingDiff) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === diff.filePath) {
          return {
            ...f,
            content: diff.modifiedContent,
            isModified: true,
            hasAgentDiff: false,
          };
        }
        return f;
      })
    );
    setPendingDiff(null);
  };

  const handleRejectDiff = (diff: StreamingDiff) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile?.id ? { ...f, hasAgentDiff: false } : f))
    );
    setPendingDiff(null);
  };

  const handleTriggerAgentAction = async (actionType: string) => {
    if (!activeFile) return;

    setIsAgentRunning(true);
    setRightPanelTab('console');

    try {
      const agentManager = AgentManager.getInstance();
      const coder = agentManager.getAgent('agent_coder');

      if (coder) {
        const prompt =
          actionType === 'optimize'
            ? 'Optimize AST execution loops and memoize expensive sub-routines'
            : actionType === 'audit'
              ? 'Audit zero-trust sandbox boundaries and enforce type invariant checks'
              : 'Refactor code for high-throughput concurrency';

        const res = await coder.executeTask(prompt, {
          workspaceRoot: '/workspace',
          activeFilePath: activeFile.path,
          fileContent: activeFile.content,
        });

        if (res && Array.isArray(res.diffs) && res.diffs.length > 0) {
          const diff = res.diffs[0];
          setPendingDiff(diff);
          setFiles((prev) =>
            prev.map((f) => (f.id === activeFile.id ? { ...f, hasAgentDiff: true } : f))
          );
        }
      }
    } finally {
      setIsAgentRunning(false);
    }
  };

  if (!activeFile) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0c0e14] text-[#e1e4ea] font-sans">
      <StudioTitlebar
        currentView={currentView}
        onViewChange={setCurrentView}
        workspaceName="leverage-studios"
        activeBranch="main"
        agentStatus={isAgentRunning ? 'Running' : 'Ready'}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasConfiguredKey={hasConfiguredKey}
      />

      {currentView === 'docs' ? (
        <DocsPortal onSwitchToStudio={() => setCurrentView('studio')} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 h-full shrink-0">
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>

          <div className="flex-1 h-full min-w-0">
            <MonacoEditorWrapper
              activeFile={activeFile}
              onChangeContent={handleChangeContent}
              pendingDiff={pendingDiff}
              onAcceptDiff={handleAcceptDiff}
              onRejectDiff={handleRejectDiff}
              onTriggerAgentAction={handleTriggerAgentAction}
              isAgentRunning={isAgentRunning}
            />
          </div>

          <div className="w-[420px] h-full shrink-0">
            <AgentControlPanel
              activeFilePath={activeFile.path}
              fileContent={activeFile.content}
              onApplyDiff={(diff) => {
                setPendingDiff(diff);
              }}
              tab={rightPanelTab}
              onTabChange={setRightPanelTab}
            />
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
