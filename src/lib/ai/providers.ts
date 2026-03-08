// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Unified AI Provider Service
// Supports: Gemini, Claude (Anthropic), OpenAI/ChatGPT, Groq
// All keys stored client-side (BYOK) — never sent to our servers
// ═══════════════════════════════════════════════════════════════════════════════

export type AIProvider = 'gemini' | 'claude' | 'openai' | 'groq';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  provider: AIProvider;
  apiKey: string;
  messages: AIMessage[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

// ── Default models per provider ────────────────────────────────────────────────
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini:  'gemini-1.5-flash',
  claude:  'claude-haiku-4-5-20251001',
  openai:  'gpt-4o-mini',
  groq:    'llama-3.3-70b-versatile',
};

export const PROVIDER_DISPLAY: Record<AIProvider, { name: string; color: string; badge: string }> = {
  gemini: { name: 'Gemini',   color: '#4285f4', badge: 'Google' },
  claude: { name: 'Claude',   color: '#d97706', badge: 'Anthropic' },
  openai: { name: 'ChatGPT',  color: '#10b981', badge: 'OpenAI' },
  groq:   { name: 'Groq',     color: '#f43f5e', badge: 'Llama 3.3' },
};

// ── Gemini ─────────────────────────────────────────────────────────────────────
async function callGemini(opts: AIRequestOptions): Promise<AIResponse> {
  const model = opts.model ?? DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;

  const contents = opts.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (opts.systemPrompt) {
    body.systemInstruction = { parts: [{ text: opts.systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return { text, provider: 'gemini', model };
}

// ── Claude (Anthropic) ─────────────────────────────────────────────────────────
async function callClaude(opts: AIRequestOptions): Promise<AIResponse> {
  const model = opts.model ?? DEFAULT_MODELS.claude;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 512,
      system: opts.systemPrompt,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { content?: { text?: string }[]; usage?: { output_tokens?: number } };
  const text = data.content?.[0]?.text ?? '';
  return { text, provider: 'claude', model, tokensUsed: data.usage?.output_tokens };
}

// ── OpenAI ─────────────────────────────────────────────────────────────────────
async function callOpenAI(opts: AIRequestOptions): Promise<AIResponse> {
  const model = opts.model ?? DEFAULT_MODELS.openai;
  const messages: { role: string; content: string }[] = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push(...opts.messages.map((m) => ({ role: m.role, content: m.content })));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.8,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[]; usage?: { completion_tokens?: number } };
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, provider: 'openai', model, tokensUsed: data.usage?.completion_tokens };
}

// ── Groq ───────────────────────────────────────────────────────────────────────
async function callGroq(opts: AIRequestOptions): Promise<AIResponse> {
  const model = opts.model ?? DEFAULT_MODELS.groq;
  const messages: { role: string; content: string }[] = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push(...opts.messages.map((m) => ({ role: m.role, content: m.content })));

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.8,
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[]; usage?: { completion_tokens?: number } };
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, provider: 'groq', model, tokensUsed: data.usage?.completion_tokens };
}

// ── Unified call ───────────────────────────────────────────────────────────────
export async function callAI(opts: AIRequestOptions): Promise<AIResponse> {
  switch (opts.provider) {
    case 'gemini': return callGemini(opts);
    case 'claude': return callClaude(opts);
    case 'openai': return callOpenAI(opts);
    case 'groq':   return callGroq(opts);
    default:       throw new Error(`Unknown AI provider: ${opts.provider}`);
  }
}

// ── Available models per provider ──────────────────────────────────────────────
export const PROVIDER_MODELS: Record<AIProvider, { id: string; label: string; fast?: boolean }[]> = {
  gemini: [
    { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash', fast: true },
    { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash', fast: true },
  ],
  claude: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', fast: true },
    { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6' },
  ],
  openai: [
    { id: 'gpt-4o-mini',   label: 'GPT-4o Mini', fast: true },
    { id: 'gpt-4o',        label: 'GPT-4o' },
    { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', fast: true },
    { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (instant)', fast: true },
    { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B' },
  ],
};

// ── Key validation (simple non-null check) ─────────────────────────────────────
export function isValidKey(provider: AIProvider, key: string): boolean {
  if (!key || key.length < 10) return false;
  const prefixes: Record<AIProvider, string> = {
    gemini: 'AI',
    claude: 'sk-ant-',
    openai: 'sk-',
    groq:   'gsk_',
  };
  return key.startsWith(prefixes[provider]);
}

export const PROVIDER_KEY_HELP: Record<AIProvider, { placeholder: string; link: string; linkLabel: string }> = {
  gemini: {
    placeholder: 'AIza...',
    link: 'https://aistudio.google.com/app/apikey',
    linkLabel: 'Get key from Google AI Studio',
  },
  claude: {
    placeholder: 'sk-ant-...',
    link: 'https://console.anthropic.com/settings/keys',
    linkLabel: 'Get key from Anthropic Console',
  },
  openai: {
    placeholder: 'sk-...',
    link: 'https://platform.openai.com/api-keys',
    linkLabel: 'Get key from OpenAI Platform',
  },
  groq: {
    placeholder: 'gsk_...',
    link: 'https://console.groq.com/keys',
    linkLabel: 'Get key from Groq Console',
  },
};
