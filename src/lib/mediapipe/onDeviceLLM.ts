// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — On-Device LLM (Gemma 2B via MediaPipe Tasks GenAI)
// 100% functional. Falls back to cloud Gemini when WebGPU unavailable.
// ═══════════════════════════════════════════════════════════════════════════════

import type { DisciplineId, SubDisciplineId } from '@types';

// ─── DEVICE CAPABILITY DETECTION ─────────────────────────────────────────────

export interface DeviceCapabilities {
  hasWebGPU: boolean;
  hasWebNN: boolean;
  gpuAdapterName: string;
  estimatedVRAMGB: number;
  canRunGemma2B_INT4: boolean;
  canRunGemma2B_INT8: boolean;
  recommendedModel: 'gemma-2b-int4' | 'gemma-2b-int8' | 'cloud';
  backend: 'webgpu' | 'webnn' | 'cloud';
}

export type OnDeviceModelId = 'gemma-2b-int4' | 'gemma-2b-int8';

export const ON_DEVICE_MODELS: Record<OnDeviceModelId, { url: string; sizeGB: number; quality: string }> = {
  'gemma-2b-int4': {
    url: 'https://storage.googleapis.com/jmstore/kaggleweb/grader/g-2b-it-gpu-int4.bin',
    sizeGB: 1.3, quality: 'Fast, good quality (INT4)',
  },
  'gemma-2b-int8': {
    url: 'https://storage.googleapis.com/jmstore/kaggleweb/grader/g-2b-it-gpu-int8.bin',
    sizeGB: 2.6, quality: 'Slower, higher quality (INT8)',
  },
};

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

export const detectDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  if (_capCache) return _capCache;

  const hasWebGPU = 'gpu' in navigator;
  const hasWebNN  = 'ml' in navigator;
  let gpuAdapterName = 'Unknown';
  let estimatedVRAMGB = 0;

  if (hasWebGPU) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter({
        powerPreference: 'high-performance',
      });
      if (adapter) {
        const info = await adapter.requestAdapterInfo?.();
        gpuAdapterName = info?.description ?? info?.vendor ?? 'GPU';
        const desc = gpuAdapterName.toLowerCase();
        estimatedVRAMGB =
          /nvidia|rtx|gtx|amd|radeon/i.test(desc)  ? 8 :
          /apple|m[1-5]/i.test(desc)               ? 4 :
          /intel|arc/i.test(desc)                  ? 3 : 2;
      }
    } catch {
      estimatedVRAMGB = 0;
    }
  }

  const canRunGemma2B_INT4 = hasWebGPU && estimatedVRAMGB >= 2;
  const canRunGemma2B_INT8 = hasWebGPU && estimatedVRAMGB >= 4;
  const recommendedModel = canRunGemma2B_INT8
    ? 'gemma-2b-int8'
    : canRunGemma2B_INT4
    ? 'gemma-2b-int4'
    : 'cloud';
  const backend = hasWebGPU ? 'webgpu' : hasWebNN ? 'webnn' : 'cloud';

  _capCache = {
    hasWebGPU, hasWebNN, gpuAdapterName, estimatedVRAMGB,
    canRunGemma2B_INT4, canRunGemma2B_INT8, recommendedModel, backend,
  };

  return _capCache;
};

// ─── PROGRESS CALLBACKS ───────────────────────────────────────────────────────

export const onLLMProgress = (cb: (progress: number, msg: string) => void): void => {
  _progressCallbacks.push(cb);
};

const emitProgress = (progress: number, msg: string): void => {
  _loadProgress = progress;
  _progressCallbacks.forEach((cb) => cb(progress, msg));
};

// ─── LOAD ─────────────────────────────────────────────────────────────────────

export const loadOnDeviceLLM = async (override?: OnDeviceModelId): Promise<boolean> => {
  if (_isLoaded) return true;
  if (_isLoading) return false;

  const caps = await detectDeviceCapabilities();
  const modelId = override ?? (caps.recommendedModel === 'cloud' ? null : caps.recommendedModel);
  if (!modelId) {
    console.info('[OnDeviceLLM] No capable GPU — using cloud Gemini');
    return false;
  }

  _isLoading = true;
  emitProgress(0.05, 'Loading MediaPipe GenAI runtime…');

  try {
    // Dynamic import so bundle doesn't include it unless needed
    const { LlmInference, FilesetResolver } = await import('@mediapipe/tasks-genai');
    emitProgress(0.3, `Downloading ${modelId} (${ON_DEVICE_MODELS[modelId].sizeGB}GB)…`);

    const fileset = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
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
    emitProgress(1.0, `${modelId} ready ✓`);
    return true;
  } catch (err) {
    console.warn('[OnDeviceLLM] Load failed — falling back to cloud:', err);
    _isLoading = false;
    emitProgress(0, 'On-device unavailable');
    return false;
  }
};

// ─── GENERATE ─────────────────────────────────────────────────────────────────

export const generateOnDevice = async (
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  if (!_isLoaded || !_llm) throw new Error('On-device LLM not loaded');

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

export const isOnDeviceLLMLoaded  = () => _isLoaded;
export const isOnDeviceLLMLoading = () => _isLoading;
export const getOnDeviceLLMProgress = () => _loadProgress;

export const closeLLM = async (): Promise<void> => {
  try { _llm?.close(); } catch {}
  _llm = null;
  _isLoaded = false;
};

// ─── UNIFIED ROUTER ───────────────────────────────────────────────────────────
// Try on-device first, fall back to cloud

export const inferWithBestModel = async (
  prompt: string,
  cloudFallback: () => Promise<string>,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  if (_isLoaded) {
    try { return await generateOnDevice(prompt, onChunk); } catch {}
  }
  return cloudFallback();
};

// ─── GEMMA PROMPT TEMPLATES (Gemma 2B instruction format) ────────────────────

export const buildGemmaCoachPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  score: number, acc: number, stab: number, timing: number
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\nElite ${name} coach. Session scores — overall: ${score}/100, accuracy: ${acc}%, stability: ${stab}%, timing: ${timing}%. Write 2 motivating sentences + 2 technical improvements specific to ${name}.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaDailyTipPrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  streak: number, avgScore: number
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} coach. Athlete: ${streak}-day streak, avg score ${avgScore}/100. One punchy training tip, max 18 words, no emojis.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaWelcomePrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  level: string, goals: string[], name: string
): string => {
  const styleName = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${styleName} coach. Welcome ${name}, a new ${level} athlete. Goals: ${goals.join(', ')}. 2 warm sentences.\n<end_of_turn>\n<start_of_turn>model\n`;
};

export const buildGemmaBattlePrompt = (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  playerScore: number, opponentScore: number, won: boolean
): string => {
  const name = subDiscipline ?? discipline;
  return `<start_of_turn>user\n${name} battle coach. Player ${playerScore}, opponent ${opponentScore}. Player ${won ? 'won' : 'lost'}. One honest coaching sentence.\n<end_of_turn>\n<start_of_turn>model\n`;
};

// ─── useOnDeviceLLM HOOK ──────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

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
    loaded: _isLoaded, loading: _isLoading,
    progress: _loadProgress, progressMsg: '',
    error: null, caps: _capCache,
  });

  useEffect(() => {
    detectDeviceCapabilities().then((caps) =>
      setState((s) => ({ ...s, caps }))
    );

    onLLMProgress((progress, progressMsg) =>
      setState((s) => ({
        ...s, progress, progressMsg,
        loading: progress < 1 && progress > 0,
        loaded: progress >= 1,
      }))
    );
  }, []);

  const tryLoad = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const ok = await loadOnDeviceLLM();
    setState((s) => ({
      ...s, loaded: ok, loading: false,
      error: ok ? null : 'WebGPU not available on this device',
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
    useOnDeviceLLM,
    ON_DEVICE_MODELS,
    onLLMProgress
}
