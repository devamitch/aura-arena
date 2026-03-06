// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Onboarding Page (MusicX-inspired)
// 6 steps: Intro → Discipline → Style → Level → Goals → Coach Name
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

const ACCENT = "#00f0ff";

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
    label: "Get Fit",
    desc: "Build strength and endurance",
    icon: "Dumbbell",
  },
  {
    id: "compete",
    label: "Compete",
    desc: "Win battles and climb ranks",
    icon: "Trophy",
  },
  {
    id: "skill",
    label: "Master Skills",
    desc: "Perfect technique and form",
    icon: "Target",
  },
  {
    id: "social",
    label: "Community",
    desc: "Connect with athletes worldwide",
    icon: "Users",
  },
];

const FREQUENCIES = [
  { id: 3, label: "3×/week", desc: "Casual" },
  { id: 5, label: "5×/week", desc: "Committed" },
  { id: 7, label: "Daily", desc: "Dedicated" },
];

const STEPS = [
  "Setup",
  "Discipline",
  "Style",
  "Level",
  "Goals",
  "Coach",
  "Confirm",
] as const;

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

  const disc = getDiscipline(disciplineId);
  const hasSubDisciplines = disc.subDisciplines.length > 0;

  const toggleGoal = (id: string) =>
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => {
    if (step === 2 && !hasSubDisciplines) {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const canAdvance = () => {
    if (step === 3) return !!experience;
    if (step === 4) return goals.length > 0;
    if (step === 5) return coachName.trim().length >= 2;
    return true;
  };

  const handleNext = () => {
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
    await generateWelcomeMessage(
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

  // ── Selection card helper ─────────────────────────────────────────────────
  const SelectCard = ({
    selected,
    onClick,
    children,
    className = "",
  }: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl p-4 transition-all active:scale-[0.97]",
        className,
      )}
      style={
        selected
          ? {
              background: `rgba(0,240,255,0.06)`,
              border: `1px solid rgba(0,240,255,0.25)`,
              boxShadow: `0 0 20px rgba(0,240,255,0.08)`,
            }
          : {
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }
      }
    >
      {children}
    </button>
  );

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* Background image — subtle */}
      <div className="absolute inset-0 opacity-40 z-0 pointer-events-none">
        <img
          src="/assets/images/generated/auth_thunder_bg_2.png"
          alt=""
          className="w-full h-full object-cover mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-[var(--background)]/40" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* ── Progress bar ── */}
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="h-full"
            style={{
              background: `linear-gradient(90deg, var(--ac), rgba(var(--ac-rgb, 0,240,255), 0.7))`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* ── Step indicator header ── */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={back}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-opacity",
              step === 0 ? "opacity-0 pointer-events-none" : "",
            )}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>

          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 20 : 8,
                  opacity: i <= step ? 1 : 0.25,
                }}
                className="h-1.5 rounded-full"
                style={{
                  background: i <= step ? ACCENT : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-white/25">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <AnimatePresence mode="wait">
            {/* Step 0: Setup Context */}
            {step === 0 && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12 min-h-[60vh] px-2"
              >
                <div className="w-24 h-24 mb-8 rounded-full flex items-center justify-center border border-[#00f0ff]/30 shadow-[0_0_40px_rgba(0,240,255,0.2)] bg-[#00f0ff]/5 relative">
                  <Bot className="w-10 h-10 text-[#00f0ff]" />
                  <div className="absolute inset-0 rounded-full border border-[##00f0ff]/50 animate-[spin_4s_linear_infinite] border-dashed" />
                </div>
                <h2 className="text-[32px] font-black leading-tight text-white mb-4 drop-shadow-md">
                  Initialize Your{" "}
                  <span className="text-gradient">AI Coach</span>
                </h2>
                <p className="text-[15px] font-medium text-white/70 leading-relaxed max-w-[300px] mb-8">
                  To accurately track your joints and score your realtime
                  movements, the Vision Engine needs to know your specific
                  discipline and skill level.
                </p>

                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                  <h3 className="font-bold text-white text-sm mb-3">
                    Calibration Sequence:
                  </h3>
                  <ul className="text-left text-[13px] text-white/50 space-y-2.5 font-medium ml-2">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#00f0ff]" /> 1.
                      Select primary arena discipline
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#00f0ff]" /> 2.
                      Define current athlete tier
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#00f0ff]" /> 3. Set
                      competitive goals
                    </li>
                  </ul>
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
                <h2 className="text-2xl font-black text-white mb-1">
                  Choose your <span className="text-gradient">discipline</span>
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Your primary training focus — you can add more later
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DISCIPLINES.map((d: any) => {
                    let bannerImg =
                      "/assets/images/generated/intro_martial_arts.png";
                    if (d.id === "boxing")
                      bannerImg =
                        "/assets/images/generated/banner_boxing_teal.png";
                    else if (d.id === "yoga")
                      bannerImg =
                        "/assets/images/generated/banner_yoga_teal.png";
                    else if (d.id === "dance")
                      bannerImg =
                        "/assets/images/generated/aura_arena_banner_dance.png";

                    return (
                      <SelectCard
                        key={d.id}
                        selected={disciplineId === d.id}
                        onClick={() => {
                          setDisciplineId(d.id);
                          setSubDisciplineId(undefined);
                        }}
                        className="h-32 !p-0 overflow-hidden relative group"
                      >
                        {/* Banner Image Background */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={bannerImg}
                            alt={d.name}
                            className="w-full h-full object-cover opacity-60 mix-blend-screen transition-transform duration-700 group-hover:scale-110"
                          />
                          {/* Gradient to ensure text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
                        </div>

                        {/* Content Foreground */}
                        <div className="relative z-10 flex flex-col justify-end h-full p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <DynamicIcon
                              name={d.icon}
                              className="w-5 h-5 drop-shadow-[0_0_8px_rgba(var(--ac-rgb, 0,240,255), 0.6)]"
                              style={{
                                color:
                                  disciplineId === d.id
                                    ? "var(--ac)"
                                    : "rgba(255,255,255,0.9)",
                              }}
                            />
                            <p className="font-black text-white text-sm tracking-wide drop-shadow-md">
                              {d.name}
                            </p>
                          </div>
                          {d.subDisciplines.length > 0 && (
                            <p className="text-[10px] font-bold text-[var(--ac)] uppercase tracking-widest opacity-80">
                              {d.subDisciplines.length} styles
                            </p>
                          )}
                        </div>
                      </SelectCard>
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
                <h2 className="text-2xl font-black text-white mb-1">
                  Choose your <span className="text-gradient">style</span>
                </h2>
                <p className="text-sm text-white/35 mb-4">
                  Pick a specific {disc.name} style, or train all
                </p>
                <button
                  onClick={() => {
                    setSubDisciplineId(undefined);
                    next();
                  }}
                  className="w-full mb-4 py-3.5 rounded-2xl text-sm text-white/50 font-semibold text-center active:scale-[0.97]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
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

            {/* Step 3: Experience level */}
            {step === 3 && (
              <motion.div
                key="exp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Your <span className="text-gradient">experience</span> level
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  We'll personalise drills and AI coaching
                </p>
                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectCard
                      key={l.id}
                      selected={experience === l.id}
                      onClick={() => setExperience(l.id)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{l.label}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {l.desc}
                          </p>
                        </div>
                        {experience === l.id && (
                          <CheckCircle
                            className="w-5 h-5 flex-shrink-0"
                            style={{ color: "var(--ac)" }}
                          />
                        )}
                      </div>
                    </SelectCard>
                  ))}
                </div>

                {/* Training frequency */}
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white/60 mb-3">
                    Training frequency
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENCIES.map((f) => (
                      <SelectCard
                        key={f.id}
                        selected={frequency === f.id}
                        onClick={() => setFrequency(f.id)}
                        className="text-center"
                      >
                        <p className="text-sm font-bold text-white">
                          {f.label}
                        </p>
                        <p className="text-[10px] text-white/25">{f.desc}</p>
                      </SelectCard>
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
                <h2 className="text-2xl font-black text-white mb-1">
                  What <span className="text-gradient">drives</span> you?
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Select all that apply
                </p>
                <div className="grid grid-cols-2 gap-3 pb-8">
                  {GOALS.map((g) => {
                    const on = goals.includes(g.id);
                    return (
                      <SelectCard
                        key={g.id}
                        selected={on}
                        onClick={() => toggleGoal(g.id)}
                      >
                        <div
                          className="mb-2"
                          style={{
                            color: on ? "var(--ac)" : "rgba(255,255,255,0.25)",
                          }}
                        >
                          <DynamicIcon
                            name={g.icon as any}
                            className="w-6 h-6"
                          />
                        </div>
                        <p className="text-sm font-bold text-white">
                          {g.label}
                        </p>
                        <p className="text-[10px] text-white/25 mt-0.5">
                          {g.desc}
                        </p>
                      </SelectCard>
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
                <h2 className="text-2xl font-black text-white mb-1">
                  Name your <span className="text-gradient">AI Coach</span>
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Your coach will give you personalised {disc.name} feedback
                </p>
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="w-24 h-24 rounded-[2rem] flex items-center justify-center relative shadow-lg"
                    style={{
                      background: "rgba(var(--ac-rgb, 0,240,255), 0.06)",
                      border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.15)",
                      boxShadow:
                        "0 0 40px rgba(var(--ac-rgb, 0,240,255), 0.12)",
                    }}
                  >
                    <Bot className="w-12 h-12" style={{ color: "var(--ac)" }} />
                  </div>
                </div>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="e.g. Aria, Max, Sensei…"
                  maxLength={20}
                  className="w-full h-14 rounded-2xl px-5 text-white font-medium text-[15px] focus:outline-none transition-all placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border:
                      coachName.length >= 2
                        ? "1px solid var(--ac)"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <div className="flex gap-2 flex-wrap justify-center mt-4">
                  {["Aria", "Max", "Sensei", "Coach K", "Zara", "Atlas"].map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setCoachName(n)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                        style={{
                          background:
                            coachName === n
                              ? "rgba(0,240,255,0.1)"
                              : "rgba(255,255,255,0.04)",
                          border:
                            coachName === n
                              ? "1px solid rgba(0,240,255,0.25)"
                              : "1px solid rgba(255,255,255,0.06)",
                          color:
                            coachName === n ? ACCENT : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {n}
                      </button>
                    ),
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 6: Confirm */}
            {step === 6 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="py-6 flex flex-col items-center"
              >
                <h2 className="text-3xl font-black text-white mb-2 text-center drop-shadow-lg">
                  <span className="text-gradient">Ready</span> for Battle
                </h2>
                <p className="text-[15px] font-medium text-white/50 mb-8 text-center max-w-[280px]">
                  Coach {coachName} is fully calibrated and waiting in the
                  arena.
                </p>

                <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <DynamicIcon name={disc.icon} className="w-24 h-24" />
                  </div>

                  <h3 className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest mb-4">
                    Athlete Profile
                  </h3>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-1">
                        Discipline
                      </p>
                      <p className="text-lg font-bold text-white tracking-tight">
                        {disc.name}{" "}
                        {hasSubDisciplines && subDisciplineId
                          ? `(${disc.subDisciplines.find((s) => s.id === subDisciplineId)?.name})`
                          : ""}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <div>
                        <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-1">
                          Tier Level
                        </p>
                        <p className="text-sm font-bold text-white">
                          {
                            EXPERIENCE_LEVELS.find((l) => l.id === experience)
                              ?.label
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-1">
                          Frequency
                        </p>
                        <p className="text-sm font-bold text-white">
                          {FREQUENCIES.find((f) => f.id === frequency)?.label}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-2">
                        Primary Drivers
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {goals.map((gId) => {
                          const lg = GOALS.find((g) => g.id === gId);
                          return lg ? (
                            <span
                              key={gId}
                              className="px-2.5 py-1 rounded border border-white/10 bg-white/5 text-xs font-semibold text-white/90"
                            >
                              {lg.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Next / Finish button ── */}
        <div className="px-5 pb-8 pt-3">
          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className={cn(
              "w-full py-[18px] rounded-full font-black text-[15px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              !canAdvance() && "opacity-30 cursor-not-allowed",
            )}
            style={
              canAdvance()
                ? {
                    background: `var(--primary-gradient)`,
                    color: "#040914",
                    boxShadow: `0 0 30px rgba(var(--ac-rgb, 0,240,255), 0.4)`,
                  }
                : {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.3)",
                  }
            }
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-[var(--background)]/40 border-t-[var(--background)] rounded-full animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <>Enter Arena</>
            ) : (
              <>
                Continue{" "}
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
      {/* NEW CLOSED DIV */}
    </div>
  );
}
