/**
 * Central Server-Side AI Service
 * Strictly executes on the Node.js server.
 * Reads API keys exclusively from server-side environment variables.
 * Never leaks credentials to client code or browser memory.
 */

import { handleFallbackSynthesis } from './fallbackEngine.ts';

export interface AiCompletionOptions {
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface ServerAiConfig {
  provider: 'gemini' | 'openai' | 'openrouter';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

import fs from 'node:fs';
import path from 'node:path';

function getLiveEnv(): Record<string, string> {
  const merged: Record<string, string> = { ...process.env } as any;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (key && val) {
            merged[key] = val;
          }
        }
      }
    }
  } catch {}
  return merged;
}

/**
 * Resolves the active server-side AI configuration from Node process.env and live .env file.
 */
export function getServerAiConfig(): ServerAiConfig {
  const env = getLiveEnv();

  const genericKey = env.AI_API_KEY || '';
  const geminiKey = env.GEMINI_API_KEY || (genericKey.startsWith('AIzaSy') ? genericKey : '');
  const openRouterKey = env.OPENROUTER_API_KEY || (genericKey.startsWith('sk-or-') ? genericKey : '');
  const openAiKey = env.OPENAI_API_KEY || (genericKey.startsWith('sk-') && !genericKey.startsWith('sk-or-') ? genericKey : '');

  let provider: 'gemini' | 'openai' | 'openrouter' = 'gemini';
  let apiKey = genericKey || geminiKey || openRouterKey || openAiKey;
  let model = env.AI_MODEL || '';
  let baseUrl = env.AI_BASE_URL || '';

  if (env.AI_PROVIDER) {
    const prov = env.AI_PROVIDER.toLowerCase();
    if (prov === 'openrouter') {
      provider = 'openrouter';
      apiKey = openRouterKey || genericKey;
      model = model || env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
    } else if (prov === 'openai') {
      provider = 'openai';
      apiKey = openAiKey || genericKey;
      model = model || 'gpt-4o-mini';
    } else {
      provider = 'gemini';
      apiKey = geminiKey || genericKey;
      model = model || env.GEMINI_MODEL || 'gemini-1.5-flash';
    }
  } else {
    // Intelligent auto-detection based on key prefix & specific env vars
    if (openRouterKey || genericKey.startsWith('sk-or-')) {
      provider = 'openrouter';
      apiKey = openRouterKey || genericKey;
      model = model || env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
    } else if (openAiKey || (genericKey.startsWith('sk-') && !genericKey.startsWith('sk-or-'))) {
      provider = 'openai';
      apiKey = openAiKey || genericKey;
      model = model || 'gpt-4o-mini';
    } else {
      provider = 'gemini';
      apiKey = geminiKey || genericKey;
      model = model || env.GEMINI_MODEL || 'gemini-1.5-flash';
    }
  }

  return { provider, apiKey, model, baseUrl };
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from model output.
 */
export function sanitizeJsonResponse(text: string): string {
  if (!text) return '{}';
  let cleaned = text.trim();
  // Remove markdown blocks ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

/**
 * Execute AI completion using the configured provider.
 */
export async function generateCompletion(
  prompt: string,
  systemPrompt?: string,
  options: AiCompletionOptions = {}
): Promise<string> {
  const config = getServerAiConfig();
  const { temperature = 0.7, jsonMode = true, timeoutMs = 45000 } = options;

  if (!config.apiKey) {
    console.info('[AI Service] No external API key found; running on built-in placement synthesis engine.');
    return handleFallbackSynthesis(prompt, systemPrompt);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (config.provider === 'gemini') {
      return await callGemini(prompt, systemPrompt, config, temperature, jsonMode, controller.signal);
    } else if (config.provider === 'openrouter') {
      return await callOpenRouter(prompt, systemPrompt, config, temperature, jsonMode, controller.signal);
    } else {
      return await callOpenAi(prompt, systemPrompt, config, temperature, jsonMode, controller.signal);
    }
  } catch (err: any) {
    console.warn(`[AI Service] Remote provider error (${err.message}). Activating resilient fallback synthesis.`);
    return handleFallbackSynthesis(prompt, systemPrompt);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Google Gemini Provider Implementation
 */
async function callGemini(
  prompt: string,
  systemPrompt: string | undefined,
  config: ServerAiConfig,
  temperature: number,
  jsonMode: boolean,
  signal: AbortSignal
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const contents: any[] = [];
  if (systemPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instructions]: ${systemPrompt}` }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const bodyPayload: any = {
    contents,
    generationConfig: {
      temperature,
    },
  };

  if (jsonMode) {
    bodyPayload.generationConfig.responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Gemini API returned status ${res.status}`;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data: any = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  return jsonMode ? sanitizeJsonResponse(text) : text;
}

/**
 * OpenAI Provider Implementation
 */
async function callOpenAi(
  prompt: string,
  systemPrompt: string | undefined,
  config: ServerAiConfig,
  temperature: number,
  jsonMode: boolean,
  signal: AbortSignal
): Promise<string> {
  const url = config.baseUrl || 'https://api.openai.com/v1/chat/completions';

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload: any = {
    model: config.model,
    messages,
    temperature,
  };

  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `OpenAI API returned status ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return jsonMode ? sanitizeJsonResponse(content) : content;
}

/**
 * OpenRouter Provider Implementation
 */
async function callOpenRouter(
  prompt: string,
  systemPrompt: string | undefined,
  config: ServerAiConfig,
  temperature: number,
  jsonMode: boolean,
  signal: AbortSignal
): Promise<string> {
  const url = config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload: any = {
    model: config.model,
    messages,
    temperature,
  };

  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://aimockinterviewer.internal',
      'X-Title': 'AI Mock Interviewer Platform',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `OpenRouter API returned status ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI returned an empty response.');
  }

  return jsonMode ? sanitizeJsonResponse(content) : content;
}
