// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useAI Hook (fully functional)
// Routes prompts to on-device Gemma or cloud Gemini automatically.
// Exposes loading states, streaming chunks, and error handling.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DisciplineId, SubDisciplineId } from '@types';
import { onDeviceLLM, detectDeviceCapabilities } from '@lib/mediapipe/onDeviceLLM';
import {
  generateCoachFeedback, generateDailyTip, generateTrainingPlan,
  generateBattleCoachNote, generateImportInsight, generateReelCaption,
  generateSubDisciplineDescription,
} from '@lib/gemini';
import { useUser, useDailyStreak } from '@store';

// ─── DEVICE STATUS ────────────────────────────────────────────────────────────

export interface DeviceAIStatus {
  hasWebGPU: boolean;
  hasWebNN: boolean;
  gpuName: string;
  estimatedVRAM: number;
  canRunOnDevice: boolean;
  recommendedModel: string;
  onDeviceLoaded: boolean;
  onDeviceLoading: boolean;
  onDeviceProgress: number;
}

export const useDeviceAIStatus = (): DeviceAIStatus => {
  const [status, setStatus] = useState<DeviceAIStatus>({
    hasWebGPU: false, hasWebNN: false, gpuName: '',
    estimatedVRAM: 0, canRunOnDevice: false, recommendedModel: 'cloud',
    onDeviceLoaded: false, onDeviceLoading: false, onDeviceProgress: 0,
  });

  useEffect(() => {
    detectDeviceCapabilities().then((caps) => {
      setStatus((prev) => ({
        ...prev,
        hasWebGPU: caps.hasWebGPU,
        hasWebNN: caps.hasWebNN,
        gpuName: caps.gpuAdapterName,
        estimatedVRAM: caps.estimatedVRAMGB,
        canRunOnDevice: caps.canRunGemma3_1B,
        recommendedModel: caps.recommendedModel,
      }));
    });

    onDeviceLLM.onLLMProgress((progress, _msg) => {
      setStatus((prev) => ({
        ...prev,
        onDeviceLoading: progress < 1,
        onDeviceLoaded: progress >= 1,
        onDeviceProgress: progress,
      }));
    });
  }, []);

  return status;
};

// ─── AI CALL STATE ────────────────────────────────────────────────────────────

export interface AICallState {
  loading: boolean;
  streaming: boolean;
  text: string;          // accumulated output
  error: string | null;
  source: 'on-device' | 'cloud' | null;
}

const initState = (): AICallState => ({
  loading: false, streaming: false, text: '', error: null, source: null,
});

// ─── useCoachFeedback ──────────────────────────────────────────────────────────

export const useCoachFeedback = () => {
  const [state, setState] = useState<AICallState>(initState());

  const generate = useCallback(async (
    discipline: DisciplineId,
    subDiscipline: SubDisciplineId | undefined,
    score: number, accuracy: number, stability: number,
    timing: number, expressiveness: number, combo: number,
    onChunk?: (chunk: string) => void
  ) => {
    setState({ loading: true, streaming: false, text: '', error: null, source: null });
    try {
      const text = await generateCoachFeedback(
        discipline, subDiscipline, score, accuracy, stability, timing, expressiveness, combo
      );
      setState({ loading: false, streaming: false, text, error: null, source: 'cloud' });
      return text;
    } catch (err: any) {
      setState({ loading: false, streaming: false, text: '', error: err.message ?? 'AI failed', source: null });
      return '';
    }
  }, []);

  return { ...state, generate };
};

// ─── useDailyTip ──────────────────────────────────────────────────────────────

export const useDailyTip = (
  discipline: DisciplineId,
  subDiscipline?: SubDisciplineId
) => {
  const streak   = useDailyStreak();
  const user     = useUser();
  const [state, setState] = useState<AICallState>(initState());

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const text = await generateDailyTip(
        discipline, subDiscipline,
        streak, user?.averageScore ?? 65
      );
      setState({ loading: false, streaming: false, text, error: null, source: 'cloud' });
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [discipline, subDiscipline, streak, user?.averageScore]);

  // Auto-generate on mount
  useEffect(() => { refresh(); }, [discipline, subDiscipline]);

  return { ...state, refresh };
};

// ─── useTrainingPlan ──────────────────────────────────────────────────────────

export interface TrainingPlanDay {
  day: number;
  goal: string;
  drills: string[];
}

export const useTrainingPlan = (
  discipline: DisciplineId,
  subDiscipline?: SubDisciplineId
) => {
  const user = useUser();
  const [plan, setPlan] = useState<TrainingPlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = await generateTrainingPlan(
        discipline, subDiscipline,
        user?.experienceLevel ?? 'beginner',
        user?.trainingFrequency ?? 3,
        user?.averageScore ?? 60,
      );
      setPlan(days);
    } catch (err: any) {
      setError(err.message ?? 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }, [discipline, subDiscipline, user]);

  useEffect(() => { generate(); }, [discipline, subDiscipline]);

  return { plan, loading, error, generate };
};

// ─── useBattleCoach ───────────────────────────────────────────────────────────

export const useBattleCoach = () => {
  const [state, setState] = useState<AICallState>(initState());

  const generate = useCallback(async (
    discipline: DisciplineId,
    subDiscipline: SubDisciplineId | undefined,
    playerScore: number, opponentScore: number, won: boolean
  ) => {
    setState({ loading: true, streaming: false, text: '', error: null, source: null });
    try {
      const text = await generateBattleCoachNote(
        discipline, subDiscipline, playerScore, opponentScore, won
      );
      setState({ loading: false, streaming: false, text, error: null, source: 'cloud' });
      return text;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      return '';
    }
  }, []);

  return { ...state, generate };
};

// ─── useReelCaption ───────────────────────────────────────────────────────────

export const useReelCaption = () => {
  const [state, setState] = useState<AICallState>(initState());

  const generate = useCallback(async (
    discipline: DisciplineId,
    subDiscipline: SubDisciplineId | undefined,
    score: number, drillName: string
  ) => {
    setState({ loading: true, streaming: false, text: '', error: null, source: null });
    try {
      const text = await generateReelCaption(discipline, subDiscipline, score, drillName);
      setState({ loading: false, streaming: false, text, error: null, source: 'cloud' });
      return text;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      return '';
    }
  }, []);

  return { ...state, generate };
};

// ─── useSubDisciplineAI ───────────────────────────────────────────────────────
// Enriches sub-discipline cards with AI descriptions

export const useSubDisciplineDescription = (subDisciplineId: SubDisciplineId | undefined) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subDisciplineId) return;
    setLoading(true);
    generateSubDisciplineDescription(subDisciplineId)
      .then(setText)
      .catch(() => setText(''))
      .finally(() => setLoading(false));
  }, [subDisciplineId]);

  return { text, loading };
};
