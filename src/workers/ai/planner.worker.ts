// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Planner Worker
// Runs daily plan generation + score analysis OFF the main thread.
// Chain: On-device Gemma → Cloud Gemini → Rule-based fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  buildGemmaDailyPlanPrompt,
  buildGemmaScoreAnalysisPrompt,
  generateOnDevice,
  isOnDeviceLLMLoaded,
  loadOnDeviceLLM,
} from "@lib/mediapipe/onDeviceLLM";
import type { DisciplineId, SubDisciplineId } from "@types";

// ─── MESSAGE TYPES ────────────────────────────────────────────────────────────

interface PlanRequest {
  type: "GENERATE_PLAN";
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  level: string;
  avgScore: number;
  displayName: string;
  dailyStreak: number;
  sessionsCompleted: number;
}

interface AnalyzeRequest {
  type: "ANALYZE_SESSION";
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  score: number;
  accuracy: number;
  stability: number;
}

interface LoadLLMRequest {
  type: "LOAD_LLM";
}

type WorkerMessage = PlanRequest | AnalyzeRequest | LoadLLMRequest;

// ─── PLAN TEMPLATE FALLBACK ──────────────────────────────────────────────────

const LEVEL_TASKS: Record<
  string,
  Array<{
    title: string;
    type: string;
    duration: number;
    targetScore?: number;
  }>
> = {
  beginner: [
    { title: "Dynamic Warm-Up", type: "warmup", duration: 5 },
    { title: "Basic Form Drill", type: "drill", duration: 10, targetScore: 50 },
    {
      title: "Technique Practice",
      type: "drill",
      duration: 15,
      targetScore: 55,
    },
    { title: "Cool-Down Stretch", type: "cooldown", duration: 5 },
  ],
  intermediate: [
    { title: "Warm-Up Sequence", type: "warmup", duration: 5 },
    {
      title: "Intermediate Drill",
      type: "drill",
      duration: 12,
      targetScore: 65,
    },
    {
      title: "Combo Challenge",
      type: "challenge",
      duration: 10,
      targetScore: 70,
    },
    { title: "Form Review", type: "review", duration: 8 },
    { title: "Active Recovery", type: "cooldown", duration: 5 },
  ],
  advanced: [
    { title: "Advanced Warm-Up", type: "warmup", duration: 5 },
    { title: "Precision Drill", type: "drill", duration: 15, targetScore: 80 },
    {
      title: "Performance Challenge",
      type: "challenge",
      duration: 12,
      targetScore: 85,
    },
    { title: "Freestyle Session", type: "drill", duration: 10 },
    { title: "Cool-Down", type: "cooldown", duration: 5 },
  ],
  professional: [
    { title: "Mobility & Activation", type: "warmup", duration: 8 },
    {
      title: "High-Intensity Drill",
      type: "drill",
      duration: 15,
      targetScore: 90,
    },
    {
      title: "Competition Sim",
      type: "challenge",
      duration: 15,
      targetScore: 88,
    },
    { title: "Weakness Analysis", type: "review", duration: 10 },
    { title: "Recovery Protocol", type: "cooldown", duration: 7 },
  ],
};

function buildFallbackPlan(msg: PlanRequest) {
  const tasks = (LEVEL_TASKS[msg.level] ?? LEVEL_TASKS.beginner).map(
    (t, i) => ({
      id: `dt-${Date.now()}-${i}`,
      ...t,
      completed: false,
      description: `${msg.subDiscipline ?? msg.discipline} ${t.title.toLowerCase()}`,
    }),
  );
  return {
    date: new Date().toISOString().split("T")[0],
    discipline: msg.discipline,
    subDiscipline: msg.subDiscipline,
    greeting: `Let's train, ${msg.displayName}!`,
    focusArea: "Fundamentals",
    tasks,
    estimatedMinutes: tasks.reduce((a, t) => a + t.duration, 0),
  };
}

function buildFallbackAnalysis(msg: AnalyzeRequest) {
  const tips: string[] = [];
  if (msg.accuracy < 70) tips.push("Focus on hitting precise positions.");
  if (msg.stability < 70) tips.push("Reduce body sway — engage your core.");
  if (msg.score >= 80) tips.push("Great session! Push for consistency.");
  else tips.push("Keep practicing — improvement comes with reps.");
  return tips.join(" ");
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

async function handleMessage(msg: WorkerMessage) {
  switch (msg.type) {
    case "LOAD_LLM": {
      const ok = await loadOnDeviceLLM();
      (self as unknown as Worker).postMessage({
        type: "LLM_STATUS",
        loaded: ok,
      });
      return;
    }

    case "GENERATE_PLAN": {
      try {
        if (isOnDeviceLLMLoaded()) {
          const prompt = buildGemmaDailyPlanPrompt(
            msg.discipline,
            msg.subDiscipline,
            msg.level,
            msg.avgScore,
          );
          const raw = await generateOnDevice(prompt);
          const clean = raw.replace(/```json|```/gi, "").trim();
          const parsed = JSON.parse(clean);
          const tasks = (parsed.tasks ?? []).map((t: any, i: number) => ({
            id: `dt-${Date.now()}-${i}`,
            title: t.title,
            description: t.description ?? "",
            type: t.type ?? "drill",
            duration: t.duration ?? 10,
            targetScore: t.targetScore,
            completed: false,
          }));
          (self as unknown as Worker).postMessage({
            type: "PLAN_RESULT",
            source: "gemma",
            plan: {
              date: new Date().toISOString().split("T")[0],
              discipline: msg.discipline,
              subDiscipline: msg.subDiscipline,
              greeting: parsed.greeting ?? `Let's train, ${msg.displayName}!`,
              focusArea: parsed.focusArea ?? "General",
              tasks,
              estimatedMinutes: tasks.reduce(
                (a: number, t: any) => a + t.duration,
                0,
              ),
            },
          });
          return;
        }
      } catch {
        /* fall through to fallback */
      }

      (self as unknown as Worker).postMessage({
        type: "PLAN_RESULT",
        source: "fallback",
        plan: buildFallbackPlan(msg),
      });
      return;
    }

    case "ANALYZE_SESSION": {
      try {
        if (isOnDeviceLLMLoaded()) {
          const prompt = buildGemmaScoreAnalysisPrompt(
            msg.discipline,
            msg.subDiscipline,
            msg.score,
            msg.accuracy,
            msg.stability,
          );
          const analysis = await generateOnDevice(prompt);
          (self as unknown as Worker).postMessage({
            type: "ANALYSIS_RESULT",
            source: "gemma",
            analysis,
          });
          return;
        }
      } catch {
        /* fall through */
      }

      (self as unknown as Worker).postMessage({
        type: "ANALYSIS_RESULT",
        source: "fallback",
        analysis: buildFallbackAnalysis(msg),
      });
      return;
    }
  }
}

self.addEventListener("message", (e: MessageEvent) => handleMessage(e.data));
