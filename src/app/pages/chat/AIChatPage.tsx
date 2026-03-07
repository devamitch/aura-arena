// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Coach Chat (Premium)
// Powered by Google Gemini. Falls back to local responses without API key.
// Free users: 5 messages/day · Premium: unlimited
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { analytics, track } from "@lib/analytics";
import { createLogger } from "@lib/logger";
import { useUser } from "@store";
import { COACH_IMAGES, pickImage } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const log = createLogger("AIChatPage");

const GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as
  | string
  | undefined;
const FREE_MSG_LIMIT = 5;
const STORAGE_KEY = "aura_chat_daily";

// ─── Coach personas ─────────────────────────────────────────────────────────

const COACHES = [
  {
    id: "aria",
    name: "Aria",
    role: "Form Expert",
    color: "#00f0ff",
    emoji: "🤖",
    images: COACH_IMAGES.Aria,
    persona:
      "You are Aria, an elite AI form coach in Aura Arena. You specialise in biomechanics, posture correction, and movement efficiency. You give precise, actionable feedback. You are encouraging but data-driven. Keep responses under 120 words unless the user asks for detail.",
  },
  {
    id: "max",
    name: "Max",
    role: "Power Trainer",
    color: "#f97316",
    emoji: "💪",
    images: COACH_IMAGES.Max,
    persona:
      "You are Max, a high-intensity power coach in Aura Arena. You specialise in strength, explosiveness, and athletic performance. You are motivating, direct, and push athletes to their limits safely. Keep responses under 120 words unless the user asks for detail.",
  },
  {
    id: "sensei",
    name: "Sensei",
    role: "Zen Master",
    color: "#a855f7",
    emoji: "🧘",
    images: COACH_IMAGES.Sensei,
    persona:
      "You are Sensei, a mindful performance coach in Aura Arena. You blend martial arts philosophy, breath-work, and mental conditioning. You are calm, wise, and speak with measured clarity. Keep responses under 120 words unless the user asks for detail.",
  },
] as const;

type CoachId = (typeof COACHES)[number]["id"];

// ─── Fallback responses (no API key) ────────────────────────────────────────

const FALLBACK: Record<CoachId, string[]> = {
  aria: [
    "Focus on keeping your spine neutral during that movement — a slight forward tilt can reduce power transfer by 30%.",
    "Your elbow angle looks good. Now work on keeping your shoulder blades retracted through the full range.",
    "Great session! Next drill: slow down the eccentric phase to build more motor control.",
    "Remember: quality over speed. 10 perfect reps beat 50 sloppy ones every time.",
    "Check your foot placement — a wider stance will improve your base stability significantly.",
  ],
  max: [
    "Let's GO! Push through that plateau — your body adapts in 48 hours. Hit it again tomorrow.",
    "Power comes from the ground up. Drive through your heels and engage your glutes at peak contraction.",
    "I'm seeing hesitation. Champions don't negotiate with doubt — commit to every rep!",
    "You're 70% of the way through the hardest part. Don't stop now, the gains are right here.",
    "Explosive speed drill: 3 sets of 8 at 90% max effort, 90s rest. Load that ATP system.",
  ],
  sensei: [
    "Breathe first. Every movement flows from the breath — inhale on the preparation, exhale on the effort.",
    "The body follows the mind. Visualise perfect form for 30 seconds before your next set.",
    "Stillness is not weakness. Recovery is where the warrior is reborn.",
    "Your greatest opponent is the version of you that stopped yesterday. Today, you go further.",
    "Find the rhythm in your movement. When technique becomes instinct, that is mastery.",
  ],
};

// ─── Gemini API call ─────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function callGemini(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
      }),
    },
  );

  if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
  const data = await resp.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "I couldn't generate a response. Please try again."
  );
}

// ─── Daily message counter ───────────────────────────────────────────────────

function getDailyCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    if (date !== new Date().toDateString()) return 0;
    return count as number;
  } catch {
    return 0;
  }
}

function incrementDailyCount() {
  try {
    const count = getDailyCount() + 1;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: new Date().toDateString(), count }),
    );
  } catch {
    /* noop */
  }
}

// ─── Quick prompt suggestions ────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "How do I improve my form?",
  "Give me a warm-up routine",
  "How to increase my score?",
  "Mental tips for competition",
  "Breathing technique advice",
  "Recovery after hard sessions",
];

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AIChatPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { accentColor } = usePersonalization();
  const isPremium = user?.isPremium ?? false;

  const [selectedCoachId, setSelectedCoachId] = useState<CoachId>("aria");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dailyCount, setDailyCount] = useState(getDailyCount);
  const [imgIdx, setImgIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const coach = COACHES.find((c) => c.id === selectedCoachId)!;
  const isLocked = !isPremium && dailyCount >= FREE_MSG_LIMIT;

  // Image cycling for coach avatar
  useEffect(() => {
    const t = setInterval(() => setImgIdx((i) => i + 1), 3000);
    return () => clearInterval(t);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Greeting on coach change
  useEffect(() => {
    const greetings: Record<CoachId, string> = {
      aria: "Hi! I'm Aria, your form analysis expert. What movement would you like to perfect today?",
      max: "Max here. Ready to push limits? Tell me your goal — let's build a plan to crush it.",
      sensei:
        "Greetings. I am Sensei. Breathe. What aspect of your practice shall we refine?",
    };
    setMessages([{ role: "assistant", content: greetings[selectedCoachId] }]);
  }, [selectedCoachId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;
      if (isLocked) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      incrementDailyCount();
      setDailyCount(getDailyCount());

      try {
        let reply: string;

        if (GEMINI_KEY) {
          const history = [...messages, userMsg];
          reply = await callGemini(history, coach.persona);
          log.info("Gemini response received");
        } else {
          // Fallback: pick a contextual canned response
          await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
          const pool = FALLBACK[coach.id];
          reply = pool[Math.floor(Math.random() * pool.length)];
          log.info("Using fallback response (no Gemini key)");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        track("ai_chat_message", {
          coachId: coach.id,
          hasGemini: !!GEMINI_KEY,
        });
      } catch (err) {
        log.error("Chat error", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
        analytics.errorOccurred("ai_chat", String(err));
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping, isLocked, coach],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const remaining = Math.max(0, FREE_MSG_LIMIT - dailyCount);

  return (
    <div className="page pb-safe flex flex-col" style={{ background: "#040610", minHeight: "100dvh" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 pt-8 pb-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>

        {/* Coach avatar cycling */}
        <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${coach.color}40` }}>
          <img
            src={pickImage(coach.images, imgIdx)}
            alt={coach.name}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-white text-base leading-none">{coach.name}</h1>
            {isPremium && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
          </div>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">{coach.role}</p>
        </div>

        {/* Coach selector pills */}
        <div className="flex gap-1.5 flex-shrink-0">
          {COACHES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCoachId(c.id)}
              className="w-8 h-8 rounded-xl text-base transition-all"
              style={
                selectedCoachId === c.id
                  ? { background: `${c.color}20`, border: `1.5px solid ${c.color}50` }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {c.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ overscrollBehavior: "contain" }}>
        {/* Quick prompts — shown when only greeting */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] text-center mb-3">
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((q) => (
                <motion.button
                  key={q}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(q)}
                  disabled={isLocked}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-medium"
                  style={{
                    background: `${coach.color}10`,
                    border: `1px solid ${coach.color}25`,
                    color: coach.color,
                    opacity: isLocked ? 0.4 : 1,
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-xl flex-shrink-0 overflow-hidden mt-1"
                  style={{ border: `1px solid ${coach.color}30` }}
                >
                  <img src={pickImage(coach.images, 0)} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div
                className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: `${coach.color}18`,
                        border: `1px solid ${coach.color}30`,
                        color: "rgba(255,255,255,0.88)",
                        borderBottomRightRadius: 6,
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.75)",
                        borderBottomLeftRadius: 6,
                      }
                }
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 rounded-xl flex-shrink-0 overflow-hidden" style={{ border: `1px solid ${coach.color}30` }}>
                <img src={pickImage(coach.images, 0)} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 6 }}>
                <TypingIndicator color={coach.color} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Free tier limit warning */}
      {!isPremium && (
        <div className="flex-shrink-0 px-5 py-2">
          <div
            className="flex items-center justify-between px-4 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[10px] font-mono text-white/30">
                {isLocked ? "Daily limit reached" : `${remaining} free messages today`}
              </span>
            </div>
            <button
              onClick={() => {
                analytics.upgradeViewed("premium_chat");
                navigate("/profile");
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
            >
              <Crown className="w-3 h-3" />
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Locked overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 mx-5 mb-2 rounded-2xl p-5 text-center"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <Lock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-white/70 text-sm font-bold mb-1">Daily limit reached</p>
            <p className="text-white/30 text-xs mb-3">Upgrade to Premium for unlimited AI coaching</p>
            <button
              onClick={() => {
                analytics.upgradeViewed("premium_chat");
                navigate("/profile");
              }}
              className="px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 mx-auto"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#040914" }}
            >
              <Sparkles className="w-4 h-4" />
              Go Premium
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 pb-6 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : `${coach.color}25`}`,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLocked ? "Upgrade to continue chatting…" : `Ask ${coach.name} anything…`}
            disabled={isLocked || isTyping}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20 resize-none leading-relaxed max-h-24 overflow-y-auto"
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLocked || isTyping}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
            style={{
              background: input.trim() && !isLocked ? coach.color : "rgba(255,255,255,0.06)",
              opacity: !input.trim() || isLocked ? 0.4 : 1,
            }}
          >
            <Send className="w-4 h-4" style={{ color: input.trim() && !isLocked ? "#040914" : "rgba(255,255,255,0.4)" }} />
          </motion.button>
        </div>

        {!GEMINI_KEY && (
          <p className="text-center text-[9px] font-mono text-white/15 mt-2">
            Set VITE_GEMINI_API_KEY for live AI responses
          </p>
        )}
      </div>
    </div>
  );
}
