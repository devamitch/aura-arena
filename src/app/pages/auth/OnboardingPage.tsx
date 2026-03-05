// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Onboarding Page
// 5 steps: Discipline → Sub-style → Experience → Goals → Coach Name
// ═══════════════════════════════════════════════════════════════════════════════

import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { generateWelcomeMessage } from "@lib/gemini";
import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import { DISCIPLINES, getDiscipline } from "@utils/constants/disciplines";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "Just starting, building foundations",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "Regular training, improving consistently",
  },
  {
    id: "advanced",
    label: "Advanced",
    desc: "Serious athlete, competitive mindset",
  },
  {
    id: "professional",
    label: "Professional",
    desc: "Elite level, performance-focused",
  },
] as const;

const GOALS = [
  {
    id: "fitness",
    label: "💪 Get Fit",
    desc: "Build strength and endurance",
    icon: "Dumbbell",
  },
  {
    id: "compete",
    label: "🏆 Compete",
    desc: "Win battles and climb ranks",
    icon: "Trophy",
  },
  {
    id: "skill",
    label: "🎯 Master Skills",
    desc: "Perfect technique and form",
    icon: "Target",
  },
  {
    id: "social",
    label: "🌍 Community",
    desc: "Connect with athletes worldwide",
    icon: "Users",
  },
];

const FREQUENCIES = [
  { id: 3, label: "3× / week", desc: "Casual" },
  { id: 5, label: "5× / week", desc: "Committed" },
  { id: 7, label: "Daily", desc: "Dedicated" },
];

const STEPS = [
  "Intro",
  "Discipline",
  "Style",
  "Level",
  "Goals",
  "Coach",
] as const;

const INTRO_SLIDES = [
  {
    title: "Welcome to AURA ARENA",
    desc: "The world's first AI-powered performance area where your movement is your controller.",
    icon: "logo.png", // special case for logo
    color: "#00f0ff",
  },
  {
    title: "AI Real-time Scoring",
    desc: "Our vision engine tracks every joint and gesture, giving you instant credit for technique.",
    icon: "Zap",
    color: "#a855f7",
  },
  {
    title: "Compete Globally",
    desc: "Climb the ranks in your discipline and battle athletes from around the world.",
    icon: "Swords",
    color: "#f59e0b",
  },
];

// Removed DISCIPLINE_ICONS as it's replaced by DynamicIcon
// Removed GOAL_ICONS as it's replaced by DynamicIcon

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { updateUser } = useStore();

  const [step, setStep] = useState(0);
  const [disciplineId, setDisciplineId] = useState<DisciplineId>("boxing");
  const [subDisciplineId, setSubDisciplineId] = useState<
    SubDisciplineId | undefined
  >();
  const [experience, setExperience] = useState<string>("beginner");
  const [goals, setGoals] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(3);
  const [coachName, setCoachName] = useState("");
  const [saving, setSaving] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const disc = getDiscipline(disciplineId);
  const hasSubDisciplines = disc.subDisciplines.length > 0;

  const toggleGoal = (id: string) =>
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    if (step === 0 && slideIdx > 0) {
      setSlideIdx((s) => s - 1);
      return;
    }
    if (step === 2 && !hasSubDisciplines) {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const canAdvance = () => {
    // 0: Intro, 1: Discipline, 2: Style (Sub-discipline)
    if (step === 3) return !!experience;
    if (step === 4) return goals.length > 0;
    if (step === 5) return coachName.trim().length >= 2;
    return true;
  };

  const handleNext = () => {
    if (step === 0 && slideIdx < INTRO_SLIDES.length - 1) {
      setSlideIdx((s) => s + 1);
      return;
    }
    // Skip style step if no sub-disciplines (Step 2 is Style)
    if (step === 1 && !hasSubDisciplines) {
      setStep(3);
      return;
    }
    if (step === STEPS.length - 1) {
      handleFinish();
      return;
    }
    next();
  };

  const handleFinish = async () => {
    setSaving(true);
    const _welcomeMsg = await generateWelcomeMessage(
      disciplineId,
      subDisciplineId,
      experience,
      goals,
      user?.displayName ?? "Athlete",
    ).catch(() => "");

    updateUser({
      id: user?.id ?? "guest",
      email: user?.email ?? "",
      displayName: user?.displayName ?? "Athlete",
      username: user?.username ?? "guest",
      arenaName: user?.arenaName ?? "Guest",
      discipline: disciplineId,
      subDiscipline: subDisciplineId as any,
      experienceLevel: experience as any,
      goals,
      trainingFrequency: frequency,
      aiCoachName: coachName,
      onboardingComplete: true,
      xp: user?.xp ?? 0,
      totalPoints: user?.totalPoints ?? 0,
      sessionsCompleted: user?.sessionsCompleted ?? 0,
      pveWins: user?.pveWins ?? 0,
      pveLosses: user?.pveLosses ?? 0,
      winStreak: user?.winStreak ?? 0,
      averageScore: user?.averageScore ?? 0,
      bestScore: user?.bestScore ?? 0,
      bio: user?.bio ?? "",
      lastActiveDate: user?.lastActiveDate ?? "",
      avatarUrl: user?.avatarUrl ?? "",
      country: user?.country ?? "UN",
      sessionDuration: user?.sessionDuration ?? 0,
      tier: user?.tier ?? "bronze",
    });

    setSaving(false);
    navigate("/home", { replace: true });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-void flex flex-col plasma-bg">
      {/* Progress bar */}
      <div className="h-0.5 bg-s1">
        <motion.div
          className="h-full transition-all"
          style={{ width: `${progress}%`, background: disc.color }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={back}
          disabled={step === 0}
          className={cn(
            "text-t3 transition-opacity",
            step === 0 && "opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-6" : i < step ? "w-3" : "w-3 bg-s2",
              )}
              style={{ background: i <= step ? disc.color : undefined }}
            />
          ))}
        </div>
        <p className="text-xs text-t3 font-mono">
          {step + 1}/{STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 0: Intro Carousel */}
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-10"
            >
              <div className="flex-1 w-full flex flex-col items-center justify-center gap-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIdx}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50)
                        setSlideIdx((s) => (s + 1) % INTRO_SLIDES.length);
                      if (info.offset.x > 50)
                        setSlideIdx(
                          (s) =>
                            (s - 1 + INTRO_SLIDES.length) % INTRO_SLIDES.length,
                        );
                    }}
                    className="w-full max-w-sm aspect-square rounded-[3rem] bg-s1 border border-b1 flex flex-col items-center justify-center p-8 relative overflow-hidden group cursor-grab active:cursor-grabbing"
                  >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative z-10 mb-8 shadow-primary/20"
                    >
                      {INTRO_SLIDES[slideIdx].icon.endsWith(".png") ? (
                        <div className="w-24 h-24 rounded-3xl glass p-4 border-white/20">
                          <img
                            src={`/${INTRO_SLIDES[slideIdx].icon}`}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <DynamicIcon
                          name={INTRO_SLIDES[slideIdx].icon}
                          className="w-24 h-24 text-primary"
                        />
                      )}
                    </motion.div>

                    <h3 className="text-3xl font-black text-t1 mb-4 leading-tight">
                      {INTRO_SLIDES[slideIdx].title
                        .split(" ")
                        .slice(0, 2)
                        .join(" ")}
                      <br />
                      <span className="text-primary">
                        {INTRO_SLIDES[slideIdx].title
                          .split(" ")
                          .slice(2)
                          .join(" ")}
                      </span>
                    </h3>
                    <p className="text-t3 text-sm leading-relaxed px-4">
                      {INTRO_SLIDES[slideIdx].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-2">
                  {INTRO_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIdx(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === slideIdx ? "bg-primary w-6" : "bg-s2",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="w-full space-y-4 mt-8">
                <div className="flex items-center justify-center gap-6 text-t3 text-[10px] uppercase tracking-widest font-mono">
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon name="Camera" className="w-3 h-3" /> Vision AI
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon name="Trophy" className="w-3 h-3" /> Real-time
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon name="Users" className="w-3 h-3" /> Global
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Discipline */}
          {step === 1 && (
            <motion.div
              key="disc"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-2xl font-black text-t1 mb-1">
                Choose your discipline
              </h2>
              <p className="text-sm text-t3 mb-6">
                Your primary training focus — you can add more later
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DISCIPLINES.map((d: any) => {
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDisciplineId(d.id);
                        setSubDisciplineId(undefined);
                      }}
                      className={cn(
                        "rounded-2xl p-4 text-left border-2 transition-all active:scale-95",
                        disciplineId === d.id ? "" : "bg-s1 border-b1",
                      )}
                      style={
                        disciplineId === d.id
                          ? {
                              borderColor: d.color,
                              background: `${d.color}12`,
                              boxShadow: `0 0 20px ${d.color}25`,
                            }
                          : {}
                      }
                    >
                      <div
                        className="mb-2"
                        style={{
                          color: disciplineId === d.id ? d.color : "var(--t3)",
                        }}
                      >
                        <DynamicIcon name={d.icon} className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-t1 text-sm">{d.name}</p>
                      {d.subDisciplines.length > 0 && (
                        <p className="text-[10px] text-t3 mt-0.5">
                          {d.subDisciplines.length} styles
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Sub-style */}
          {step === 2 && hasSubDisciplines && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-2xl font-black text-t1 mb-1">
                Choose your style
              </h2>
              <p className="text-sm text-t3 mb-4">
                Pick a specific {disc.name} style, or train all styles
              </p>
              <button
                onClick={() => {
                  setSubDisciplineId(undefined);
                  next();
                }}
                className="w-full mb-4 py-3 rounded-xl bg-s1 border border-b1 text-sm text-t2 font-semibold text-center active:scale-95"
              >
                All {disc.name} styles (no preference)
              </button>
              <SubDisciplineSelector
                disciplineId={disciplineId}
                selected={subDisciplineId}
                onSelect={(id) => {
                  setSubDisciplineId(id);
                  next();
                }}
              />
            </motion.div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <motion.div
              key="exp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-2xl font-black text-t1 mb-1">
                Your experience level
              </h2>
              <p className="text-sm text-t3 mb-6">
                We'll personalise drills and AI coaching
              </p>
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setExperience(l.id)}
                    className={cn(
                      "w-full text-left rounded-2xl p-4 border-2 transition-all active:scale-95",
                      experience === l.id ? "" : "bg-s1 border-b1",
                    )}
                    style={
                      experience === l.id
                        ? {
                            borderColor: disc.color,
                            background: `${disc.color}10`,
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-t1">{l.label}</p>
                        <p className="text-xs text-t3 mt-0.5">{l.desc}</p>
                      </div>
                      {experience === l.id && (
                        <CheckCircle
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: disc.color }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-t2 mb-3">
                  Training frequency
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={cn(
                        "py-3 rounded-xl border-2 text-center transition-all active:scale-95",
                        frequency === f.id ? "" : "bg-s1 border-b1",
                      )}
                      style={
                        frequency === f.id
                          ? {
                              borderColor: disc.color,
                              background: `${disc.color}10`,
                            }
                          : {}
                      }
                    >
                      <p className="text-sm font-bold text-t1">{f.label}</p>
                      <p className="text-[10px] text-t3">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-2xl font-black text-t1 mb-1">
                What drives you?
              </h2>
              <p className="text-sm text-t3 mb-6">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3 pb-8">
                {GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  const iconName = (g as any).icon || "Target";
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        "rounded-2xl p-4 text-left border-2 transition-all active:scale-95",
                        on ? "" : "bg-s1 border-b1",
                      )}
                      style={
                        on
                          ? {
                              borderColor: disc.color,
                              background: `${disc.color}10`,
                            }
                          : {}
                      }
                    >
                      <div
                        className="mb-2"
                        style={{ color: on ? disc.color : "var(--t3)" }}
                      >
                        <DynamicIcon name={iconName} className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-t1">
                        {g.label.split(" ").slice(1).join(" ")}
                      </p>
                      <p className="text-[10px] text-t3 mt-0.5">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 5: Coach name */}
          {step === 5 && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <h2 className="text-2xl font-black text-t1 mb-1">
                Name your AI Coach
              </h2>
              <p className="text-sm text-t3 mb-6">
                Your coach will give you personalised {disc.name} feedback after
                every session
              </p>
              <div
                className="flex items-center justify-center w-24 h-24 rounded-3xl mx-auto mb-6 text-primary shadow-2xl relative group"
                style={{
                  background: `${disc.color}20`,
                  boxShadow: `0 0 30px ${disc.color}30`,
                }}
              >
                <Bot className="w-12 h-12" />
                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-3xl" />
              </div>
              <input
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="e.g. Aria, Max, Sensei…"
                maxLength={20}
                className="w-full bg-s1 border border-b1 rounded-xl px-4 py-4 text-t1 text-lg text-center font-bold placeholder:text-t3 focus:outline-none focus:border-opacity-60 transition-colors"
                style={{ "--tw-border-opacity": 1 } as any}
              />
              <div className="flex gap-2 flex-wrap justify-center mt-4">
                {["Aria", "Max", "Sensei", "Coach K", "Zara", "Atlas"].map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setCoachName(n)}
                      className="px-3 py-1.5 rounded-full bg-s1 border border-b1 text-xs text-t2 hover:text-t1 transition-colors"
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next / Finish button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-lg text-void flex items-center justify-center gap-2 transition-all",
            !canAdvance() && "opacity-40 cursor-not-allowed",
          )}
          style={
            canAdvance()
              ? {
                  background: `linear-gradient(135deg, ${disc.color}, ${disc.color}bb)`,
                  boxShadow: `0 0 30px ${disc.color}50`,
                }
              : { background: "#374151" }
          }
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-void/40 border-t-void rounded-full animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>
              Let's Go! <CheckCircle className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
