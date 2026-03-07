import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

/** Initialize Gemini with a user-provided API key. This is the ONLY way to activate Gemini. */
export function initGemini(apiKey: string) {
  if (!apiKey) return;
  ai = new GoogleGenAI({ apiKey });
}

/** Check if Gemini is configured (user must provide their key) */
export function isGeminiReady(): boolean {
  return ai !== null;
}

export interface MatchSummaryStats {
  score: number;
  comboStats: { max: number; count: number };
  exercise: string;
  discipline: string;
  duration: number;
  lowLightAreas: string[]; // specific joints/moves that failed Correctness checks often
  won: boolean;
}

export async function generateMatchFeedback(
  playerName: string,
  stats: MatchSummaryStats,
): Promise<string> {
  if (!ai) {
    return "Great effort! To unlock AI-powered personalized feedback, configure your Gemini API Key.";
  }

  const prompt = `
You are an expert AI sports and fitness coach analyzing a player's performance in AURA ARENA.
Player Name: ${playerName}
Discipline: ${stats.discipline}
Exercise/Focus: ${stats.exercise}
Match Result: ${stats.won ? "Victory!" : "Defeat."}
Final Score: ${stats.score}/100
Maximum Combo Streak: ${stats.comboStats.max}
Areas needing improvement (low correctness scores): ${stats.lowLightAreas.join(", ") || "None - flawless execution!"}

Provide a punchy, constructive, and motivating 2-3 sentence feedback. 
Specifically mention their combo streak and their low light areas if any. Tell them exactly how to improve the low light areas physically.
Do not use markdown formatting, just plain text.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Keep up the great work! Your timing is improving.";
  } catch (err) {
    console.error("[generateMatchFeedback] Gemini Error:", err);
    return "Amazing match! The AI coach is currently catching its breath, but your performance was tracked!";
  }
}

/**
 * Generate detailed timestamped coaching from a full SessionReport.
 * Tells the user exactly when they did well/poorly and how to fix it.
 */
export async function generateDetailedFeedback(
  playerName: string,
  report: {
    overallScore: number;
    totalSeconds: number;
    bestMoment: { second: number; score: number };
    worstMoment: { second: number; score: number; issues: string[] };
    timeline: Array<{
      second: number;
      score: number;
      exercise: string;
      issues: string[];
    }>;
  },
): Promise<string> {
  if (!ai) {
    return "Configure your Gemini API key to unlock detailed AI coaching analysis.";
  }

  // Build a concise timeline summary for the prompt
  const lowMoments = report.timeline
    .filter((t) => t.score < 60 && t.score > 0)
    .slice(0, 5)
    .map((t) => {
      const time = `${Math.floor(t.second / 60)}:${String(t.second % 60).padStart(2, "0")}`;
      return `At ${time} (score ${t.score}/100, exercise: ${t.exercise}): ${t.issues.join(", ") || "minor form issues"}`;
    })
    .join("\n");

  const bestTime = `${Math.floor(report.bestMoment.second / 60)}:${String(report.bestMoment.second % 60).padStart(2, "0")}`;
  const worstTime = `${Math.floor(report.worstMoment.second / 60)}:${String(report.worstMoment.second % 60).padStart(2, "0")}`;

  const prompt = `
You are an expert AI sports coach providing detailed video analysis for ${playerName} in AURA ARENA.

Session Summary:
- Overall Score: ${report.overallScore}/100
- Duration: ${report.totalSeconds} seconds
- Best Moment: ${bestTime} (score ${report.bestMoment.score})
- Worst Moment: ${worstTime} (score ${report.worstMoment.score})
${report.worstMoment.issues.length > 0 ? `- Worst Issues: ${report.worstMoment.issues.join(", ")}` : ""}

Low-scoring moments:
${lowMoments || "None — consistently strong performance!"}

Provide 3-5 specific coaching tips referencing exact timestamps. Format each tip as:
"At [time] — [what happened] → [how to fix it physically]"
Be encouraging but precise. Use plain text, no markdown.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return (
      response.text ||
      "Great session! Keep training to unlock more detailed insights."
    );
  } catch (err) {
    console.error("[generateDetailedFeedback] Gemini Error:", err);
    return "Session analyzed! Detailed coaching tips will be available shortly.";
  }
}
