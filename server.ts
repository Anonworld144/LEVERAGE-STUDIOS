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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Proxy Route: /api/agent/run
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
      } = req.body;

      if (action === 'check_config') {
        const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
        return res.json({
          success: true,
          hasServerKey,
          supportedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'claude-3-7-sonnet'],
        });
      }

      const effectiveKey = (process.env.GEMINI_API_KEY || userApiKey || '').trim();
      if (!effectiveKey) {
        return res.status(401).json({
          success: false,
          error: 'No API key configured. Provide GEMINI_API_KEY in server environment or configure via Settings.',
        });
      }

      let fullPrompt = prompt || '';
      if (!fullPrompt && instruction) {
        fullPrompt = `
FILE PATH: ${filePath || 'untitled'}

INSTRUCTION:
${instruction}

EXISTING FILE CONTENT:
\`\`\`
${originalContent || ''}
\`\`\`

REQUIREMENTS:
1. Return ONLY the complete updated code content.
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
        model: model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      return res.json({
        success: true,
        text: response.text || '',
        model: model,
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

  // Vite development middleware or production static serving
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
