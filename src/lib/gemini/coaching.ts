// Aura Arena — Gemini AI Coaching (post-session analysis)
// Uses Gemini 2.0 Flash for personalized coaching feedback

interface SessionData {
  discipline: string;
  finalScore: number;
  accuracy: number;
  timing: number;
  power: number;
  maxCombo: number;
  grade: string;
  topFeedback: string[];
  duration: number;
}

interface CoachingResponse {
  summary: string; // 1-2 sentence overall assessment
  strengths: string[]; // 2-3 bullet points
  improvements: string[]; // 2-3 actionable improvements
  nextGoal: string; // One specific goal for next session
  motivational: string; // Short motivational close
}

export async function getGeminiCoaching(
  session: SessionData,
): Promise<CoachingResponse | null> {
  const apiKey = (import.meta.env as Record<string, string>)[
    "VITE_GEMINI_API_KEY"
  ];
  if (!apiKey) return null;
  const prompt = buildPrompt(session);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(text) as CoachingResponse;
  } catch {
    return null;
  }
}

function buildPrompt(s: SessionData): string {
  return `You are ARIA, an elite AI athletic coach in the AURA ARENA fitness app.
A user just completed a ${s.discipline} session. Analyze their performance and respond in JSON only.

Performance data:
- Discipline: ${s.discipline}
- Score: ${s.finalScore}/100 (Grade: ${s.grade})
- Accuracy: ${s.accuracy}%, Timing: ${s.timing}%, Power: ${s.power}%
- Max Combo: ${s.maxCombo}
- Duration: ${Math.round(s.duration / 60)}min
- Form issues detected: ${s.topFeedback.join(", ") || "none"}

Respond with ONLY valid JSON matching this schema:
{"summary":"string","strengths":["string","string"],"improvements":["string","string"],"nextGoal":"string","motivational":"string"}`;
}

// Stream coaching (for real-time display)
export async function* streamGeminiCoaching(
  session: SessionData,
): AsyncGenerator<string> {
  const apiKey = (import.meta.env as Record<string, string>)[
    "VITE_GEMINI_API_KEY"
  ];
  if (!apiKey) return;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are ARIA, the AURA ARENA AI coach. Give a brief 2-sentence coaching tip for a ${session.discipline} athlete who scored ${session.finalScore}/100. Be encouraging and specific.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.8, maxOutputTokens: 128 },
        }),
      },
    );
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const json = JSON.parse(line.slice(6)) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) yield text;
        } catch {
          /* skip malformed */
        }
      }
    }
  } catch {
    /* silently fail */
  }
}
