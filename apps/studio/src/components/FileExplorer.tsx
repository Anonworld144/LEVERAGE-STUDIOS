/**
 * Leverage Studios - File Explorer & Workspace Tree
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { WorkspaceFile, WorkspaceFolder } from '../types.ts';

interface FileExplorerProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (file: WorkspaceFile) => void;
  onCreateFile: (name: string, folderPath?: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'packages': true,
    'packages/core': true,
    'packages/plugin-sdk': true,
    'apps': true,
    'apps/studio': true,
  });

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      return <FileCode className="h-4 w-4 text-sky-400 shrink-0" />;
    }
    if (fileName.endsWith('.rs')) {
      return <FileCode className="h-4 w-4 text-orange-400 shrink-0" />;
    }
    if (fileName.endsWith('.py')) {
      return <FileCode className="h-4 w-4 text-yellow-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="h-4 w-4 text-emerald-400 shrink-0" />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText className="h-4 w-4 text-neutral-400 shrink-0" />;
    }
    return <FileCode className="h-4 w-4 text-neutral-400 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col bg-[#0f121a] border-r border-[#1a1e29] select-none text-xs">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-[#1a1e29] px-3 py-2.5">
        <span className="font-semibold text-neutral-300 tracking-wide uppercase text-[11px]">
          Workspace
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreatingFile(true)}
            title="New File"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#1a1e29] transition-colors"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setSearchQuery('')}
            title="Refresh Explorer"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#1a1e29] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="p-2 border-b border-[#1a1e29]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-[#0b0d13] border border-[#1a1e29] pl-8 pr-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Create New File Inline Input */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[#1a1e29] bg-[#141824]">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              placeholder="e.g. AgentRunner.ts"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 rounded bg-[#0b0d13] border border-indigo-500 px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-indigo-600 px-2 py-1 text-[11px] text-white hover:bg-indigo-500"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="rounded px-1.5 py-1 text-[11px] text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-neutral-500">
            No matching files found
          </div>
        ) : (
          <div className="space-y-0.5 px-1">
            {filteredFiles.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file)}
                  className={`group flex items-center justify-between rounded px-2 py-1.5 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-500'
                      : 'text-neutral-300 hover:bg-[#161a24] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(file.name)}
                    <span className="truncate">{file.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.hasAgentDiff && (
                      <span
                        title="Agent generated pending diff"
                        className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono"
                      >
                        <Sparkles className="h-3 w-3" />
                        diff
                      </span>
                    )}

                    {file.isModified && !file.hasAgentDiff && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${file.name}?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-rose-400 transition-opacity"
                      title="Delete File"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Explorer Footer */}
      <div className="border-t border-[#1a1e29] p-2 bg-[#0c0e14] text-[11px] text-neutral-500 flex items-center justify-between">
        <span>{files.length} workspace files</span>
        <span className="text-emerald-400">Git: main</span>
      </div>
    </div>
  );
};
