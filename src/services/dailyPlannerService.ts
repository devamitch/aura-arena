// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Daily Planner Service
// Generates personalized daily plans, goals, and task verification.
// Chain: Gemini (user key) → On-device Gemma → Rule-based fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  fallbackDailyPlan,
  fallbackGoalVerify,
  fallbackWeeklyGoals,
} from "@lib/fallbackEngine";
import { generateText } from "@lib/gemini";
import {
  buildGemmaDailyPlanPrompt,
  inferWithBestModel,
} from "@lib/mediapipe/onDeviceLLM";
import type { DisciplineId, SubDisciplineId, User } from "@types";
import { getDiscipline, getSubDiscipline } from "@utils/constants/disciplines";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: "warmup" | "drill" | "challenge" | "cooldown" | "review";
  duration: number; // minutes
  targetScore?: number;
  drillId?: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  greeting: string;
  tasks: DailyTask[];
  focusArea: string;
  estimatedMinutes: number;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  metric: "sessions" | "score" | "streak" | "accuracy" | "minutes";
  target: number;
  current: number;
}

// ─── GENERATE DAILY PLAN ──────────────────────────────────────────────────────

export async function generateDailyPlan(
  user: Pick<
    User,
    | "displayName"
    | "experienceLevel"
    | "averageScore"
    | "dailyStreak"
    | "sessionsCompleted"
  >,
  discipline: DisciplineId,
  subDiscipline?: SubDisciplineId,
): Promise<DailyPlan> {
  const disc = getDiscipline(discipline);
  const sub = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const name = sub?.name ?? disc.name;

  const prompt = `Create a daily training plan for ${user.displayName}, a ${user.experienceLevel} ${name} athlete.
Stats: avg score ${user.averageScore}/100, ${user.dailyStreak}-day streak, ${user.sessionsCompleted} sessions total.
Return ONLY JSON: {"greeting":"...","focusArea":"...","tasks":[{"title":"...","description":"...","type":"warmup|drill|challenge|cooldown|review","duration":N,"targetScore":N}]}
Keep tasks specific to ${name}. 4-6 tasks. No markdown.`;

  try {
    const raw = await inferWithBestModel(
      buildGemmaDailyPlanPrompt(
        discipline,
        subDiscipline,
        user.experienceLevel,
        user.averageScore,
      ),
      () => generateText(prompt, { maxTokens: 600, temperature: 0.7 }),
    );
    return parsePlan(raw, discipline, subDiscipline);
  } catch {
    return fallbackDailyPlan(user, discipline, subDiscipline);
  }
}

// ─── VERIFY TASK COMPLETION ───────────────────────────────────────────────────

export function verifyTaskCompletion(
  task: DailyTask,
  sessionScore: number,
  sessionAccuracy: number,
): { passed: boolean; feedback: string } {
  const target = task.targetScore ?? 60;
  if (sessionScore >= target) {
    return {
      passed: true,
      feedback: `Score ${sessionScore}/100 meets target. Well done!`,
    };
  }
  const gap = target - sessionScore;
  if (gap <= 10) {
    return {
      passed: true,
      feedback: `Close enough (${sessionScore}/${target}). Keep pushing!`,
    };
  }
  return fallbackGoalVerify(task, sessionScore, sessionAccuracy);
}

// ─── GENERATE WEEKLY GOALS ───────────────────────────────────────────────────

export async function generateWeeklyGoals(
  user: Pick<User, "experienceLevel" | "averageScore" | "dailyStreak">,
  discipline: DisciplineId,
  subDiscipline?: SubDisciplineId,
): Promise<WeeklyGoal[]> {
  const disc = getDiscipline(discipline);
  const name = subDiscipline
    ? (getSubDiscipline(subDiscipline)?.name ?? disc.name)
    : disc.name;

  const prompt = `Create 3-4 weekly training goals for a ${user.experienceLevel} ${name} athlete (avg ${user.averageScore}/100, ${user.dailyStreak}-day streak).
Return ONLY JSON array: [{"title":"...","metric":"sessions|score|streak|accuracy|minutes","target":N}]. No markdown.`;

  try {
    const raw = await generateText(prompt, {
      maxTokens: 300,
      temperature: 0.7,
    });
    const arr = JSON.parse(raw.replace(/```json|```/gi, "").trim());
    return arr.map((g: any, i: number) => ({
      id: `wg-${Date.now()}-${i}`,
      ...g,
      current: 0,
    }));
  } catch {
    return fallbackWeeklyGoals(user, discipline);
  }
}

// ─── PARSER ───────────────────────────────────────────────────────────────────

function parsePlan(
  raw: string,
  d: DisciplineId,
  s?: SubDisciplineId,
): DailyPlan {
  try {
    const clean = raw.replace(/```json|```/gi, "").trim();
    const data = JSON.parse(clean);
    const tasks: DailyTask[] = (data.tasks ?? []).map((t: any, i: number) => ({
      id: `dt-${Date.now()}-${i}`,
      title: t.title ?? `Task ${i + 1}`,
      description: t.description ?? "",
      type: t.type ?? "drill",
      duration: t.duration ?? 10,
      targetScore: t.targetScore,
      completed: false,
    }));
    return {
      date: new Date().toISOString().split("T")[0],
      discipline: d,
      subDiscipline: s,
      greeting: data.greeting ?? "Ready to train!",
      tasks,
      focusArea: data.focusArea ?? "General",
      estimatedMinutes: tasks.reduce((a, t) => a + t.duration, 0),
    };
  } catch {
    // If parse fails, use fallback
    return {
      date: new Date().toISOString().split("T")[0],
      discipline: d,
      subDiscipline: s,
      greeting: "Let's train!",
      focusArea: "Fundamentals",
      tasks: [],
      estimatedMinutes: 0,
    };
  }
}
