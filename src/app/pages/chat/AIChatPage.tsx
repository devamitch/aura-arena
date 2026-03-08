// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Coach Chat
// AI priority chain: User's Gemini key → On-device Gemma 3 → Chrome Nano → Static
// BYOK: user provides their own Gemini API key (stored locally, NEVER in Supabase)
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { analytics, track } from "@lib/analytics";
import { createLogger } from "@lib/logger";
import {
  generateWithNano,
  isNanoAvailable,
  isOnDeviceLLMLoaded,
  generateOnDevice,
} from "@lib/mediapipe/onDeviceLLM";
import { callAI, DEFAULT_MODELS, PROVIDER_DISPLAY, PROVIDER_MODELS } from "@lib/ai/providers";
import { useAiModel, useAiProvider, useApiKeys, useUser } from "@store";
import { COACH_IMAGES, pickImage } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Crown,
  Lock,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const log = createLogger("AIChatPage");
const FREE_MSG_LIMIT = 5;
const STORAGE_KEY = "aura_chat_daily";

// ─── Coach personas ──────────────────────────────────────────────────────────

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

// ─── Static fallback responses ───────────────────────────────────────────────

const FALLBACK: Record<CoachId, string[]> = {
  aria: [
    "Focus on keeping your spine neutral during that movement — a slight forward tilt reduces power transfer by 30%.",
    "Your elbow angle looks good. Now work on keeping your shoulder blades retracted through the full range.",
    "Great session! Next drill: slow down the eccentric phase to build more motor control.",
    "Quality over speed. 10 perfect reps beat 50 sloppy ones every time.",
    "Check your foot placement — a wider stance will improve your base stability significantly.",
  ],
  max: [
    "Let's GO! Push through that plateau — your body adapts in 48 hours. Hit it again tomorrow.",
    "Power comes from the ground up. Drive through your heels and engage your glutes at peak contraction.",
    "I'm seeing hesitation. Champions don't negotiate with doubt — commit to every rep!",
    "You're 70% through the hardest part. Don't stop now, the gains are right here.",
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

// ─── AI Inference tiers ───────────────────────────────────────────────────────
// Tier 1: Active provider via unified callAI() (BYOK)
// Tier 2: On-device Gemma 3 (WebGPU, private, no key needed)
// Tier 3: Chrome Gemini Nano (window.ai, zero-download)
// Tier 4: Static fallback (always works)

interface ChatMessage { role: "user" | "assistant"; content: string; }

async function inferBestAvailable(
  messages: ChatMessage[],
  coachId: CoachId,
  systemPrompt: string,
  provider: import("@lib/ai/providers").AIProvider,
  apiKey: string,
): Promise<{ text: string; tier: string }> {
  // Tier 1 — user's chosen provider API key (BYOK)
  if (apiKey) {
    try {
      const resp = await callAI({
        provider,
        apiKey,
        messages,
        systemPrompt,
        maxTokens: 200,
        temperature: 0.8,
      });
      return { text: resp.text, tier: provider };
    } catch (err) {
      log.warn(`${provider} cloud failed, trying on-device`, err);
    }
  }
  // Tier 2 — on-device Gemma 3 (WebGPU)
  if (isOnDeviceLLMLoaded()) {
    try {
      const lastUser = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const prompt = `<start_of_turn>user\n${lastUser}\n<end_of_turn>\n<start_of_turn>model\n`;
      const text = await generateOnDevice(prompt);
      return { text: text.trim(), tier: "gemma-on-device" };
    } catch (err) {
      log.warn("On-device LLM failed, trying Nano", err);
    }
  }
  // Tier 3 — Chrome Gemini Nano (window.ai)
  const nanoOk = await isNanoAvailable();
  if (nanoOk) {
    try {
      const lastUser = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const text = await generateWithNano(lastUser, systemPrompt);
      return { text: text.trim(), tier: "gemini-nano" };
    } catch (err) {
      log.warn("Nano failed, using static fallback", err);
    }
  }
  // Tier 4 — static
  const pool = FALLBACK[coachId];
  return { text: pool[Math.floor(Math.random() * pool.length)], tier: "static" };
}

// ─── Daily message counter ────────────────────────────────────────────────────

function getDailyCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    if (date !== new Date().toDateString()) return 0;
    return count as number;
  } catch { return 0; }
}
function incrementDailyCount() {
  try {
    const count = getDailyCount() + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: new Date().toDateString(), count }));
  } catch { /* noop */ }
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "How do I improve my form?",
  "Give me a warm-up routine",
  "How to increase my score?",
  "Mental tips for competition",
  "Breathing technique advice",
  "Recovery after hard sessions",
];

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

function AiTierBadge({ tier }: { tier: string }) {
  // Provider tiers use their display info; special tiers have fixed entries
  const special: Record<string, { label: string; color: string }> = {
    "gemma-on-device": { label: "On-Device AI", color: "#00f0ff" },
    "gemini-nano":     { label: "Gemini Nano",  color: "#a855f7" },
    static:            { label: "Offline",       color: "#6b7280" },
  };
  const providerInfo = PROVIDER_DISPLAY[tier as keyof typeof PROVIDER_DISPLAY];
  const d = providerInfo
    ? { label: providerInfo.name, color: providerInfo.color }
    : (special[tier] ?? special.static);
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
      style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}30` }}
    >
      {d.label}
    </span>
  );
}

export default function AIChatPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { accentColor } = usePersonalization();
  const aiProvider = useAiProvider();
  const aiModel = useAiModel();
  const apiKeys = useApiKeys();
  const activeKey = apiKeys[aiProvider] ?? "";
  const isPremium = user?.isPremium ?? false;

  const [selectedCoachId, setSelectedCoachId] = useState<CoachId>("aria");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dailyCount, setDailyCount] = useState(getDailyCount);
  const [imgIdx, setImgIdx] = useState(0);
  const [lastTier, setLastTier] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const coach = COACHES.find((c) => c.id === selectedCoachId)!;
  const providerInfo = PROVIDER_DISPLAY[aiProvider];
  const currentModelId = aiModel || DEFAULT_MODELS[aiProvider];
  const currentModelLabel = PROVIDER_MODELS[aiProvider].find(m => m.id === currentModelId)?.label ?? currentModelId;
  // Premium OR user has a key for the active provider → unlimited; otherwise 5/day
  const isLocked = !isPremium && !activeKey && dailyCount >= FREE_MSG_LIMIT;
  const remaining = Math.max(0, FREE_MSG_LIMIT - dailyCount);
  void accentColor;

  useEffect(() => {
    const t = setInterval(() => setImgIdx((i) => i + 1), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const greetings: Record<CoachId, string> = {
      aria: "Hi! I'm Aria, your form analysis expert. What movement would you like to perfect today?",
      max: "Max here. Ready to push limits? Tell me your goal — let's build a plan to crush it.",
      sensei: "Greetings. I am Sensei. Breathe. What aspect of your practice shall we refine?",
    };
    setMessages([{ role: "assistant", content: greetings[selectedCoachId] }]);
  }, [selectedCoachId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || isLocked) return;
      const userMsg: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      if (!activeKey && !isPremium) { incrementDailyCount(); setDailyCount(getDailyCount()); }
      try {
        const { text: reply, tier } = await inferBestAvailable(
          [...messages, userMsg], coach.id, coach.persona, aiProvider, activeKey,
        );
        setLastTier(tier);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        track("ai_chat_message", { coachId: coach.id, tier });
      } catch (err) {
        log.error("Chat error", err);
        analytics.errorOccurred("ai_chat", String(err));
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping, isLocked, coach, aiProvider, activeKey, isPremium],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="page pb-safe flex flex-col" style={{ background: "#040610", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-8 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${coach.color}40` }}>
          <img src={pickImage(coach.images, imgIdx)} alt={coach.name} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-white text-base leading-none">{coach.name}</h1>
            {isPremium && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
            {activeKey && <Zap className="w-3 h-3" style={{ color: providerInfo.color }} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-white/30 font-mono">{coach.role}</p>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ background: `${providerInfo.color}15`, color: providerInfo.color, border: `1px solid ${providerInfo.color}30` }}>
              {currentModelLabel}
            </span>
            {lastTier && <AiTierBadge tier={lastTier} />}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {COACHES.map((c) => (
            <button key={c.id} onClick={() => setSelectedCoachId(c.id)} className="w-8 h-8 rounded-xl text-base transition-all"
              style={selectedCoachId === c.id ? { background: `${c.color}20`, border: `1.5px solid ${c.color}50` } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {c.emoji}
            </button>
          ))}
          <button onClick={() => navigate("/settings/ai")} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Settings className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>
      </div>

      {/* Active provider banner */}
      {!activeKey && (
        <div className="flex-shrink-0 px-5 py-2.5 flex items-center gap-2" style={{ background: "rgba(0,240,255,0.04)", borderBottom: "1px solid rgba(0,240,255,0.08)" }}>
          <Brain className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <p className="text-[10px] text-white/40 flex-1">No key set — add one for unlimited AI</p>
          <button onClick={() => navigate("/settings/ai")} className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
            style={{ background: "rgba(0,240,255,0.12)", color: "#00f0ff" }}>
            AI Settings →
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ overscrollBehavior: "contain" }}>
        {messages.length <= 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] text-center mb-3">Quick questions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((q) => (
                <motion.button key={q} whileTap={{ scale: 0.95 }} onClick={() => sendMessage(q)} disabled={isLocked}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-medium"
                  style={{ background: `${coach.color}10`, border: `1px solid ${coach.color}25`, color: coach.color, opacity: isLocked ? 0.4 : 1 }}>
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl flex-shrink-0 overflow-hidden mt-1" style={{ border: `1px solid ${coach.color}30` }}>
                  <img src={pickImage(coach.images, 0)} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role === "user"
                  ? { background: `${coach.color}18`, border: `1px solid ${coach.color}30`, color: "rgba(255,255,255,0.88)", borderBottomRightRadius: 6 }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", borderBottomLeftRadius: 6 }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
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

      {/* Free tier counter */}
      {!isPremium && !activeKey && (
        <div className="flex-shrink-0 px-5 py-2">
          <div className="flex items-center justify-between px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[10px] font-mono text-white/30">{isLocked ? "Daily limit reached" : `${remaining} free messages today`}</span>
            </div>
            <button onClick={() => navigate("/settings/ai")} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(0,240,255,0.12)", color: "#00f0ff" }}>
              <Zap className="w-3 h-3" />Add key
            </button>
          </div>
        </div>
      )}

      {/* Locked overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0 mx-5 mb-2 rounded-2xl p-5 text-center" style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.2)" }}>
            <Lock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-white/70 text-sm font-bold mb-1">Daily limit reached</p>
            <p className="text-white/30 text-xs mb-3">Add an API key for unlimited AI coaching</p>
            <button onClick={() => { analytics.upgradeViewed("byok_chat"); navigate("/settings/ai"); }}
              className="px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 mx-auto"
              style={{ background: "linear-gradient(135deg,#00f0ff,#0070ff)", color: "#040914" }}>
              <Sparkles className="w-4 h-4" />AI Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isLocked ? "rgba(255,255,255,0.06)" : `${coach.color}25`}` }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isLocked ? "Add AI key to continue…" : `Ask ${coach.name} anything…`}
            disabled={isLocked || isTyping} rows={1}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20 resize-none leading-relaxed max-h-24 overflow-y-auto" />
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => sendMessage(input)} disabled={!input.trim() || isLocked || isTyping}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
            style={{ background: input.trim() && !isLocked ? coach.color : "rgba(255,255,255,0.06)", opacity: !input.trim() || isLocked ? 0.4 : 1 }}>
            <Send className="w-4 h-4" style={{ color: input.trim() && !isLocked ? "#040914" : "rgba(255,255,255,0.4)" }} />
          </motion.button>
        </div>
        <p className="text-center text-[9px] font-mono text-white/15 mt-2">
          {activeKey ? `${providerInfo.name} · BYOK · private` : isOnDeviceLLMLoaded() ? "On-device Gemma 3 · private" : "Add AI key for live coaching · or enable on-device model"}
        </p>
      </div>
    </div>
  );
}
