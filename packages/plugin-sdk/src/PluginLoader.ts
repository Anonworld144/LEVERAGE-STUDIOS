/**
 * Leverage Studios - Safe Dynamic Plugin Loader
 * Validates manifests, security scopes, and loads WASM binary modules.
 */

import { PluginManifest, SecurityPermission } from './types.ts';

export class PluginLoader {
  /**
   * Validate that a plugin manifest meets all schema and security invariants
   */
  public static validateManifest(manifest: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Manifest missing unique "id" string');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Manifest missing "name"');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Manifest missing semantic "version"');
    }
    if (!['agent-tool', 'editor-extension', 'ui-panel', 'llm-provider'].includes(manifest.category)) {
      errors.push(`Invalid category: ${manifest.category}`);
    }

    if (manifest.wasm) {
      if (!manifest.wasm.memoryLimitMb || manifest.wasm.memoryLimitMb > 256) {
        errors.push('WASM memory limit must be specified and cannot exceed 256MB for desktop safety');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Audit security permissions requested by a plugin
   */
  public static auditPermissions(permissions: SecurityPermission[]): {
    hasElevatedPermissions: boolean;
    highRiskFlags: string[];
  } {
    const highRiskFlags: string[] = [];

    if (permissions.includes('ProcessExecution:CLI')) {
      highRiskFlags.push('Can execute external binaries via host shell');
    }
    if (permissions.includes('FileSystem:Write')) {
      highRiskFlags.push('Can modify files on local filesystem');
    }
    if (permissions.includes('Network:WebSocket') || permissions.includes('Network:HTTP')) {
      highRiskFlags.push('Can establish outbound network sockets');
    }

    return {
      hasElevatedPermissions: highRiskFlags.length > 0,
      highRiskFlags,
    };
  }
}
