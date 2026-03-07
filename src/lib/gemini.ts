// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Gemini Domain Generators
// Text generation for coaching, tips, plans, captions, etc.
// Uses the user-provided Gemini key from aiService.ts (no env fallback).
// ═══════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";
import { useStore } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import { getDiscipline, getSubDiscipline } from "@utils/constants/disciplines";

// ─── CLIENT (user-key-only) ──────────────────────────────────────────────────

const MODELS = [
  "gemini-3-flash-preview", // Gemini 3 Flash — fast + cheap
  "gemini-3-pro-preview", // Gemini 3 Pro — highest quality
  "gemini-2.5-flash", // Gemini 2.5 Flash — stable fallback
] as const;
const _cache = new Map<string, { value: string; ts: number }>();
const CACHE_TTL = 5 * 60_000;

function getClient(): GoogleGenAI | null {
  const key = useStore.getState().geminiApiKey;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ─── CORE GENERATE (waterfall with retry) ────────────────────────────────────

export interface GeminiOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  cacheKey?: string;
}

export async function generateText(
  prompt: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const { maxTokens = 256, temperature = 0.8, systemPrompt, cacheKey } = opts;
  const key = cacheKey ?? prompt.slice(0, 150);
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.value;

  const client = getClient();
  if (!client) return _fallback(prompt);

  for (const model of MODELS) {
    try {
      const result = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
          ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        },
      });
      const text = (result.text ?? "").trim();
      if (text) {
        _cache.set(key, { value: text, ts: Date.now() });
        return text;
      }
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes("quota")) continue;
      break;
    }
  }
  return _fallback(prompt);
}

// ─── STREAMING ────────────────────────────────────────────────────────────────

export async function generateTextStream(
  prompt: string,
  onChunk: (c: string) => void,
  opts: GeminiOptions = {},
): Promise<string> {
  const client = getClient();
  if (!client) {
    const t = _fallback(prompt);
    onChunk(t);
    return t;
  }
  const { maxTokens = 256, temperature = 0.8, systemPrompt } = opts;
  let full = "";
  for (const model of MODELS) {
    try {
      const stream = client.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
          ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        },
      });
      for await (const chunk of await stream) {
        const t = chunk.text ?? "";
        full += t;
        if (t) onChunk(t);
      }
      return full;
    } catch (err: any) {
      if (err?.status === 429) continue;
      break;
    }
  }
  const fb = _fallback(prompt);
  onChunk(fb);
  return fb;
}

// ─── DOMAIN GENERATORS ───────────────────────────────────────────────────────

function styleName(d: DisciplineId, s?: SubDisciplineId) {
  const sub = s ? getSubDiscipline(s) : undefined;
  return sub?.name ?? getDiscipline(d).name;
}

function coachPrompt(disc: string, tone: string) {
  return `You are an elite ${disc} performance coach, 20+ years. Style: ${tone}. Give specific, actionable, sport-specific feedback. Never generic.`;
}

export const generateCoachFeedback = (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  score: number,
  accuracy: number,
  stability: number,
  timing: number,
  expressiveness: number,
  combo: number,
) => {
  const disc = getDiscipline(d);
  const name = styleName(d, s);
  return generateText(
    `Athlete completed ${name}. Overall:${score} Acc:${accuracy}% Stab:${stability}% Tim:${timing}% Expr:${expressiveness}% Combo:${combo}x. 2 motivating sentences + 2 specific improvements.`,
    {
      systemPrompt: coachPrompt(disc.name, disc.coachingTone),
      maxTokens: 180,
      temperature: 0.85,
      cacheKey: `coach_${d}_${s}_${Math.floor(score / 10)}`,
    },
  );
};

export const generateDailyTip = (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  streak: number,
  avgScore: number,
) =>
  generateText(
    `You are a ${styleName(d, s)} coach. ${streak}-day streak, avg ${avgScore}/100. One punchy training tip under 20 words. No emojis.`,
    {
      maxTokens: 60,
      temperature: 0.9,
      cacheKey: `tip_${d}_${s}_${streak}_${Math.floor(avgScore / 5)}`,
    },
  );

export const generateWelcomeMessage = (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  level: string,
  goals: string[],
  name: string,
) => {
  const disc = getDiscipline(d);
  return generateText(
    `Welcome ${name} as ${level} ${styleName(d, s)} athlete. Goals: ${goals.join(", ")}. 2 warm sentences + motivating phrase.`,
    {
      systemPrompt: coachPrompt(styleName(d, s), disc.coachingTone),
      maxTokens: 120,
      temperature: 0.9,
    },
  );
};

export const generateTrainingPlan = async (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  level: string,
  days: number,
  avg: number,
): Promise<{ day: number; goal: string; drills: string[] }[]> => {
  const name = styleName(d, s);
  const raw = await generateText(
    `Create ${days}-day ${name} plan for ${level} (avg ${avg}/100). Return ONLY JSON: [{"day":1,"goal":"...","drills":["..."]}]. No markdown.`,
    {
      maxTokens: 500,
      temperature: 0.7,
      cacheKey: `plan_${d}_${s}_${level}_${days}`,
    },
  );
  try {
    return JSON.parse(raw.replace(/```json|```/gi, "").trim());
  } catch {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      goal: `${name} Day ${i + 1}`,
      drills: ["Warm-up", `${name} basics`, "Cool-down"],
    }));
  }
};

export const generateBattleCoachNote = (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  ps: number,
  os: number,
  won: boolean,
) =>
  generateText(
    `${styleName(d, s)} battle. Player ${ps}, opponent ${os}. ${won ? "Won!" : "Lost."} One honest sentence with improvement tip.`,
    { maxTokens: 80, temperature: 0.85 },
  );

export const generateImportInsight = (
  source: string,
  count: number,
  d: DisciplineId,
  range: string,
) =>
  generateText(
    `${getDiscipline(d).name} coach reviewing ${source}: ${count} activities over ${range}. 2-sentence insight.`,
    { maxTokens: 120, temperature: 0.8 },
  );

export const generateReelCaption = (
  d: DisciplineId,
  s: SubDisciplineId | undefined,
  score: number,
  drill: string,
) =>
  generateText(
    `Short caption for ${styleName(d, s)} reel. Drill: "${drill}". Score: ${score}/100. Under 100 chars with 2-3 hashtags.`,
    { maxTokens: 80, temperature: 1.0 },
  );

export const generateSubDisciplineDescription = (sub: SubDisciplineId) => {
  const info = getSubDiscipline(sub);
  if (!info) return Promise.resolve("");
  return generateText(
    `2 sentences about ${info.name}${info.origin ? ` (${info.origin})` : ""}. One unique characteristic. Enthusiastic but factual.`,
    { maxTokens: 100, temperature: 0.8, cacheKey: `subdesc_${sub}` },
  );
};

// ─── FALLBACK ──────────────────────────────────────────────────────────────────

const TIPS = [
  "Focus on breathing — it controls everything.",
  "Every rep is a deposit in your performance account.",
  "Perfect practice makes perfect performance.",
  "Consistency beats intensity every day.",
];

function _fallback(prompt: string): string {
  if (prompt.includes("tip"))
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  if (prompt.includes("welcome"))
    return "Welcome to AURA ARENA! Your mastery journey starts here.";
  if (prompt.includes("caption"))
    return "Training hard every day. #AuraArena #Performance";
  return "Keep training consistently. Focus on form before speed.";
}
