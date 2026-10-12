/**
 * Leverage Studios - Local Secure Settings Store (BYOK)
 * Manages user API keys locally on the user's machine.
 * All keys remain strictly client-side/local and are never forwarded to intermediary proxy servers.
 */

import { GoogleGenAI } from '@google/genai';

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

const STORAGE_KEY = 'leverage_studios_byok_settings_v1';

export class SettingsStore {
  private static instance: SettingsStore;
  private keys: UserApiKeys = {};
  private listeners: Set<(keys: UserApiKeys) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.keys = JSON.parse(raw);
        }
      }
    } catch (err) {
      console.warn('[SettingsStore] Failed to parse local settings:', err);
      this.keys = {};
    }

    // Fallback: Check if environment variable was injected for Gemini
    if (!this.keys.geminiApiKey && typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      this.keys.geminiApiKey = process.env.GEMINI_API_KEY;
    }
  }

  public getKeys(): UserApiKeys {
    return { ...this.keys };
  }

  public getApiKey(provider: LLMProvider): string | undefined {
    switch (provider) {
      case 'gemini':
        return this.keys.geminiApiKey?.trim();
      case 'openai':
        return this.keys.openaiApiKey?.trim();
      case 'anthropic':
        return this.keys.anthropicApiKey?.trim();
      default:
        return undefined;
    }
  }

  public hasKey(provider: LLMProvider): boolean {
    const key = this.getApiKey(provider);
    return Boolean(key && key.length > 5);
  }

  public setApiKey(provider: LLMProvider, key: string): void {
    const trimmed = key.trim();
    if (provider === 'gemini') this.keys.geminiApiKey = trimmed;
    if (provider === 'openai') this.keys.openaiApiKey = trimmed;
    if (provider === 'anthropic') this.keys.anthropicApiKey = trimmed;
    this.persist();
  }

  public saveAllKeys(newKeys: Partial<UserApiKeys>): void {
    this.keys = {
      ...this.keys,
      ...newKeys,
    };
    this.persist();
  }

  public clearAllKeys(): void {
    this.keys = {};
    this.persist();
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keys));
      }
    } catch (err) {
      console.error('[SettingsStore] Could not persist keys to localStorage:', err);
    }
    this.notify();
  }

  public subscribe(listener: (keys: UserApiKeys) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.keys });
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
        maskedKey: mask(this.keys.geminiApiKey),
      },
      {
        provider: 'openai',
        name: 'OpenAI (GPT-4o)',
        configured: this.hasKey('openai'),
        maskedKey: mask(this.keys.openaiApiKey),
      },
      {
        provider: 'anthropic',
        name: 'Anthropic (Claude 3.7)',
        configured: this.hasKey('anthropic'),
        maskedKey: mask(this.keys.anthropicApiKey),
      },
    ];
  }

  /**
   * Lightweight API ping to verify validity of Gemini API key before saving
   */
  public async testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 8) {
      return { success: false, message: 'Invalid API key format. Key is too short.' };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Respond with the word "CONNECTED" only.',
      });

      if (response && response.text) {
        return {
          success: true,
          message: 'Connection verified successfully! Gemini is ready.',
        };
      }
      return { success: false, message: 'Received empty response from Gemini API.' };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'API connection failed. Please check key validity and network access.',
      };
    }
  }
}
