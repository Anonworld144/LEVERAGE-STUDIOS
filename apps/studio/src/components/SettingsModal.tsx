/**
 * Leverage Studios - Local Settings Modal (BYOK Model)
 * Allows users to configure and manage their own API keys locally on device.
 * Includes real-time provider status badges and connection verification.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { SettingsStore, UserApiKeys } from '@leverage/core';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const settingsStore = SettingsStore.getInstance();

  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');

  const [showGemini, setShowGemini] = useState<boolean>(false);
  const [showOpenai, setShowOpenai] = useState<boolean>(false);
  const [showAnthropic, setShowAnthropic] = useState<boolean>(false);

  const [isTestingGemini, setIsTestingGemini] = useState<boolean>(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const keys = settingsStore.getKeys();
      setGeminiKey(keys.geminiApiKey || '');
      setOpenaiKey(keys.openaiApiKey || '');
      setAnthropicKey(keys.anthropicApiKey || '');
      setGeminiTestResult(null);
      setSavedSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    settingsStore.saveAllKeys({
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
      anthropicApiKey: anthropicKey.trim(),
    });
    setSavedSuccessMessage('Settings saved locally. Your agents can now execute live synthesis.');
    setTimeout(() => {
      setSavedSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await settingsStore.testGeminiConnection(geminiKey);
      setGeminiTestResult(res);
    } finally {
      setIsTestingGemini(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-[#232a3b] bg-[#10131d] p-6 shadow-2xl text-[#e1e4ea] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f2536] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Provider Settings (BYOK)</h2>
              <p className="text-xs text-neutral-400">Bring Your Own Key · Keys are stored locally on your device only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1a1f2c] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Local Security Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <span className="font-semibold text-emerald-200">Zero-Egress Security Model: </span>
            Your API keys are saved directly into your local client keystore. They never pass through any telemetry server or intermediary proxy.
          </div>
        </div>

        {/* Input Fields */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Gemini API Key */}
          <div className="rounded-xl border border-[#1f2536] bg-[#0c0e15] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-white flex items-center gap-2">
                <span>Google Gemini API Key</span>
                <span className="text-[10px] text-indigo-400 font-mono">(Recommended for Coder Agent)</span>
              </label>

              {/* Status Badge */}
              {geminiKey.trim().length > 5 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Key Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Key Missing
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showGemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full rounded-lg bg-[#141824] border border-[#232a3b] px-3 py-2 pr-20 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="p-1 text-neutral-400 hover:text-white"
                  title={showGemini ? 'Hide key' : 'Show key'}
                >
                  {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-neutral-500">
                Powers Vulcan Coder, Hephaestus Debugger, and real-time streaming diffs.
              </span>
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={isTestingGemini || geminiKey.trim().length < 8}
                className="flex items-center gap-1 rounded bg-[#1c2233] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#252d43] hover:text-white disabled:opacity-40 transition-colors"
              >
                {isTestingGemini ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" /> Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 text-amber-400" /> Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Test connection result message */}
            {geminiTestResult && (
              <div
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-[11px] ${
                  geminiTestResult.success
                    ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-800/40'
                    : 'bg-rose-950/30 text-rose-300 border border-rose-800/40'
                }`}
              >
                {geminiTestResult.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                )}
                <span>{geminiTestResult.message}</span>
              </div>
            )}
          </div>

          {/* OpenAI API Key */}
          <div className="rounded-xl border border-[#1f2536] bg-[#0c0e15] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-white">OpenAI API Key (GPT-4o)</label>
              {openaiKey.trim().length > 5 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Key Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Key Missing
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type={showOpenai ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full rounded-lg bg-[#141824] border border-[#232a3b] px-3 py-2 pr-10 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 text-neutral-400 hover:text-white"
                title={showOpenai ? 'Hide key' : 'Show key'}
              >
                {showOpenai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Anthropic API Key */}
          <div className="rounded-xl border border-[#1f2536] bg-[#0c0e15] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-white">Anthropic API Key (Claude 3.7)</label>
              {anthropicKey.trim().length > 5 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Key Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Key Missing
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type={showAnthropic ? 'text' : 'password'}
                placeholder="sk-ant-api03-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full rounded-lg bg-[#141824] border border-[#232a3b] px-3 py-2 pr-10 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 text-neutral-400 hover:text-white"
                title={showAnthropic ? 'Hide key' : 'Show key'}
              >
                {showAnthropic ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-[#1f2536] pt-4">
          <div className="text-[11px] text-neutral-400">
            {savedSuccessMessage ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> {savedSuccessMessage}
              </span>
            ) : (
              <span>Keys are immediately active in the agent runtime</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-1.5 text-xs text-neutral-400 hover:bg-[#1a1f2c] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
