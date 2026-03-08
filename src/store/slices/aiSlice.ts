// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Slice
// Multi-provider AI keys (Gemini, Claude, OpenAI, Groq) stored client-side
// ═══════════════════════════════════════════════════════════════════════════════

import type { AIProvider } from "@lib/ai/providers";
import type { StateCreator } from "zustand";

export interface AiSlice {
  /** Active AI provider for the coach chat */
  aiProvider: AIProvider;
  /** Selected model per provider (empty = use default) */
  aiModel: string;
  /** User-provided API keys keyed by provider */
  apiKeys: Record<AIProvider, string>;
  /** Legacy Gemini key alias (kept for backwards-compat) */
  geminiApiKey: string;
  /** Whether to use Gemini Vision for video analysis */
  useGeminiVision: boolean;
  /** Whether to fall back to Cloud AI when on-device fails */
  allowCloudAi: boolean;
  /** Number of training samples collected from AI feedback */
  feedbackDataCount: number;

  setAiProvider: (p: AIProvider) => void;
  setAiModel: (model: string) => void;
  setApiKey: (provider: AIProvider, key: string) => void;
  clearApiKey: (provider: AIProvider) => void;
  /** Legacy compat */
  setGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;
  toggleGeminiVision: () => void;
  toggleCloudAi: () => void;
  incrementFeedbackData: (count: number) => void;
}

export const createAiSlice: StateCreator<
  AiSlice,
  [["zustand/immer", never]]
> = (set) => ({
  aiProvider: "gemini",
  aiModel: "",
  apiKeys: { gemini: "", claude: "", openai: "", groq: "" },
  geminiApiKey: "",
  useGeminiVision: true,
  allowCloudAi: true,
  feedbackDataCount: 0,

  setAiProvider: (p) =>
    set((s) => { s.aiProvider = p; s.aiModel = ""; }),

  setAiModel: (model) =>
    set((s) => { s.aiModel = model; }),

  setApiKey: (provider, key) =>
    set((s) => {
      s.apiKeys[provider] = key;
      if (provider === "gemini") s.geminiApiKey = key; // sync legacy
    }),

  clearApiKey: (provider) =>
    set((s) => {
      s.apiKeys[provider] = "";
      if (provider === "gemini") s.geminiApiKey = "";
    }),

  setGeminiApiKey: (key) =>
    set((s) => { s.geminiApiKey = key; s.apiKeys.gemini = key; }),

  clearGeminiApiKey: () =>
    set((s) => { s.geminiApiKey = ""; s.apiKeys.gemini = ""; }),

  toggleGeminiVision: () =>
    set((s) => { s.useGeminiVision = !s.useGeminiVision; }),

  toggleCloudAi: () =>
    set((s) => { s.allowCloudAi = !s.allowCloudAi; }),

  incrementFeedbackData: (count) =>
    set((s) => { s.feedbackDataCount += count; }),
});
