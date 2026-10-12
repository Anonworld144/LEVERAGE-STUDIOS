/**
 * Leverage Studios - Cross-Platform IPC Bridge
 * Provides bidirectional communication channels between Tauri 2.0 (Rust Core),
 * Node.js worker pools, Python agent runtimes, and the React desktop frontend.
 * Strictly validated with Zod schemas to sanitize all incoming channels and payloads.
 */

import { z } from 'zod';
import { IPCMessage, IPCRuntimeTarget } from './types.ts';

// Schema for channel validation
const IPCChannelSchema = z
  .string()
  .min(1, 'IPC Channel cannot be empty')
  .max(128, 'IPC Channel name exceeds maximum allowed length')
  .regex(/^[a-zA-Z0-9_:-]+$/, 'IPC Channel contains disallowed characters');

const IPCTargetSchema = z.enum(['tauri-rust', 'node-worker', 'python-runtime', 'wasm-sandbox']);

const IPCSendRequestSchema = z.object({
  channel: IPCChannelSchema,
  target: IPCTargetSchema,
  timeoutMs: z.number().int().min(100).max(60000).default(10000),
});

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
    const validatedChannel = IPCChannelSchema.parse(channel);

    if (!this.handlers.has(validatedChannel)) {
      this.handlers.set(validatedChannel, new Set());
    }
    this.handlers.get(validatedChannel)!.add(handler);

    return () => {
      this.handlers.get(validatedChannel)?.delete(handler);
    };
  }

  /**
   * Send an IPC message to a target runtime (Rust, Node, Python, WASM)
   * Strictly sanitized via Zod.
   */
  public async send<T = any, R = any>(
    channel: string,
    payload: T,
    target: IPCRuntimeTarget = 'tauri-rust',
    timeoutMs: number = 10000
  ): Promise<R> {
    // 1. Zod schema validation
    const validation = IPCSendRequestSchema.safeParse({ channel, target, timeoutMs });
    if (!validation.success) {
      throw new Error(`IPC validation error: ${validation.error.issues.map((i) => i.message).join(', ')}`);
    }

    // Ensure payload is JSON-serializable
    let sanitizedPayload = payload;
    try {
      sanitizedPayload = JSON.parse(JSON.stringify(payload ?? {}));
    } catch {
      throw new Error('IPC Payload must be JSON-serializable');
    }

    const messageId = `ipc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const message: IPCMessage<T> = {
      id: messageId,
      channel: validation.data.channel,
      sender: 'tauri-rust',
      target: validation.data.target,
      payload: sanitizedPayload,
      timestamp: Date.now(),
    };

    this.messageHistory.unshift(message);
    if (this.messageHistory.length > 200) {
      this.messageHistory.pop();
    }

    // In actual Tauri environment, invoke via __TAURI__.core.invoke
    if (this.isTauriEnvironment && typeof (window as any).__TAURI__?.core?.invoke === 'function') {
      try {
        const result = await (window as any).__TAURI__.core.invoke(validation.data.channel, sanitizedPayload);
        return result as R;
      } catch (err) {
        throw new Error(`Tauri IPC failed on channel ${validation.data.channel}: ${err}`);
      }
    }

    // High-fidelity fallback / simulated runtime for web preview & headless testing
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        resolve(this.simulateResponse(validation.data.channel, sanitizedPayload) as R);
      }, 80);

      this.pendingRequests.set(messageId, { resolve, reject, timeout });
    });
  }

  /**
   * Broadcast an event to all local subscribers
   */
  public broadcast(message: IPCMessage): void {
    const channelValidation = IPCChannelSchema.safeParse(message.channel);
    if (!channelValidation.success) {
      console.warn('[IPCBridge] Discarding message with invalid channel:', message.channel);
      return;
    }

    const channelHandlers = this.handlers.get(channelValidation.data);
    if (channelHandlers) {
      for (const handler of channelHandlers) {
        try {
          handler(message);
        } catch (err) {
          console.error(`Error in IPC handler for channel ${channelValidation.data}:`, err);
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
          os: typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows') ? 'windows' : 'linux',
          arch: 'x86_64',
          tauriVersion: '2.0.4',
          rustEngine: 'rustc 1.84.0',
        };
      default:
        return { success: true, timestamp: Date.now() };
    }
  }
}
