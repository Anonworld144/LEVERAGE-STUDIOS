/**
 * Leverage Studios - Agent Execution & LLM Proxy Route
 * Next.js App Router API Route: /api/agent/run
 * Prevents client-side API key leakage by running model inference server-side.
 */

import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action = 'generate',
      prompt,
      instruction,
      filePath,
      originalContent,
      systemPrompt = 'You are a senior staff engineer operating in Leverage Studios.',
      model = 'gemini-2.5-flash',
      userApiKey,
    } = body;

    // Config verification action
    if (action === 'check_config') {
      const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
      return Response.json({
        success: true,
        hasServerKey,
        supportedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'claude-3-7-sonnet'],
      });
    }

    // Determine target API key (prefer server environment variable, fallback to authorized client BYOK)
    const effectiveKey = (process.env.GEMINI_API_KEY || userApiKey || '').trim();

    if (!effectiveKey) {
      return Response.json(
        {
          success: false,
          error: 'No API key configured. Provide GEMINI_API_KEY in server environment or enter your key in Settings.',
        },
        { status: 401 }
      );
    }

    // Compose prompt text
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
      return Response.json(
        { success: false, error: 'Request payload must include prompt or instruction.' },
        { status: 400 }
      );
    }

    // Perform secure server-side LLM call via @google/genai
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const outputText = response.text || '';

    return Response.json({
      success: true,
      text: outputText,
      model: model,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('[/api/agent/run] Execution failure:', err);
    return Response.json(
      {
        success: false,
        error: err?.message || 'Server-side agent execution failed.',
      },
      { status: 500 }
    );
  }
}
