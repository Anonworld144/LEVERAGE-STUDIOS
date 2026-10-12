/**
 * Leverage Studios - Monaco Editor & Diff Viewer Wrapper
 * Integrates Monaco Editor (@monaco-editor/react) with side-by-side diff previews,
 * streaming agent patch inspection, and AI inline suggestions.
 */

import React, { useState } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
  SplitSquareVertical,
  Code,
  Sparkles,
  Check,
  X,
  Play,
  RotateCcw,
  Zap,
  Shield,
  FileCheck,
} from 'lucide-react';
import { WorkspaceFile, EditorViewMode } from '../types.ts';
import { StreamingDiff } from '@leverage/core';

interface MonacoEditorWrapperProps {
  activeFile: WorkspaceFile;
  onChangeContent: (newContent: string) => void;
  pendingDiff: StreamingDiff | null;
  onAcceptDiff: (diff: StreamingDiff) => void;
  onRejectDiff: (diff: StreamingDiff) => void;
  onTriggerAgentAction: (actionType: string) => void;
  isAgentRunning: boolean;
}

export const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = ({
  activeFile,
  onChangeContent,
  pendingDiff,
  onAcceptDiff,
  onRejectDiff,
  onTriggerAgentAction,
  isAgentRunning,
}) => {
  const [viewMode, setViewMode] = useState<EditorViewMode>(pendingDiff ? 'diff-split' : 'code');
  const [inlineSuggestionActive, setInlineSuggestionActive] = useState<boolean>(false);
  const [simulatedSuggestion, setSimulatedSuggestion] = useState<string>('');

  // If a new diff arrives, default to diff view
  React.useEffect(() => {
    if (pendingDiff) {
      setViewMode('diff-split');
    }
  }, [pendingDiff]);

  const handleTriggerAutocomplete = () => {
    setInlineSuggestionActive(true);
    setSimulatedSuggestion(
      `\n  // AI Inline Ghost Autocomplete (Tab to accept)\n  public async executePipeline(): Promise<void> {\n    await this.verifyStateInvariants();\n  }`
    );
  };

  const handleAcceptSuggestion = () => {
    onChangeContent(activeFile.content + simulatedSuggestion);
    setInlineSuggestionActive(false);
    setSimulatedSuggestion('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0d1017] overflow-hidden">
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between border-b border-[#1a1e29] px-4 py-2 bg-[#10141e] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-neutral-300 font-medium">{activeFile.name}</span>
          <span className="text-[11px] text-neutral-500">({activeFile.language})</span>

          {pendingDiff && (
            <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
              <Sparkles className="h-3 w-3" />
              Proposed Diff: +{pendingDiff.additions} / -{pendingDiff.deletions}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Agent Actions */}
          <div className="flex items-center gap-1 mr-3 border-r border-[#1a1e29] pr-3">
            <button
              onClick={() => onTriggerAgentAction('optimize')}
              disabled={isAgentRunning}
              className="flex items-center gap-1 rounded bg-[#181d2a] px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white hover:bg-[#202637] transition-colors disabled:opacity-50"
            >
              <Zap className="h-3 w-3 text-amber-400" /> Optimize
            </button>
            <button
              onClick={() => onTriggerAgentAction('audit')}
              disabled={isAgentRunning}
              className="flex items-center gap-1 rounded bg-[#181d2a] px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white hover:bg-[#202637] transition-colors disabled:opacity-50"
            >
              <Shield className="h-3 w-3 text-emerald-400" /> Security Audit
            </button>
            <button
              onClick={handleTriggerAutocomplete}
              disabled={isAgentRunning}
              className="flex items-center gap-1 rounded bg-indigo-600/20 px-2.5 py-1 text-[11px] text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" /> Inline AI
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#090b10] rounded p-0.5 border border-[#1a1e29]">
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                viewMode === 'code' ? 'bg-[#1e2433] text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="h-3 w-3" /> Editor
            </button>
            <button
              onClick={() => setViewMode('diff-split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                viewMode === 'diff-split' ? 'bg-[#1e2433] text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="h-3 w-3" /> Side-by-Side Diff
            </button>
          </div>
        </div>
      </div>

      {/* Diff Review Banner if Diff is active */}
      {pendingDiff && (
        <div className="flex items-center justify-between bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Agent proposed changes to this file. Review the side-by-side diff below:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRejectDiff(pendingDiff)}
              className="flex items-center gap-1 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
            <button
              onClick={() => onAcceptDiff(pendingDiff)}
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-xs shadow-sm"
            >
              <Check className="h-3.5 w-3.5" /> Accept Patch
            </button>
          </div>
        </div>
      )}

      {/* Inline AI Autocomplete Banner */}
      {inlineSuggestionActive && (
        <div className="flex items-center justify-between bg-indigo-950/40 border-b border-indigo-800/40 px-4 py-1.5 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Inline Autocomplete suggestion ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInlineSuggestionActive(false)}
              className="px-2 py-0.5 rounded text-neutral-400 hover:text-white"
            >
              Dismiss (Esc)
            </button>
            <button
              onClick={handleAcceptSuggestion}
              className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Accept (Tab)
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === 'code' ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            theme="vs-dark"
            onChange={(val) => onChangeContent(val || '')}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              tabSize: 2,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
            }}
          />
        ) : (
          <DiffEditor
            height="100%"
            original={pendingDiff ? pendingDiff.originalContent : activeFile.content}
            modified={pendingDiff ? pendingDiff.modifiedContent : activeFile.content}
            language={activeFile.language}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              renderSideBySide: true,
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}
      </div>

      {/* Monaco Bottom Status Bar */}
      <div className="flex items-center justify-between border-t border-[#1a1e29] px-4 py-1.5 bg-[#0b0e14] text-[11px] text-neutral-400 font-mono select-none">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span>Ln {activeFile.content.split('\n').length}, Col 1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <FileCheck className="h-3 w-3" /> Syntax Verified
          </span>
          <span className="text-neutral-500">Monaco 0.52.0</span>
        </div>
      </div>
    </div>
  );
};
