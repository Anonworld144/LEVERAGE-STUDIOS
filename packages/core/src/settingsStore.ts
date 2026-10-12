/**
 * Leverage Studios - Local Secure Settings Store (BYOK)
 * Manages user API keys locally with AES-256-GCM encryption.
 * Plaintext keys are strictly prohibited from raw storage.
 */

import { secureKeyManager } from './../../../src/lib/config/keys.ts';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic';

export interface UserApiKeys {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  preferredProvider?: LLMProvider;
}

export interface ProviderStatus {
  provider: LLMProvider;
  name: string;
  configured: boolean;
  maskedKey: string;
}

export class SettingsStore {
  private static instance: SettingsStore;
  private inMemoryKeys: UserApiKeys = {};
  private listeners: Set<(keys: UserApiKeys) => void> = new Set();

  private constructor() {
    this.hydrateFromSecureVault();
  }

  public static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private async hydrateFromSecureVault(): Promise<void> {
    try {
      const gemini = await secureKeyManager.getClientKey('gemini');
      const openai = await secureKeyManager.getClientKey('openai');
      const anthropic = await secureKeyManager.getClientKey('anthropic');

      this.inMemoryKeys = {
        geminiApiKey: gemini || undefined,
        openaiApiKey: openai || undefined,
        anthropicApiKey: anthropic || undefined,
      };
      this.notify();
    } catch (e) {
      console.warn('[SettingsStore] Vault hydration notice:', e);
    }
  }

  public getKeys(): UserApiKeys {
    return { ...this.inMemoryKeys };
  }

  public getApiKey(provider: LLMProvider): string | undefined {
    switch (provider) {
      case 'gemini':
        return this.inMemoryKeys.geminiApiKey?.trim();
      case 'openai':
        return this.inMemoryKeys.openaiApiKey?.trim();
      case 'anthropic':
        return this.inMemoryKeys.anthropicApiKey?.trim();
      default:
        return undefined;
    }
  }

  public hasKey(provider: LLMProvider): boolean {
    const key = this.getApiKey(provider);
    return Boolean(key && key.length > 5);
  }

  public async setApiKey(provider: LLMProvider, key: string): Promise<void> {
    const trimmed = key.trim();
    if (provider === 'gemini') this.inMemoryKeys.geminiApiKey = trimmed;
    if (provider === 'openai') this.inMemoryKeys.openaiApiKey = trimmed;
    if (provider === 'anthropic') this.inMemoryKeys.anthropicApiKey = trimmed;

    await secureKeyManager.setClientKey(provider, trimmed);
    this.notify();
  }

  public async saveAllKeys(newKeys: Partial<UserApiKeys>): Promise<void> {
    this.inMemoryKeys = {
      ...this.inMemoryKeys,
      ...newKeys,
    };

    if (newKeys.geminiApiKey !== undefined) {
      await secureKeyManager.setClientKey('gemini', newKeys.geminiApiKey);
    }
    if (newKeys.openaiApiKey !== undefined) {
      await secureKeyManager.setClientKey('openai', newKeys.openaiApiKey);
    }
    if (newKeys.anthropicApiKey !== undefined) {
      await secureKeyManager.setClientKey('anthropic', newKeys.anthropicApiKey);
    }

    this.notify();
  }

  public clearAllKeys(): void {
    this.inMemoryKeys = {};
    secureKeyManager.clearKeys();
    this.notify();
  }

  public subscribe(listener: (keys: UserApiKeys) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.inMemoryKeys });
      } catch (e) {
        console.error('[SettingsStore] Listener error:', e);
      }
    }
  }

  public getProviderStatuses(): ProviderStatus[] {
    const mask = (key?: string) => {
      if (!key || key.length < 8) return '';
      return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    return [
      {
        provider: 'gemini',
        name: 'Google Gemini',
        configured: this.hasKey('gemini'),
        maskedKey: mask(this.inMemoryKeys.geminiApiKey),
      },
      {
        provider: 'openai',
        name: 'OpenAI (GPT-4o)',
        configured: this.hasKey('openai'),
        maskedKey: mask(this.inMemoryKeys.openaiApiKey),
      },
      {
        provider: 'anthropic',
        name: 'Anthropic (Claude 3.7)',
        configured: this.hasKey('anthropic'),
        maskedKey: mask(this.inMemoryKeys.anthropicApiKey),
      },
    ];
  }

  /**
   * Lightweight connection probe via proxy route to verify authentication
   */
  public async testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 8) {
      return { success: false, message: 'Invalid API key format. Key is too short.' };
    }

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Respond with CONNECTED only.',
          userApiKey: apiKey.trim(),
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Connection verified successfully via secure agent proxy! Gemini is ready.',
        };
      }

      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errData.error || `Proxy returned HTTP status ${response.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'API connection failed. Please check key validity and network access.',
      };
    }
  }
}
