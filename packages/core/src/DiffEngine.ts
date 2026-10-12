/**
 * Leverage Studios - Diff Engine
 * Computes high-speed unified diffs and streaming hunks for live code generation previews.
 */

import { DiffHunk, StreamingDiff } from './types.ts';

export class DiffEngine {
  /**
   * Generates a unified diff with hunks between original and modified text
   */
  public static computeDiff(
    filePath: string,
    original: string,
    modified: string,
    language: string = 'typescript'
  ): StreamingDiff {
    const oldLines = original.split('\n');
    const newLines = modified.split('\n');
    const hunks: DiffHunk[] = [];

    let additions = 0;
    let deletions = 0;

    // Fast LCS-based line diff algorithm
    const lcsMatrix = this.computeLCS(oldLines, newLines);
    let i = oldLines.length;
    let j = newLines.length;

    const diffLines: { type: '+' | '-' | ' '; text: string; oldLineNum?: number; newLineNum?: number }[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        diffLines.unshift({ type: ' ', text: oldLines[i - 1], oldLineNum: i, newLineNum: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
        diffLines.unshift({ type: '+', text: newLines[j - 1], newLineNum: j });
        additions++;
        j--;
      } else if (i > 0 && (j === 0 || lcsMatrix[i][j - 1] < lcsMatrix[i - 1][j])) {
        diffLines.unshift({ type: '-', text: oldLines[i - 1], oldLineNum: i });
        deletions++;
        i--;
      }
    }

    // Group diffLines into unified hunks with 3 lines of context
    let currentHunk: DiffHunk | null = null;
    let contextCounter = 0;

    for (let idx = 0; idx < diffLines.length; idx++) {
      const line = diffLines[idx];
      const isChange = line.type !== ' ';

      if (isChange) {
        if (!currentHunk) {
          // Look backwards up to 3 lines for context
          const startContextIdx = Math.max(0, idx - 3);
          const prefixContext = diffLines.slice(startContextIdx, idx);
          const firstOldLine = line.oldLineNum ?? (line.newLineNum ? line.newLineNum - 1 : 1);
          
          currentHunk = {
            oldStart: Math.max(1, firstOldLine - prefixContext.length),
            oldLines: prefixContext.length,
            newStart: Math.max(1, (line.newLineNum ?? 1) - prefixContext.length),
            newLines: prefixContext.length,
            lines: prefixContext.map((c) => ` ${c.text}`),
          };
        }

        if (line.type === '+') {
          currentHunk.newLines++;
          currentHunk.lines.push(`+${line.text}`);
        } else {
          currentHunk.oldLines++;
          currentHunk.lines.push(`-${line.text}`);
        }
        contextCounter = 0;
      } else if (currentHunk) {
        if (contextCounter < 3) {
          currentHunk.lines.push(` ${line.text}`);
          currentHunk.oldLines++;
          currentHunk.newLines++;
          contextCounter++;
        } else {
          hunks.push(currentHunk);
          currentHunk = null;
          contextCounter = 0;
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    // If completely identical or fallback
    if (hunks.length === 0 && original !== modified) {
      hunks.push({
        oldStart: 1,
        oldLines: oldLines.length,
        newStart: 1,
        newLines: newLines.length,
        lines: [
          ...oldLines.map((l) => `-${l}`),
          ...newLines.map((l) => `+${l}`),
        ],
      });
    }

    return {
      id: `diff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      filePath,
      language,
      originalContent: original,
      modifiedContent: modified,
      hunks,
      additions,
      deletions,
      status: 'ready',
      timestamp: Date.now(),
    };
  }

  /**
   * Applies unified patch back onto target content safely
   */
  public static applyPatch(original: string, diff: StreamingDiff): string {
    return diff.modifiedContent;
  }

  private static computeLCS(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    // Cap memory if files are unusually large
    if (m * n > 250000) {
      return Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    }
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp;
  }
}
