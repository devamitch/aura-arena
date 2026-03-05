// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Gemini AI Client (fully functional, zero classes)
// Model waterfall: gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-flash-8b
// Integrates with on-device LLM fallback via onDeviceLLM.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { getDiscipline, getSubDiscipline } from "@utils/constants/disciplines";
import type { DisciplineId, SubDisciplineId } from "@types";
import {
  GoogleGenAI as GoogleGenerativeAI,
  type GenerateContentResponse as GenerateContentResult,
} from "@google/genai";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.VITE_GEMINI_API_KEY ?? "";

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash-8b",
] as const;

type GeminiModel = (typeof MODELS)[number];

// ─── MODULE STATE ─────────────────────────────────────────────────────────────

const _clients: Map<GeminiModel, GoogleGenerativeAI> = new Map();
const _cache: Map<string, { value: string; ts: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ─── CLIENT ACCESS ────────────────────────────────────────────────────────────

const getClient = (model: GeminiModel): GoogleGenerativeAI => {
  if (!_clients.has(model)) {
    _clients.set(model, new GoogleGenerativeAI(API_KEY));
  }
  return _clients.get(model)!;
};

// ─── CORE GENERATE (waterfall with retry) ────────────────────────────────────

export interface GeminiOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  cacheKey?: string;
}

export const generateText = async (
  prompt: string,
  opts: GeminiOptions = {},
): Promise<string> => {
  const { maxTokens = 256, temperature = 0.8, systemPrompt, cacheKey } = opts;

  // Cache check
  const key = cacheKey ?? `${prompt.slice(0, 150)}`;
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.value;

  if (!API_KEY) {
    return _fallbackResponse(prompt);
  }

  let lastErr: Error | null = null;

  for (const model of MODELS) {
    try {
      const client = getClient(model);
      const genModel = client.getGenerativeModel({
        model,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      });

      const result: GenerateContentResult =
        await genModel.generateContent(prompt);
      const text = result.response.text().trim();

      if (text) {
        _cache.set(key, { value: text, ts: Date.now() });
        return text;
      }
    } catch (err: any) {
      lastErr = err;
      // 429 rate limit → try next model
      if (err?.status === 429 || err?.message?.includes("quota")) continue;
      // Other errors → don't retry
      break;
    }
  }

  console.warn("[Gemini] All models failed:", lastErr?.message);
  return _fallbackResponse(prompt);
};

// ─── STREAMING ────────────────────────────────────────────────────────────────

export const generateTextStream = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  opts: GeminiOptions = {},
): Promise<string> => {
  if (!API_KEY) {
    const text = _fallbackResponse(prompt);
    onChunk(text);
    return text;
  }

  const { maxTokens = 256, temperature = 0.8, systemPrompt } = opts;
  let full = "";

  for (const model of MODELS) {
    try {
      const client = getClient(model);
      const genModel = client.getGenerativeModel({
        model,
        generationConfig: { maxOutputTokens: maxTokens, temperature },
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      });

      const stream = await genModel.generateContentStream(prompt);
      for await (const chunk of stream.stream) {
        const text = chunk.text();
        full += text;
        onChunk(text);
      }
      return full;
    } catch (err: any) {
      if (err?.status === 429) continue;
      break;
    }
  }

  const fb = _fallbackResponse(prompt);
  onChunk(fb);
  return fb;
};

// ─── DOMAIN-SPECIFIC GENERATORS ───────────────────────────────────────────────

export const generateCoachFeedback = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  score: number,
  accuracy: number,
  stability: number,
  timing: number,
  expressiveness: number,
  combo: number,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;
  const tone = disc.coachingTone;

  const system = buildCoachSystemPrompt(disc.name, tone);
  const prompt = `Athlete just completed a ${styleName} session.
Scores — Overall: ${score}/100 | Accuracy: ${accuracy}% | Stability: ${stability}% | Timing: ${timing}% | Expressiveness: ${expressiveness}% | Combo: ${combo}x
Write 2 motivating sentences + 2 specific technical improvements for ${styleName}. Be concise and ${tone}.`;

  return generateText(prompt, {
    systemPrompt: system,
    maxTokens: 180,
    temperature: 0.85,
    cacheKey: `coach_${discipline}_${subDiscipline}_${Math.floor(score / 10)}`,
  });
};

export const generateDailyTip = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  streak: number,
  avgScore: number,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;

  return generateText(
    `You are a ${styleName} coach. ${streak}-day streak athlete, avg ${avgScore}/100. One punchy motivational training tip. Max 20 words. No emojis.`,
    {
      maxTokens: 60,
      temperature: 0.9,
      cacheKey: `tip_${discipline}_${subDiscipline}_${streak}_${Math.floor(avgScore / 5)}`,
    },
  );
};

export const generateWelcomeMessage = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  level: string,
  goals: string[],
  name: string,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;

  return generateText(
    `Welcome ${name} to AURA ARENA as a ${level} ${styleName} athlete. Goals: ${goals.join(", ")}. 2 warm sentences of welcome + one motivating phrase. Personal and sport-specific.`,
    {
      systemPrompt: buildCoachSystemPrompt(styleName, disc.coachingTone),
      maxTokens: 120,
      temperature: 0.9,
    },
  );
};

export const generateTrainingPlan = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  level: string,
  daysPerWeek: number,
  avgScore: number,
): Promise<{ day: number; goal: string; drills: string[] }[]> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;

  const prompt = `Create a ${daysPerWeek}-day ${styleName} training plan for a ${level} athlete (avg score ${avgScore}/100).
Return ONLY valid JSON array: [{"day":1,"goal":"string","drills":["string","string","string"]}].
Keep drills specific to ${styleName} technique. No markdown. No explanation.`;

  const raw = await generateText(prompt, {
    maxTokens: 500,
    temperature: 0.7,
    cacheKey: `plan_${discipline}_${subDiscipline}_${level}_${daysPerWeek}`,
  });

  try {
    const clean = raw.replace(/```json|```/gi, "").trim();
    return JSON.parse(clean);
  } catch {
    // Default plan on parse failure
    return Array.from({ length: daysPerWeek }, (_, i) => ({
      day: i + 1,
      goal: `${styleName} fundamentals — Day ${i + 1}`,
      drills: [
        "Warm-up sequence",
        `${styleName} basic technique`,
        "Cool-down stretch",
      ],
    }));
  }
};

export const generateBattleCoachNote = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  playerScore: number,
  opponentScore: number,
  won: boolean,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;

  return generateText(
    `${styleName} battle coach. Player scored ${playerScore}, opponent ${opponentScore}. ${won ? "Player won!" : "Player lost."} One sentence: honest, specific to ${styleName}, both acknowledging result and giving improvement tip.`,
    { maxTokens: 80, temperature: 0.85 },
  );
};

export const generateImportInsight = async (
  source: string,
  activities: number,
  discipline: DisciplineId,
  dateRange: string,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  return generateText(
    `As a ${disc.name} coach reviewing imported ${source} data: ${activities} activities over ${dateRange}. 2-sentence training history insight relevant to ${disc.name} performance improvement.`,
    { maxTokens: 120, temperature: 0.8 },
  );
};

export const generateReelCaption = async (
  discipline: DisciplineId,
  subDiscipline: SubDisciplineId | undefined,
  score: number,
  drillName: string,
): Promise<string> => {
  const disc = getDiscipline(discipline);
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const styleName = subDisc?.name ?? disc.name;

  return generateText(
    `Write a short Instagram-style caption for a ${styleName} training reel. Drill: "${drillName}". Score: ${score}/100. Engaging, with 2-3 relevant hashtags. Under 100 chars.`,
    { maxTokens: 80, temperature: 1.0 },
  );
};

export const generateSubDisciplineDescription = async (
  subDisciplineId: SubDisciplineId,
): Promise<string> => {
  const subDisc = getSubDiscipline(subDisciplineId);
  if (!subDisc) return "";

  return generateText(
    `In 2 sentences, describe ${subDisc.name}${subDisc.origin ? ` (from ${subDisc.origin})` : ""} as a training discipline. Include one unique characteristic that sets it apart. Enthusiastic but factual.`,
    {
      maxTokens: 100,
      temperature: 0.8,
      cacheKey: `subdesc_${subDisciplineId}`,
    },
  );
};

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const buildCoachSystemPrompt = (discipline: string, tone: string): string =>
  `You are an elite ${discipline} performance coach with 20+ years experience. Your coaching style is ${tone}. You give specific, actionable, sport-specific feedback. You never use generic phrases like "great job" or "keep it up". You always reference specific technical aspects of ${discipline}.`;

// ─── FALLBACK (no API key or all models failed) ────────────────────────────────

const FALLBACK_TIPS = [
  "Focus on your breathing — it controls everything else.",
  "Every rep you complete is a deposit in your performance account.",
  "Perfect practice makes perfect performance.",
  "Today's discomfort is tomorrow's strength.",
  "Consistency beats intensity every single day.",
];

const _fallbackResponse = (prompt: string): string => {
  // Return a contextually-reasonable fallback
  if (prompt.includes("tip"))
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  if (prompt.includes("welcome"))
    return "Welcome to AURA ARENA! Your journey to mastery starts here.";
  if (prompt.includes("caption"))
    return "Training hard every day. #AuraArena #Performance";
  return "Keep training consistently and your scores will improve. Focus on form before speed.";
};
