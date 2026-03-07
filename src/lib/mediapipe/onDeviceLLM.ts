// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — On-Device LLM (Gemma 3 via MediaPipe Tasks GenAI)
// Supports Gemma 3 1B / 4B with optional LoRA adapters.
// Falls back to cloud Gemini 3 when WebGPU unavailable.
// ═══════════════════════════════════════════════════════════════════════════════

import type { DisciplineId, SubDisciplineId } from "@types";

// ─── DEVICE CAPABILITY DETECTION ─────────────────────────────────────────────

export interface DeviceCapabilities {
  hasWebGPU: boolean;
  hasWebNN: boolean;
  gpuAdapterName: string;
  estimatedVRAMGB: number;
  canRunGemma3_1B: boolean;
  canRunGemma3_4B: boolean;
  recommendedModel: OnDeviceModelId | "cloud";
  backend: "webgpu" | "webnn" | "cloud";
}

export type OnDeviceModelId =
  | "gemma-3-1b-int4"
  | "gemma-3-1b-int8"
  | "gemma-3-4b-int4";

export const ON_DEVICE_MODELS: Record<
  OnDeviceModelId,
  { url: string; sizeGB: number; quality: string; minVRAMGB: number }
> = {
  "gemma-3-1b-int4": {
    url: "https://storage.googleapis.com/mediapipe-models/llm_inference/gemma3-1b-it-int4/float32/latest/gemma3-1b-it-int4.task",
    sizeGB: 0.7,
    quality: "Gemma 3 1B — fast, lightweight (INT4)",
    minVRAMGB: 1.5,
  },
  "gemma-3-1b-int8": {
    url: "https://storage.googleapis.com/mediapipe-models/llm_inference/gemma3-1b-it-int8/float32/latest/gemma3-1b-it-int8.task",
    sizeGB: 1.4,
    quality: "Gemma 3 1B — balanced quality (INT8)",
    minVRAMGB: 2.5,
  },
  "gemma-3-4b-int4": {
    url: "https://storage.googleapis.com/mediapipe-models/llm_inference/gemma3-4b-it-int4/float32/latest/gemma3-4b-it-int4.task",
    sizeGB: 2.5,
    quality: "Gemma 3 4B — highest on-device quality (INT4)",
    minVRAMGB: 4,
  },
};

// ─── LoRA ADAPTERS ────────────────────────────────────────────────────────────
// Fine-tuned LoRA weights for discipline-specific coaching.
// Can be loaded dynamically after base model.

export interface LoRAAdapter {
  name: string;
  url: string;
  discipline: string;
  sizeMB: number;
}

export const LORA_ADAPTERS: LoRAAdapter[] = [
  // Placeholder URLs — replace with your trained adapter files
  {
    name: "dance-coach",
    url: "/models/lora/dance-coach.task",
    discipline: "dance",
    sizeMB: 50,
  },
  {
    name: "boxing-coach",
    url: "/models/lora/boxing-coach.task",
    discipline: "boxing",
    sizeMB: 50,
  },
  {
    name: "yoga-coach",
    url: "/models/lora/yoga-coach.task",
    discipline: "yoga",
    sizeMB: 50,
  },
  {
    name: "martial-coach",
    url: "/models/lora/martial-coach.task",
    discipline: "martialarts",
    sizeMB: 50,
  },
  {
    name: "fitness-coach",
    url: "/models/lora/fitness-coach.task",
    discipline: "fitness",
    sizeMB: 50,
  },
  {
    name: "gym-coach",
    url: "/models/lora/gym-coach.task",
    discipline: "bodybuilding",
    sizeMB: 50,
  },
];

let _activeLoRA: string | null = null;

// ─── MODULE STATE (functional singleton) ──────────────────────────────────────

let _capCache: DeviceCapabilities | null = null;
let _llm: any = null;
let _isLoaded = false;
let _isLoading = false;
let _loadProgress = 0;
const _progressCallbacks: ((progress: number, msg: string) => void)[] = [];
const _responseCache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// ─── CAPABILITY DETECTION ─────────────────────────────────────────────────────

export const detectDeviceCapabilities =
  async (): Promise<DeviceCapabilities> => {
    if (_capCache) return _capCache;

    const hasWebGPU = "gpu" in navigator;
    const hasWebNN = "ml" in navigator;
    let gpuAdapterName = "Unknown";
    let estimatedVRAMGB = 0;

    if (hasWebGPU) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter({
          powerPreference: "high-performance",
        });
        if (adapter) {
          const info = await adapter.requestAdapterInfo?.();
          gpuAdapterName = info?.description ?? info?.vendor ?? "GPU";
          const desc = gpuAdapterName.toLowerCase();
          estimatedVRAMGB = /nvidia|rtx|gtx|amd|radeon/i.test(desc)
            ? 8
            : /apple|m[1-5]/i.test(desc)
              ? 4
              : /intel|arc/i.test(desc)
                ? 3
                : 2;
        }
      } catch {
        estimatedVRAMGB = 0;
      }
    }

    const canRunGemma3_1B = hasWebGPU && estimatedVRAMGB >= 1.5;
    const canRunGemma3_4B = hasWebGPU && estimatedVRAMGB >= 4;
    const recommendedModel: OnDeviceModelId | "cloud" = canRunGemma3_4B
      ? "gemma-3-4b-int4"
      : canRunGemma3_1B && estimatedVRAMGB >= 2.5
        ? "gemma-3-1b-int8"
        : canRunGemma3_1B
          ? "gemma-3-1b-int4"
          : "cloud";
    const backend = hasWebGPU ? "webgpu" : hasWebNN ? "webnn" : "cloud";

    _capCache = {
      hasWebGPU,
      hasWebNN,
      gpuAdapterName,
      estimatedVRAMGB,
      canRunGemma3_1B,
      canRunGemma3_4B,
      recommendedModel,
      backend,
    };

    return _capCache;
  };

// ─── PROGRESS CALLBACKS ───────────────────────────────────────────────────────

export const onLLMProgress = (
  cb: (progress: number, msg: string) => void,
): void => {
  _progressCallbacks.push(cb);
};

const emitProgress = (progress: number, msg: string): void => {
  _loadProgress = progress;
  _progressCallbacks.forEach((cb) => cb(progress, msg));
};

// ─── LOAD ─────────────────────────────────────────────────────────────────────

export const loadOnDeviceLLM = async (
  override?: OnDeviceModelId,
): Promise<boolean> => {
  if (_isLoaded) return true;
  if (_isLoading) return false;

  const caps = await detectDeviceCapabilities();
  const modelId =
    override ??
    (caps.recommendedModel === "cloud" ? null : caps.recommendedModel);
  if (!modelId) {
    console.info("[OnDeviceLLM] No capable GPU — using cloud Gemini");
    return false;
  }

  _isLoading = true;
  emitProgress(0.05, "Loading MediaPipe GenAI runtime…");

  try {
    // Dynamic import so bundle doesn't include it unless needed
    const { LlmInference, FilesetResolver } =
      await import("@mediapipe/tasks-genai");
    emitProgress(
      0.3,
      `Downloading Gemma 3 ${modelId} (${ON_DEVICE_MODELS[modelId].sizeGB}GB)…`,
    );

    const fileset = await FilesetResolver.forGenAiTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm",
    );

    _llm = await LlmInference.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: ON_DEVICE_MODELS[modelId].url },
      maxTokens: 512,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    });

    _isLoaded = true;
    _isLoading = false;
    emitProgress(1.0, `Gemma 3 ${modelId} ready ✓`);
    return true;
  } catch (err) {
    console.warn(
      "[OnDeviceLLM] Gemma 3 load failed — falling back to cloud:",
      err,
    );
    _isLoading = false;
    emitProgress(0, "On-device unavailable");
    return false;
  }
};

// ─── LoRA LOADING ─────────────────────────────────────────────────────────────

export const loadLoRA = async (discipline: string): Promise<boolean> => {
  if (!_isLoaded || !_llm) return false;

  const adapter = LORA_ADAPTERS.find((a) => a.discipline === discipline);
  if (!adapter) return false;
  if (_activeLoRA === adapter.name) return true; // already loaded

  try {
    emitProgress(0.7, `Loading ${adapter.name} LoRA (${adapter.sizeMB}MB)…`);
    // LoRA loading via MediaPipe LlmInference addLoraModel API
    await _llm.addLoraModel?.({
      baseOptions: { modelAssetPath: adapter.url },
    });
    _activeLoRA = adapter.name;
    emitProgress(1.0, `${adapter.name} LoRA active ✓`);
    return true;
  } catch (err) {
    console.warn(`[OnDeviceLLM] LoRA ${adapter.name} load failed:`, err);
    return false;
  }
};

// ─── CHROME GEMINI NANO (window.ai Prompt API) ──────────────────────────────
// Zero-download, runs natively in Chrome 131+.
// Tier between Gemma 3 and cloud Gemini.

let _nanoSession: any = null;

export const isNanoAvailable = async (): Promise<boolean> => {
  try {
    const ai = (globalThis as any).ai;
    if (!ai?.languageModel) return false;
    const caps = await ai.languageModel.capabilities();
    return caps.available === "readily" || caps.available === "after-download";
  } catch {
    return false;
  }
};

export const generateWithNano = async (
  prompt: string,
  systemPrompt?: string,
): Promise<string> => {
  const ai = (globalThis as any).ai;
  if (!ai?.languageModel) throw new Error("Gemini Nano not available");

  if (!_nanoSession) {
    _nanoSession = await ai.languageModel.create({
      systemPrompt:
        systemPrompt ??
        "You are a concise sports and dance coaching AI. Respond in JSON when asked.",
      temperature: 0.7,
      topK: 40,
    });
  }

  const result = await _nanoSession.prompt(prompt);
  return result;
};

export const generateWithNanoStream = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  systemPrompt?: string,
): Promise<string> => {
  const ai = (globalThis as any).ai;
  if (!ai?.languageModel) throw new Error("Gemini Nano not available");

  if (!_nanoSession) {
    _nanoSession = await ai.languageModel.create({
      systemPrompt:
        systemPrompt ?? "You are a concise sports and dance coaching AI.",
      temperature: 0.7,
      topK: 40,
    });
  }

  const stream = await _nanoSession.promptStreaming(prompt);
  let full = "";
  for await (const chunk of stream) {
    full = chunk; // Nano stream returns cumulative text
    onChunk(chunk);
  }
  return full;
};

export const closeNano = () => {
  _nanoSession?.destroy?.();
  _nanoSession = null;
};

// ─── GENERATE ─────────────────────────────────────────────────────────────────

export const generateOnDevice = async (
  prompt: string,
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  if (!_isLoaded || !_llm) throw new Error("On-device LLM not loaded");

  const cacheKey = prompt.slice(0, 150);
  const cached = _responseCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.value;

  const value: string = onChunk
    ? await _llm.generateResponse(prompt, onChunk)
    : await _llm.generateResponse(prompt);

  _responseCache.set(cacheKey, { value, ts: Date.now() });
  return value;
};

// ─── STATUS GETTERS ───────────────────────────────────────────────────────────

export const isOnDeviceLLMLoaded = () => _isLoaded;
export const isOnDeviceLLMLoading = () => _isLoading;
export const getOnDeviceLLMProgress = () => _loadProgress;

export const closeLLM = async (): Promise<void> => {
  try {
    _llm?.close();
  } catch {
    /* closeLLM: ignore if already closed */
  }
  _llm = null;
  _isLoaded = false;
};

// ─── UNIFIED ROUTER ───────────────────────────────────────────────────────────
// 4-tier chain: Gemma 3 → Gemini Nano → Cloud Gemini → fallback

export const inferWithBestModel = async (
  prompt: string,
  cloudFallback: () => Promise<string>,
  onChunk?: (chunk: string) => void,
): Promise<string> => {
  // Tier 1: Gemma 3 on-device (WebGPU)
  if (_isLoaded) {
    try {
      return await generateOnDevice(prompt, onChunk);
    } catch {}
  }

  // Tier 2: Chrome Gemini Nano (zero-download, in-browser)
  if (await isNanoAvailable()) {
    try {
      return onChunk
        ? await generateWithNanoStream(prompt, onChunk)
        : await generateWithNano(prompt);
    } catch {}
  }

  // Tier 3: Cloud Gemini (user-provided key)
  return cloudFallback();
};

// ─── GEMMA PROMPT TEMPLATES (Gemma 2B instruction format) ────────────────────

export const buildGemmaCoachPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  score: number,
  acc: number,
  stab: number,
  timing: number,
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\nElite ${name} coach. Session scores — overall: ${score}/100, accuracy: ${acc}%, stability: ${stab}%, timing: ${timing}%. Write 2 motivating sentences + 2 technical improvements specific to ${name}.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaDailyTipPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  streak: number,
  avgScore: number,
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} coach. Athlete: ${streak}-day streak, avg score ${avgScore}/100. One punchy training tip, max 18 words, no emojis.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaWelcomePrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  level: string,
  goals: string[],
  name: string,
): string => {
  const styleName = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${styleName} coach. Welcome ${name}, a new ${level} athlete. Goals: ${goals.join(", ")}. 2 warm sentences.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaBattlePrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  playerScore: number,
  opponentScore: number,
  won: boolean,
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} battle coach. Player ${playerScore}, opponent ${opponentScore}. Player ${won ? "won" : "lost"}. One honest coaching sentence.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaDailyPlanPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  level: string,
  avgScore: number,
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} coach. Create daily plan for ${level} athlete (avg ${avgScore}/100). Return JSON: {"greeting":"...","focusArea":"...","tasks":[{"title":"...","type":"warmup|drill|challenge|cooldown|review","duration":N,"targetScore":N}]}. 4-6 tasks. No markdown.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaScoreAnalysisPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  score: number,
  accuracy: number,
  stability: number,
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} coach. Session — score:${score}/100, accuracy:${accuracy}%, stability:${stability}%. 2 specific improvements and 1 praise. Under 60 words.\n<end_of_turn>\n<start_of_turn>model\n`;
};

// ─── useOnDeviceLLM HOOK ──────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";

export interface OnDeviceLLMState {
  loaded: boolean;
  loading: boolean;
  progress: number;
  progressMsg: string;
  error: string | null;
  caps: DeviceCapabilities | null;
}

export const useOnDeviceLLM = () => {
  const [state, setState] = useState<OnDeviceLLMState>({
    loaded: _isLoaded,
    loading: _isLoading,
    progress: _loadProgress,
    progressMsg: "",
    error: null,
    caps: _capCache,
  });

  useEffect(() => {
    detectDeviceCapabilities().then((caps) =>
      setState((s) => ({ ...s, caps })),
    );

    onLLMProgress((progress, progressMsg) =>
      setState((s) => ({
        ...s,
        progress,
        progressMsg,
        loading: progress < 1 && progress > 0,
        loaded: progress >= 1,
      })),
    );
  }, []);

  const tryLoad = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const ok = await loadOnDeviceLLM();
    setState((s) => ({
      ...s,
      loaded: ok,
      loading: false,
      error: ok ? null : "WebGPU not available on this device",
    }));
  }, []);

  return { ...state, tryLoad };
};

export const onDeviceLLM = {
  detectDeviceCapabilities,
  loadOnDeviceLLM,
  generateOnDevice,
  isOnDeviceLLMLoaded,
  isOnDeviceLLMLoading,
  getOnDeviceLLMProgress,
  closeLLM,
  inferWithBestModel,
  buildGemmaCoachPrompt,
  buildGemmaDailyTipPrompt,
  buildGemmaWelcomePrompt,
  buildGemmaBattlePrompt,
  buildGemmaDailyPlanPrompt,
  buildGemmaScoreAnalysisPrompt,
  useOnDeviceLLM,
  ON_DEVICE_MODELS,
  onLLMProgress,
};
