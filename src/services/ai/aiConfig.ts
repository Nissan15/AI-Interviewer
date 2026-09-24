export class AiServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

export interface AiRequestOptions {
  provider?: 'gemini' | 'openai' | 'custom_backend';
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export const getEffectiveAiConfig = (): {
  provider: string;
  apiKey: string;
  endpoint: string;
  model: string;
  isConfigured: boolean;
} => {
  // Check localStorage settings first, fallback to environment variables
  let storedSettings: any = {};
  try {
    const raw = localStorage.getItem('ai_mock_interviewer_settings');
    if (raw) storedSettings = JSON.parse(raw);
  } catch (e) {
    // Ignore
  }

  const envGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const envOpenAiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
  const envBackendUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const provider = storedSettings.aiProvider || (envGeminiKey ? 'gemini' : envOpenAiKey ? 'openai' : 'gemini');
  const apiKey = (storedSettings.apiKey || (provider === 'gemini' ? envGeminiKey : envOpenAiKey) || '').trim();
  const endpoint = (storedSettings.customApiUrl || envBackendUrl).trim();
  const model = storedSettings.selectedModel || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

  const isConfigured = Boolean(apiKey || (provider === 'custom_backend' && endpoint));

  return {
    provider,
    apiKey,
    endpoint,
    model,
    isConfigured,
  };
};

export const callLlmApi = async (
  prompt: string,
  systemPrompt?: string,
  options?: AiRequestOptions
): Promise<string> => {
  const config = {
    ...getEffectiveAiConfig(),
    ...options,
  };

  if (!config.isConfigured && !config.apiKey) {
    throw new AiServiceError(
      'AI service is not configured. Please configure your API key in Settings to activate AI generation.',
      'AI_NOT_CONFIGURED'
    );
  }

  if (config.provider === 'gemini') {
    return callGemini(prompt, systemPrompt, config.apiKey, config.model);
  } else if (config.provider === 'openai') {
    return callOpenAi(prompt, systemPrompt, config.apiKey, config.model);
  } else {
    return callCustomBackend(prompt, systemPrompt, config.endpoint);
  }
};

async function callGemini(
  prompt: string,
  systemPrompt?: string,
  apiKey?: string,
  model: string = 'gemini-1.5-flash'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let message = `Gemini API error (${response.status})`;
    try {
      const parsed = JSON.parse(errBody);
      message = parsed.error?.message || message;
    } catch {}
    throw new AiServiceError(message, 'API_ERROR');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AiServiceError('Empty response received from AI model.', 'EMPTY_RESPONSE');
  }
  return text;
}

async function callOpenAi(
  prompt: string,
  systemPrompt?: string,
  apiKey?: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let message = `OpenAI API error (${response.status})`;
    try {
      const parsed = JSON.parse(errBody);
      message = parsed.error?.message || message;
    } catch {}
    throw new AiServiceError(message, 'API_ERROR');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new AiServiceError('Empty response received from AI model.', 'EMPTY_RESPONSE');
  }
  return text;
}

async function callCustomBackend(prompt: string, systemPrompt?: string, endpoint?: string): Promise<string> {
  const url = `${endpoint}/ai/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  });

  if (!response.ok) {
    throw new AiServiceError(`Custom backend error (${response.status})`, 'BACKEND_ERROR');
  }

  const data = await response.json();
  return typeof data === 'string' ? data : JSON.stringify(data);
}
