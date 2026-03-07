// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Gemini Video Analysis Service
// Sends recorded video to Gemini's Video Understanding API for analysis.
// Uses File API for larger videos, inline for small ones.
// User must provide their own Gemini API key.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai";

export interface GeminiActionTimestamp {
  time: string;
  second: number;
  label: string;
  score: number;
  issues: string[];
}

export interface GeminiVideoAnalysis {
  discipline: string;
  overallScore: number;
  actions: GeminiActionTimestamp[];
  summary: string;
  rawResponse: string;
}

const INLINE_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function buildPrompt(discipline: string): string {
  return `
You are an expert sports and dance coach AI analyzing a training video.
The user's discipline is: ${discipline}

Analyze the video and return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "discipline": "${discipline}",
  "overallScore": <0-100>,
  "actions": [
    { "time": "MM:SS", "second": <number>, "label": "<action/pose>", "score": <0-100>, "issues": ["<issue>"] }
  ],
  "summary": "<2-3 sentence coaching summary>"
}

For EACH SECOND identify the specific action, form quality, and issues.
Use discipline-specific terms (Kuchipudi: Araimandi, Tribhangi; Boxing: Jab, Cross, Guard; Yoga: Warrior I, Tree Pose, etc).
`.trim();
}

function parseResponse(text: string, discipline: string): GeminiVideoAnalysis {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as GeminiVideoAnalysis;
    parsed.rawResponse = text;
    return parsed;
  } catch {
    return {
      discipline,
      overallScore: 70,
      actions: [],
      summary: text.slice(0, 500),
      rawResponse: text,
    };
  }
}

/**
 * Analyze a recorded video using Gemini's Video Understanding API.
 * Uses File API for videos > 20MB, inline for smaller ones.
 */
export async function analyzeVideoWithGemini(
  apiKey: string,
  videoBlob: Blob,
  discipline: string,
): Promise<GeminiVideoAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(discipline);
  const mimeType = videoBlob.type || "video/webm";

  try {
    let response;

    if (videoBlob.size > INLINE_MAX_BYTES) {
      // ── File API: for large videos ──
      const file = new File([videoBlob], `session-${Date.now()}.webm`, {
        type: mimeType,
      });
      const uploaded = await ai.files.upload({
        file,
        config: { mimeType },
      });

      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(uploaded.uri!, uploaded.mimeType!),
          prompt,
        ]),
      });
    } else {
      // ── Inline: for small videos (<20MB) ──
      const base64 = await blobToBase64(videoBlob);
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      });
    }

    return parseResponse(response.text ?? "", discipline);
  } catch (err) {
    console.error("[geminiVideoService] Analysis failed:", err);
    throw new Error(`Gemini video analysis failed: ${String(err)}`);
  }
}

/**
 * Test a Gemini API key with a simple call.
 */
export async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say 'AURA ARENA connected' in exactly those words.",
    });
    return (response.text ?? "").toLowerCase().includes("connected");
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
