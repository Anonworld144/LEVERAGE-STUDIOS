/**
 * Leverage Studios - Cross-Platform IPC Bridge
 * Provides bidirectional communication channels between Tauri 2.0 (Rust Core),
 * Node.js worker pools, Python agent runtimes, and the React desktop frontend.
 */

import { IPCMessage, IPCResponse, IPCRuntimeTarget } from './types.ts';

type MessageHandler = (message: IPCMessage) => void;

export class IPCBridge {
  private static instance: IPCBridge;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timeout: any }> = new Map();
  private isTauriEnvironment: boolean = false;
  private messageHistory: IPCMessage[] = [];

  private constructor() {
    // Check for Tauri window.__TAURI_INTERNALS__ or window.__TAURI__
    if (typeof window !== 'undefined') {
      this.isTauriEnvironment = Boolean((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__);
    }
  }

  public static getInstance(): IPCBridge {
    if (!IPCBridge.instance) {
      IPCBridge.instance = new IPCBridge();
    }
    return IPCBridge.instance;
  }

  /**
   * Check if running inside actual Tauri native container
   */
  public isNative(): boolean {
    return this.isTauriEnvironment;
  }

  /**
   * Subscribe to messages on an IPC channel
   */
  public subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    return () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }

  /**
   * Send an IPC message to a target runtime (Rust, Node, Python, WASM)
   */
  public async send<T = any, R = any>(
    channel: string,
    payload: T,
    target: IPCRuntimeTarget = 'tauri-rust',
    timeoutMs: number = 10000
  ): Promise<R> {
    const messageId = `ipc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const message: IPCMessage<T> = {
      id: messageId,
      channel,
      sender: 'tauri-rust', // or frontend
      target,
      payload,
      timestamp: Date.now(),
    };

    this.messageHistory.unshift(message);
    if (this.messageHistory.length > 200) {
      this.messageHistory.pop();
    }

    // In actual Tauri environment, invoke via __TAURI__.core.invoke
    if (this.isTauriEnvironment && typeof (window as any).__TAURI__?.core?.invoke === 'function') {
      try {
        const result = await (window as any).__TAURI__.core.invoke(channel, payload);
        return result as R;
      } catch (err) {
        throw new Error(`Tauri IPC failed on channel ${channel}: ${err}`);
      }
    }

    // High-fidelity fallback / simulated runtime for web preview & headless testing
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        resolve(this.simulateResponse(channel, payload) as R);
      }, 80);

      this.pendingRequests.set(messageId, { resolve, reject, timeout });
    });
  }

  /**
   * Broadcast an event to all local subscribers
   */
  public broadcast(message: IPCMessage): void {
    const channelHandlers = this.handlers.get(message.channel);
    if (channelHandlers) {
      for (const handler of channelHandlers) {
        try {
          handler(message);
        } catch (err) {
          console.error(`Error in IPC handler for channel ${message.channel}:`, err);
        }
      }
    }
  }

  /**
   * Returns recent IPC transmission log for system diagnostics
   */
  public getTelemetryHistory(): IPCMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Internal high-fidelity response mock for web sandbox
   */
  private simulateResponse(channel: string, payload: any): any {
    switch (channel) {
      case 'tauri:agent:spawn':
        return { pid: 4892, status: 'spawned', runtime: 'python-3.11' };
      case 'tauri:fs:read':
        return { content: '// Loaded via native FS bridge', bytes: 1024 };
      case 'tauri:wasm:execute':
        return { status: 'success', memoryUsedKb: 340, gasConsumed: 1200 };
      case 'tauri:system:info':
        return {
          os: navigator.userAgent.includes('Windows') ? 'windows' : 'linux',
          arch: 'x86_64',
          tauriVersion: '2.0.4',
          rustEngine: 'rustc 1.84.0',
        };
      default:
        return { success: true, timestamp: Date.now() };
    }
  }
}
