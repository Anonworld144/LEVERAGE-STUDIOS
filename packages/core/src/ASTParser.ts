/**
 * Leverage Studios - AST Parser & Code Chunk Analyzer
 * Lightweight syntax analyzer for TypeScript, JavaScript, Rust, and Python.
 * Extracts structural units (imports, functions, classes, interfaces) for agent prompt context
 * and automated refactoring.
 */

import { ASTAnalysisResult, ASTNode } from './types.ts';

export class ASTParser {
  /**
   * Parse source code into structural AST nodes
   */
  public static analyze(code: string, filePath: string): ASTAnalysisResult {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const language = this.detectLanguage(ext);
    const lines = code.split('\n');

    const imports: string[] = [];
    const exports: string[] = [];
    const declarations: ASTNode[] = [];

    // Lightweight regex-assisted multi-language structural parser
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNum = i + 1;

      // Imports
      if (line.startsWith('import ') || line.startsWith('from ') || line.startsWith('use ') || line.startsWith('require(')) {
        imports.push(line);
        declarations.push({
          type: 'ImportDeclaration',
          startLine: lineNum,
          endLine: lineNum,
          signature: line,
        });
        continue;
      }

      // Exports
      if (line.startsWith('export ') || line.startsWith('pub ')) {
        exports.push(line);
      }

      // TypeScript / JavaScript / Rust / Python Function Declarations
      const tsFnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/);
      const tsMethodMatch = line.match(/(?:public|private|protected|static|async)?\s*([A-Za-z0-9_$]+)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/);
      const arrowFnMatch = line.match(/(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^{=]+)?\s*=>/);
      const rustFnMatch = line.match(/(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
      const pyFnMatch = line.match(/(?:def|async def)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\):/);

      if (tsFnMatch || arrowFnMatch || rustFnMatch || pyFnMatch) {
        const fnName = (tsFnMatch || arrowFnMatch || rustFnMatch || pyFnMatch)![1];
        declarations.push({
          type: 'FunctionDeclaration',
          name: fnName,
          startLine: lineNum,
          endLine: this.findScopeEndLine(lines, i, language),
          signature: line,
        });
        continue;
      }

      // Classes
      const classMatch = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/) ||
                         line.match(/(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        declarations.push({
          type: 'ClassDeclaration',
          name: classMatch[1],
          startLine: lineNum,
          endLine: this.findScopeEndLine(lines, i, language),
          signature: line,
        });
        continue;
      }

      // Interfaces & Types
      const ifaceMatch = line.match(/(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/) ||
                         line.match(/(?:pub\s+)?trait\s+([A-Za-z0-9_]+)/);
      if (ifaceMatch) {
        declarations.push({
          type: 'InterfaceDeclaration',
          name: ifaceMatch[1],
          startLine: lineNum,
          endLine: this.findScopeEndLine(lines, i, language),
          signature: line,
        });
        continue;
      }
    }

    const complexityScore = this.computeCyclomaticComplexity(lines);
    const tokenCountEstimate = Math.ceil(code.length / 3.8);

    return {
      filePath,
      language,
      imports,
      exports,
      declarations,
      complexityScore,
      tokenCountEstimate,
    };
  }

  private static detectLanguage(ext: string): string {
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'rs':
        return 'rust';
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'plaintext';
    }
  }

  private static findScopeEndLine(lines: string[], startIdx: number, language: string): number {
    if (language === 'python') {
      const baseIndent = lines[startIdx].search(/\S/);
      for (let j = startIdx + 1; j < lines.length; j++) {
        if (!lines[j].trim()) continue;
        const indent = lines[j].search(/\S/);
        if (indent <= baseIndent) return j;
      }
      return lines.length;
    }

    // Bracket-based search
    let depth = 0;
    let foundOpen = false;
    for (let j = startIdx; j < lines.length; j++) {
      const line = lines[j];
      for (const char of line) {
        if (char === '{') {
          depth++;
          foundOpen = true;
        } else if (char === '}') {
          depth--;
          if (foundOpen && depth <= 0) {
            return j + 1;
          }
        }
      }
    }
    return Math.min(lines.length, startIdx + 10);
  }

  private static computeCyclomaticComplexity(lines: string[]): number {
    let score = 1;
    const branches = [
      /\bif\b/,
      /\belse\b/,
      /\bfor\b/,
      /\bwhile\b/,
      /\bcase\b/,
      /\bcatch\b/,
      /&&/,
      /\|\|/,
      /\?\s*[^:]+\s*:/,
    ];

    for (const line of lines) {
      for (const regex of branches) {
        if (regex.test(line)) {
          score++;
        }
      }
    }
    return score;
  }
}
