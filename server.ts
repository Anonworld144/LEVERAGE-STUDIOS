/**
 * Leverage Studios - Backend Server
 * Express entry point mounting /api/agent/run LLM proxy and Vite middleware.
 */

import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_PROMPT_CHARS = 64 * 1024;
const ALLOW_CLIENT_API_KEYS = process.env.ALLOW_CLIENT_API_KEYS === 'true';

function sanitizePromptText(value: string | undefined, fallback = ''): string {
  const raw = typeof value === 'string' ? value : fallback;
  return raw.slice(0, MAX_PROMPT_CHARS).replace(/```/g, '```\u200B');
}

function parseDiffs(rawText: string, fallbackPath: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return [{ filePath: fallbackPath, modifiedContent: '' }];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed?.diffs)) {
      return parsed.diffs
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          filePath: String(item.filePath || fallbackPath),
          modifiedContent: String(item.modifiedContent ?? ''),
        }));
    }
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        filePath: String(item.filePath || fallbackPath),
        modifiedContent: String(item.modifiedContent ?? item.text ?? ''),
      }));
    }
    if (parsed && typeof parsed === 'object' && typeof parsed.modifiedContent === 'string') {
      return [{ filePath: String(parsed.filePath || fallbackPath), modifiedContent: parsed.modifiedContent }];
    }
  } catch {
    // Fall through to code-fence parsing below.
  }

  const maybeFenced = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  const codeSegment = maybeFenced ? maybeFenced[1] : trimmed;
  const normalized = codeSegment
    .replace(/^```[a-zA-Z0-9_-]*\n?/, '')
    .replace(/```$/, '')
    .trim();

  return [{ filePath: fallbackPath, modifiedContent: normalized }];
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  app.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 60;
    const key = String(ip);
    const globalStore = (globalThis as any).__leverageRateMap ?? new Map<string, number[]>();
    (globalThis as any).__leverageRateMap = globalStore;

    const bucket = globalStore.get(key) || [];
    const recent = bucket.filter((ts: number) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
    }

    recent.push(now);
    globalStore.set(key, recent);
    next();
  });

  app.post('/api/agent/run', async (req: Request, res: Response) => {
    try {
      const {
        action = 'generate',
        prompt,
        instruction,
        filePath,
        originalContent,
        systemPrompt = 'You are a senior staff engineer operating in Leverage Studios.',
        model = 'gemini-2.5-flash',
        userApiKey,
      } = req.body ?? {};

      if (action === 'check_config') {
        const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
        return res.json({
          success: true,
          hasServerKey,
          supportedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'claude-3-7-sonnet'],
        });
      }

      const allowedModels = new Set(['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'claude-3-7-sonnet']);
      if (!allowedModels.has(model)) {
        return res.status(400).json({ success: false, error: 'Requested model is not allowed by this proxy.' });
      }

      const serverKey = (process.env.GEMINI_API_KEY || '').trim();
      const trustedClientKey = ALLOW_CLIENT_API_KEYS ? (typeof userApiKey === 'string' ? userApiKey.trim() : '') : '';
      const effectiveKey = serverKey || trustedClientKey;

      if (!effectiveKey) {
        return res.status(401).json({
          success: false,
          error: 'No API key configured. Set GEMINI_API_KEY in the server environment or enable authenticated user keys.',
        });
      }

      let fullPrompt = sanitizePromptText(prompt, '');
      if (!fullPrompt && instruction) {
        fullPrompt = `
FILE PATH: ${sanitizePromptText(filePath, 'untitled')}

INSTRUCTION:
${sanitizePromptText(instruction, '')}

EXISTING FILE CONTENT:
\`\`\`
${sanitizePromptText(originalContent, '')}
\`\`\`

REQUIREMENTS:
1. Return ONLY a JSON object matching { "diffs": [{ "filePath": "...", "modifiedContent": "..." }] }.
2. Keep strong typing, exports, and syntax invariants.
3. Do not include introductory or concluding conversational prose.
`;
      }

      if (!fullPrompt) {
        return res.status(400).json({
          success: false,
          error: 'Request payload must include prompt or instruction.',
        });
      }

      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: { systemInstruction: systemPrompt },
      });

      const rawText = response.text || '';
      const diffs = parseDiffs(rawText, filePath || 'generated-file.ts');

      return res.json({
        success: true,
        diffs,
        text: rawText,
        model,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('[/api/agent/run] Proxy error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Server-side agent execution failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Leverage Studios] Running on port ${PORT}`);
  });
}

startServer();
