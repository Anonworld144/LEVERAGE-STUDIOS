/**
 * Leverage Studios - Secure Key Configuration Layer
 * Implements strict zero-plaintext key handling.
 * All keys are either:
 * 1. Read from secure server-side environment variables via proxy routes (/api/agent/run), or
 * 2. Stored in encrypted client state using Web Crypto API (AES-GCM 256-bit).
 * Raw unencrypted localStorage/sessionStorage usage is strictly prohibited.
 */

export interface KeyConfigState {
  hasServerGeminiKey: boolean;
  isClientKeyConfigured: boolean;
  provider: 'gemini' | 'openai' | 'anthropic';
}

const ENCRYPTED_STORAGE_KEY = 'leverage_sec_vault_v2';
const SALT_STORAGE_KEY = 'leverage_sec_salt_v2';

class SecureKeyManager {
  private static instance: SecureKeyManager;
  private inMemoryEncryptedKey: string | null = null;
  private sessionKeyPromise: Promise<CryptoKey> | null = null;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.sessionKeyPromise = this.initSessionKey();
  }

  public static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }

  /**
   * Initializes or derives an AES-GCM 256-bit encryption key
   * using the Web Cryptography API (hardware/browser backed).
   */
  private async initSessionKey(): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      throw new Error('Web Cryptography API is unavailable in this environment.');
    }

    let salt: Uint8Array;
    const existingSalt = sessionStorage.getItem(SALT_STORAGE_KEY);
    if (existingSalt) {
      salt = new Uint8Array(JSON.parse(existingSalt));
    } else {
      salt = window.crypto.getRandomValues(new Uint8Array(16));
      sessionStorage.setItem(SALT_STORAGE_KEY, JSON.stringify(Array.from(salt)));
    }

    // Derive session key bound to current client domain origin
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(`leverage-session-seed-${window.location.origin}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts and stores an API key using AES-GCM.
   * Plaintext keys are never written to storage.
   */
  public async setClientKey(provider: string, plainKey: string): Promise<void> {
    const trimmed = plainKey.trim();
    if (!trimmed) {
      this.clearKeys();
      return;
    }

    const key = await this.sessionKeyPromise!;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPayload = new TextEncoder().encode(JSON.stringify({ provider, key: trimmed, timestamp: Date.now() }));

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encodedPayload
    );

    const vaultBundle = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext)),
    };

    this.inMemoryEncryptedKey = JSON.stringify(vaultBundle);
    sessionStorage.setItem(ENCRYPTED_STORAGE_KEY, this.inMemoryEncryptedKey);
    this.notify();
  }

  /**
   * Decrypts the stored key in-memory on demand for authorized request signing.
   */
  public async getClientKey(provider: string): Promise<string | null> {
    const rawBundle = this.inMemoryEncryptedKey || sessionStorage.getItem(ENCRYPTED_STORAGE_KEY);
    if (!rawBundle) return null;

    try {
      const bundle = JSON.parse(rawBundle);
      const key = await this.sessionKeyPromise!;
      const iv = new Uint8Array(bundle.iv);
      const data = new Uint8Array(bundle.data);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        data.buffer as ArrayBuffer
      );

      const decrypted = JSON.parse(new TextDecoder().decode(decryptedBuffer));
      if (decrypted.provider === provider || !provider) {
        return decrypted.key;
      }
      return null;
    } catch (err) {
      console.warn('[SecureKeyManager] Failed to decrypt client credential:', err);
      return null;
    }
  }

  public hasConfiguredClientKey(): boolean {
    return Boolean(this.inMemoryEncryptedKey || sessionStorage.getItem(ENCRYPTED_STORAGE_KEY));
  }

  public clearKeys(): void {
    this.inMemoryEncryptedKey = null;
    sessionStorage.removeItem(ENCRYPTED_STORAGE_KEY);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  /**
   * Probes backend proxy endpoint to check if server-side environment credentials exist.
   */
  public async checkServerConfiguration(): Promise<KeyConfigState> {
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_config' }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          hasServerGeminiKey: Boolean(data.hasServerKey),
          isClientKeyConfigured: this.hasConfiguredClientKey(),
          provider: 'gemini',
        };
      }
    } catch {
      // Fallback if offline
    }

    return {
      hasServerGeminiKey: false,
      isClientKeyConfigured: this.hasConfiguredClientKey(),
      provider: 'gemini',
    };
  }
}

export const secureKeyManager = SecureKeyManager.getInstance();
