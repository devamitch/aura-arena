// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Fallback Engine (Rule-Based)
// Works completely offline — no LLM needed.
// Provides daily plans, goal verification, tips, and weekly goals
// when both Gemini and on-device Gemma are unavailable.
// ═══════════════════════════════════════════════════════════════════════════════

import type { DisciplineId, SubDisciplineId, User } from "@types";
import { getDiscipline, getSubDiscipline } from "@utils/constants/disciplines";

// ─── DAILY PLAN TEMPLATES ─────────────────────────────────────────────────────

const PLAN_TEMPLATES: Record<
  string,
  {
    focus: string;
    tasks: Array<{
      title: string;
      type: string;
      duration: number;
      targetScore?: number;
    }>;
  }
> = {
  beginner: {
    focus: "Building Foundation",
    tasks: [
      { title: "Dynamic Warm-Up", type: "warmup", duration: 5 },
      {
        title: "Basic Form Drill",
        type: "drill",
        duration: 10,
        targetScore: 50,
      },
      {
        title: "Technique Practice",
        type: "drill",
        duration: 15,
        targetScore: 55,
      },
      { title: "Cool-Down Stretch", type: "cooldown", duration: 5 },
    ],
  },
  intermediate: {
    focus: "Improving Precision",
    tasks: [
      { title: "Warm-Up Sequence", type: "warmup", duration: 5 },
      {
        title: "Intermediate Drill Set",
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
  },
  advanced: {
    focus: "Mastering Nuance",
    tasks: [
      { title: "Advanced Warm-Up", type: "warmup", duration: 5 },
      {
        title: "Precision Drill",
        type: "drill",
        duration: 15,
        targetScore: 80,
      },
      {
        title: "Performance Challenge",
        type: "challenge",
        duration: 12,
        targetScore: 85,
      },
      { title: "Freestyle Session", type: "drill", duration: 10 },
      { title: "Cool-Down", type: "cooldown", duration: 5 },
    ],
  },
  professional: {
    focus: "Peak Performance",
    tasks: [
      { title: "Mobility & Activation", type: "warmup", duration: 8 },
      {
        title: "High-Intensity Drill",
        type: "drill",
        duration: 15,
        targetScore: 90,
      },
      {
        title: "Competition Simulation",
        type: "challenge",
        duration: 15,
        targetScore: 88,
      },
      { title: "Weakness Analysis", type: "review", duration: 10 },
      { title: "Recovery Protocol", type: "cooldown", duration: 7 },
    ],
  },
};

// ─── MOTIVATION POOL ──────────────────────────────────────────────────────────

const GREETINGS = [
  "Time to level up! Let's crush today's training.",
  "Your body is ready. Your mind just needs to follow.",
  "Champions aren't born, they're built — one session at a time.",
  "Every day you show up, you're ahead of yesterday.",
  "Focus on form first. Speed and power follow.",
  "Today's pain is tomorrow's power. Let's begin.",
];

// ─── DAILY PLAN ───────────────────────────────────────────────────────────────

export function fallbackDailyPlan(
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
) {
  const disc = getDiscipline(discipline);
  const sub = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const name = sub?.name ?? disc.name;
  const template =
    PLAN_TEMPLATES[user.experienceLevel] ?? PLAN_TEMPLATES.beginner;

  const tasks = template.tasks.map((t, i) => ({
    id: `dt-fb-${Date.now()}-${i}`,
    title: t.title.replace("Drill", `${name} Drill`),
    description: `${name} ${t.title.toLowerCase()} — ${t.duration} minutes`,
    type: t.type as any,
    duration: t.duration,
    targetScore: t.targetScore,
    completed: false,
  }));

  return {
    date: new Date().toISOString().split("T")[0],
    discipline,
    subDiscipline,
    greeting: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    tasks,
    focusArea: `${name} — ${template.focus}`,
    estimatedMinutes: tasks.reduce((a, t) => a + t.duration, 0),
  };
}

// ─── GOAL VERIFICATION ────────────────────────────────────────────────────────

export function fallbackGoalVerify(
  task: { title: string; targetScore?: number },
  score: number,
  accuracy: number,
) {
  const target = task.targetScore ?? 60;
  const passed = score >= target * 0.85; // 85% threshold

  const tips: Record<string, string> = {
    low_accuracy: "Focus on hitting precise positions. Slow down if needed.",
    low_score: "Try breaking the movement into smaller segments.",
    close: "Almost there! A few more reps should lock it in.",
  };

  let feedback: string;
  if (passed) {
    feedback = `${task.title} cleared (${score}/${target}). Solid work!`;
  } else if (accuracy < 50) {
    feedback = `${task.title}: ${tips.low_accuracy}`;
  } else {
    feedback = `${task.title}: ${tips.low_score} (${score}/${target})`;
  }

  return { passed, feedback };
}

// ─── WEEKLY GOALS ─────────────────────────────────────────────────────────────

export function fallbackWeeklyGoals(
  user: Pick<User, "experienceLevel" | "averageScore" | "dailyStreak">,
  _discipline: DisciplineId,
) {
  const level = user.experienceLevel;
  const sessTarget =
    level === "beginner" ? 3 : level === "intermediate" ? 4 : 5;
  const scoreTarget = Math.min(user.averageScore + 5, 100);
  const streakTarget = Math.max(user.dailyStreak + 2, 3);

  return [
    {
      id: `wg-1`,
      title: `Complete ${sessTarget} sessions`,
      metric: "sessions" as const,
      target: sessTarget,
      current: 0,
    },
    {
      id: `wg-2`,
      title: `Avg score above ${scoreTarget}`,
      metric: "score" as const,
      target: scoreTarget,
      current: user.averageScore,
    },
    {
      id: `wg-3`,
      title: `${streakTarget}-day streak`,
      metric: "streak" as const,
      target: streakTarget,
      current: user.dailyStreak,
    },
    {
      id: `wg-4`,
      title: `Train ${sessTarget * 20} minutes`,
      metric: "minutes" as const,
      target: sessTarget * 20,
      current: 0,
    },
  ];
}

// ─── COACH TIPS (no LLM needed) ───────────────────────────────────────────────

const TIPS_BY_DISCIPLINE: Record<string, string[]> = {
  boxing: [
    "Keep your guard up — elbows tight to the body.",
    "Rotate your hips into every punch for maximum power.",
    "Breathe out sharply on each strike.",
  ],
  dance: [
    "Let the music guide your body, not the other way around.",
    "Spot your turns — fix your gaze on a single point.",
    "Transitions are as important as the moves themselves.",
  ],
  yoga: [
    "Breath is movement. Inhale to create space, exhale to deepen.",
    "Root through your foundation before extending upward.",
    "Listen to your body's limits — never force a pose.",
  ],
  martialarts: [
    "Speed comes from relaxation, not tension.",
    "Every technique starts from the ground up — footwork first.",
    "Chamber your kicks fully before extending.",
  ],
  gymnastics: [
    "Tight body = efficient movement. Engage your core always.",
    "Land through your feet, not on them. Absorb the impact.",
    "Hollow body is the default position for everything.",
  ],
  fitness: [
    "Form over speed. Quality reps beat quantity every time.",
    "Engage the target muscle before starting the movement.",
    "Rest between sets is where growth happens. Don't skip it.",
  ],
  calisthenics: [
    "Progress through easier variations before advancing.",
    "Control the eccentric (lowering) phase — that's where strength builds.",
    "Straight arm strength takes months — be patient.",
  ],
  bodybuilding: [
    "Mind-muscle connection is real. Visualize the contraction.",
    "Symmetry comes from balanced training. Don't skip weak sides.",
    "Posing practice is training too. Hold each pose 10+ seconds.",
  ],
  wrestling: [
    "Level changes win more takedowns than raw strength.",
    "Control the head, control the match.",
    "Maintain a low center of gravity at all times.",
  ],
  pilates: [
    "Every movement starts from the powerhouse — your core.",
    "Precision over repetition. 5 perfect reps beat 50 sloppy ones.",
    "Lengthen as you strengthen — think tall.",
  ],
  parkour: [
    "Always have an exit strategy before committing to a movement.",
    "Quiet landings = good technique. Noise means wasted energy.",
    "Train the basics until they're automatic, then chain them.",
  ],
};

export function fallbackCoachTip(discipline: DisciplineId): string {
  const tips = TIPS_BY_DISCIPLINE[discipline] ?? TIPS_BY_DISCIPLINE.fitness;
  return tips[Math.floor(Math.random() * tips.length)];
}
