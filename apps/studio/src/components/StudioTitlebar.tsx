/**
 * Leverage Studios - Native Desktop Titlebar
 * Cross-platform Tauri window frame simulation for Windows & Linux
 */

import React from 'react';
import {
  Minus,
  Square,
  X,
  Code2,
  BookOpen,
  GitBranch,
  Search,
  Sparkles,
  Cpu,
  Layers,
  Settings,
} from 'lucide-react';

interface StudioTitlebarProps {
  currentView: 'studio' | 'docs';
  onViewChange: (view: 'studio' | 'docs') => void;
  workspaceName: string;
  activeBranch: string;
  agentStatus: string;
  onOpenSettings: () => void;
  hasConfiguredKey?: boolean;
}

export const StudioTitlebar: React.FC<StudioTitlebarProps> = ({
  currentView,
  onViewChange,
  workspaceName,
  activeBranch,
  agentStatus,
  onOpenSettings,
  hasConfiguredKey = false,
}) => {
  return (
    <header className="flex h-10 w-full items-center justify-between border-b border-[#1a1e29] bg-[#0c0e14] px-3 select-none text-xs">
      {/* Zone 1: Window Controls + Brand */}
      <div className="flex items-center gap-3">
        {/* Linux / Windows titlebar button pills */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f56] hover:opacity-80 cursor-pointer" title="Close" />
          <div className="h-3 w-3 rounded-full bg-[#ffbd2e] hover:opacity-80 cursor-pointer" title="Minimize" />
          <div className="h-3 w-3 rounded-full bg-[#27c93f] hover:opacity-80 cursor-pointer" title="Maximize" />
        </div>

        <div className="h-4 w-px bg-[#1a1e29] mx-1" />

        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-tight flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            Leverage Studios
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">v0.1.0-alpha (Tauri 2.0)</span>
        </div>
      </div>

      {/* Zone 2: Navigation & Quick Search */}
      <div className="flex items-center gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#131722] rounded-lg p-0.5 border border-[#1e2330]">
          <button
            onClick={() => onViewChange('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
              currentView === 'studio' ? 'bg-[#212738] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-indigo-400" /> Studio IDE
          </button>
          <button
            onClick={() => onViewChange('docs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
              currentView === 'docs' ? 'bg-[#212738] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Plugin Docs & SDK
          </button>
        </div>

        {/* Workspace context pill */}
        <div className="hidden md:flex items-center gap-2 text-neutral-400 bg-[#11141d] px-2.5 py-1 rounded border border-[#1a1e29] text-[11px]">
          <span>{workspaceName}</span>
          <span className="text-neutral-600">/</span>
          <span className="flex items-center gap-1 text-neutral-300">
            <GitBranch className="h-3 w-3 text-indigo-400" />
            {activeBranch}
          </span>
        </div>
      </div>

      {/* Zone 3: Agent Orchestrator Status & Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-[#11141d] px-2.5 py-1 rounded border border-[#1a1e29] text-[11px]">
          <span className="text-neutral-400">Agent Engine:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {agentStatus}
          </span>
        </div>

        {/* BYOK Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-lg bg-[#151926] hover:bg-[#1d2336] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white border border-[#232a3b] transition-colors"
          title="Configure API Keys (BYOK)"
        >
          <Settings className="h-3.5 w-3.5 text-indigo-400" />
          <span>Settings</span>
          {hasConfiguredKey ? (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="API Key Active" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" title="API Key Missing" />
          )}
        </button>

        <button
          onClick={() => alert('Command Palette (Cmd+K / Ctrl+K)\n- Spawn Agent\n- Run DAG Pipeline\n- Install WASM Plugin\n- Format Document')}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white bg-[#11141d] hover:bg-[#1a1e29] px-2 py-1 rounded border border-[#1a1e29] transition-colors"
        >
          <Search className="h-3 w-3" />
          <span className="text-[10px] font-mono">⌘K</span>
        </button>
      </div>
    </header>
  );
};
