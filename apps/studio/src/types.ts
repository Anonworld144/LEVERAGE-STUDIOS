/**
 * Leverage Studios - Studio Frontend Types
 */

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
  hasAgentDiff?: boolean;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  children: (WorkspaceFolder | WorkspaceFile)[];
  isOpen?: boolean;
}

export interface EditorTab {
  fileId: string;
  filePath: string;
  fileName: string;
  language: string;
  isDirty?: boolean;
}

export type EditorViewMode = 'code' | 'diff-split' | 'diff-inline';

export type RightPanelTab = 'dag' | 'console' | 'plugins' | 'ipc-diagnostics';
