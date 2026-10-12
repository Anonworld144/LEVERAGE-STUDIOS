/**
 * Leverage Studios - Isolated Iframe Sandbox Runtime
 * Manages an isolated iframe execution container with strict sandbox="allow-scripts"
 * (omitting allow-same-origin to guarantee complete origin isolation).
 * Enforces execution timeouts and message validation via the postMessage protocol.
 */

export interface SandboxExecutionResult {
  success: boolean;
  result: any;
  logs: string[];
  durationMs: number;
  error?: string;
}

export interface SandboxExecutionOptions {
  functionName?: string;
  timeoutMs?: number;
}

export class IframeSandboxRuntime {
  private static instance: IframeSandboxRuntime | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isReady: boolean = false;
  private pendingRequests: Map<
    string,
    {
      resolve: (res: SandboxExecutionResult) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  private constructor() {
    this.initContainer();
  }

  public static getInstance(): IframeSandboxRuntime {
    if (!IframeSandboxRuntime.instance) {
      IframeSandboxRuntime.instance = new IframeSandboxRuntime();
    }
    return IframeSandboxRuntime.instance;
  }

  /**
   * Initializes the restricted iframe container.
   * Note: sandbox="allow-scripts" without allow-same-origin isolates
   * the guest code from host cookies, DOM, and localStorage.
   */
  private initContainer(): void {
    if (typeof document === 'undefined') return;

    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    this.isReady = false;
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    this.iframe.setAttribute('aria-hidden', 'true');
    this.iframe.style.position = 'absolute';
    this.iframe.style.width = '0';
    this.iframe.style.height = '0';
    this.iframe.style.border = 'none';
    this.iframe.style.opacity = '0';
    this.iframe.style.pointerEvents = 'none';
    this.iframe.src = '/sandbox-runner.html';

    window.addEventListener('message', this.handleHostMessage);

    document.body.appendChild(this.iframe);
  }

  private handleHostMessage = (event: MessageEvent): void => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LEVERAGE_SANDBOX_READY') {
      this.isReady = true;
      return;
    }

    if (data.type === 'LEVERAGE_SANDBOX_RESULT' && data.id) {
      const pending = this.pendingRequests.get(data.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(data.id);

        pending.resolve({
          success: Boolean(data.success),
          result: data.result ?? null,
          logs: Array.isArray(data.logs) ? data.logs : [],
          durationMs: data.durationMs || 0,
          error: data.error,
        });
      }
    }
  };

  /**
   * Dispatches plugin code to be executed inside the isolated container.
   */
  public async executePluginCode(
    code: string,
    input: any = {},
    options: SandboxExecutionOptions = {}
  ): Promise<SandboxExecutionResult> {
    if (typeof document === 'undefined') {
      throw new Error('Sandbox runtime requires a browser or webview environment.');
    }

    if (!this.iframe || !this.iframe.contentWindow) {
      this.initContainer();
    }

    const execId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timeoutMs = options.timeoutMs || 8000;

    return new Promise<SandboxExecutionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(execId);
        // If execution timed out, recreate container to kill infinite loops or memory bloat
        this.initContainer();
        resolve({
          success: false,
          result: null,
          logs: [`[FATAL] Sandbox execution timed out after ${timeoutMs}ms. Container was safely recycled.`],
          durationMs: timeoutMs,
          error: `Execution timed out after ${timeoutMs}ms limit.`,
        });
      }, timeoutMs);

      this.pendingRequests.set(execId, { resolve, reject, timer });

      // Post execution command to guest runner
      const dispatch = () => {
        if (!this.iframe?.contentWindow) {
          clearTimeout(timer);
          this.pendingRequests.delete(execId);
          reject(new Error('Sandbox iframe contentWindow was not initialized.'));
          return;
        }

        this.iframe.contentWindow.postMessage(
          {
            type: 'LEVERAGE_SANDBOX_EXEC',
            id: execId,
            code,
            input,
            functionName: options.functionName || 'run',
          },
          '*'
        );
      };

      if (!this.isReady) {
        setTimeout(dispatch, 250);
      } else {
        dispatch();
      }
    });
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleHostMessage);
    }
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
    this.pendingRequests.clear();
    IframeSandboxRuntime.instance = null;
  }
}

export const sandboxRuntime = IframeSandboxRuntime.getInstance();
