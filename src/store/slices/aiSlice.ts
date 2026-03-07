// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Slice
// Manages user-provided Gemini API key and AI vision preferences.
// ═══════════════════════════════════════════════════════════════════════════════

import type { StateCreator } from "zustand";

export interface AiSlice {
  /** User-provided Gemini API key (stored in localStorage) */
  geminiApiKey: string;
  /** Whether to use Gemini Vision for video analysis */
  useGeminiVision: boolean;
  /** Whether to fall back to Cloud Gemini when On-Device/Nano fail (Privacy toggle) */
  allowCloudAi: boolean;
  /** Number of training samples collected from Gemini feedback */
  feedbackDataCount: number;

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
  geminiApiKey: "",
  useGeminiVision: true,
  allowCloudAi: true,
  feedbackDataCount: 0,

  setGeminiApiKey: (key: string) =>
    set((s) => {
      s.geminiApiKey = key;
    }),

  clearGeminiApiKey: () =>
    set((s) => {
      s.geminiApiKey = "";
    }),

  toggleGeminiVision: () =>
    set((s) => {
      s.useGeminiVision = !s.useGeminiVision;
    }),

  toggleCloudAi: () =>
    set((s) => {
      s.allowCloudAi = !s.allowCloudAi;
    }),

  incrementFeedbackData: (count: number) =>
    set((s) => {
      s.feedbackDataCount += count;
    }),
});
