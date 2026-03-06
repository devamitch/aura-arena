// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Onboarding (premium multi-step flow)
// ═══════════════════════════════════════════════════════════════════════════════

import { AvatarCanvas } from "@components/3d/AvatarCanvas";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { generateWelcomeMessage } from "@lib/gemini";
import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import {
  DISCIPLINE_ATHLETE,
  DISCIPLINE_BANNER,
  PREMIUM_ASSETS,
} from "@utils/assets";
import { DISCIPLINES, getDiscipline } from "@utils/constants/disciplines";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    title: "Rookie",
    desc: "Just starting my journey.",
    badge: PREMIUM_ASSETS.BADGES.BEGINNER,
  },
  {
    id: "intermediate",
    title: "Amateur",
    desc: "I train regularly.",
    badge: PREMIUM_ASSETS.BADGES.INTERMEDIATE,
  },
  {
    id: "advanced",
    title: "Pro",
    desc: "I compete at a high level.",
    badge: PREMIUM_ASSETS.BADGES.ADVANCED,
  },
  {
    id: "expert",
    title: "Elite",
    desc: "I am a master of my craft.",
    badge: PREMIUM_ASSETS.BADGES.PROFESSIONAL,
  },
] as const;

const GOALS = [
  {
    id: "fitness",
    title: "Fitness",
    desc: "Build muscle, improve stamina.",
    icon: PREMIUM_ASSETS.GOALS.FITNESS,
  },
  {
    id: "compete",
    title: "Competition",
    desc: "Climb ranks, win tournaments.",
    icon: PREMIUM_ASSETS.GOALS.COMPETE,
  },
  {
    id: "skills",
    title: "Skill Master",
    desc: "Perfect form, learn technique.",
    icon: PREMIUM_ASSETS.GOALS.SKILLS,
  },
  {
    id: "social",
    title: "Community",
    desc: "Train with friends, join crew.",
    icon: PREMIUM_ASSETS.GOALS.COMMUNITY,
  },
];

const FREQUENCIES = [
  { id: 3, label: "3×/week", desc: "Casual" },
  { id: 5, label: "5×/week", desc: "Committed" },
  { id: 7, label: "Daily", desc: "Dedicated" },
];

const COACHES = [
  {
    id: "Aria",
    name: "ARIA AI",
    motto: "Train smart, not just hard.",
    img: PREMIUM_ASSETS.COACHES.ARIA,
    desc: "Balanced",
    color: "var(--ac)",
  },
  {
    id: "Max",
    name: "MAX",
    motto: "Unleash your inner power.",
    img: PREMIUM_ASSETS.COACHES.MAX,
    desc: "Power",
    color: "#f43f5e",
  },
  {
    id: "Sensei",
    name: "SENSEI",
    motto: "Master the art of focus.",
    img: PREMIUM_ASSETS.COACHES.SENSEI,
    desc: "Focus",
    color: "#22c55e",
  },
];

const STEPS = [
  "Setup",
  "Discipline",
  "Style",
  "Level",
  "Goals",
  "Avatar",
  "Coach",
  "Confirm",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

const CardGlass = ({
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
            background: "rgba(0,240,255,0.06)",
            border: "1px solid rgba(0,240,255,0.30)",
            boxShadow: "0 0 20px rgba(0,240,255,0.08)",
          }
        : {
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }
    }
  >
    {children}
  </button>
);

const GradientLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ac)] to-[#a855f7]">
    {children}
  </span>
);

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { updateUser, setAvatarConfig } = useStore();

  const [step, setStep] = useState(0);
  const [disciplineId, setDisciplineId] = useState<DisciplineId>("boxing");
  const [subDisciplineId, setSubDisciplineId] = useState<
    SubDisciplineId | undefined
  >();
  const [experience, setExperience] = useState<string>("beginner");
  const [goals, setGoals] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(3);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "/assets/models/avatar.vrm",
  );
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
      avatarUrl: avatarUrl,
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
      country: user?.country ?? "UN",
      sessionDuration: user?.sessionDuration ?? 0,
      tier: user?.tier ?? "bronze",
    });

    setSaving(false);
    navigate("/home", { replace: true });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#040610" }}
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.AUTH_BG}
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,16,0.6) 0%, rgba(4,6,16,0.88) 50%, rgba(4,6,16,1) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="h-full"
            style={{
              background: "linear-gradient(90deg, var(--ac), var(--ac2))",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={back}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-opacity",
              step === 0 ? "opacity-0 pointer-events-none" : "",
            )}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>

          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 20 : 8,
                  opacity: i <= step ? 1 : 0.2,
                }}
                className="h-1.5 rounded-full"
                style={{
                  background:
                    i <= step ? "var(--ac)" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-white/25">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Setup ── */}
            {step === 0 && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="flex flex-col items-center justify-center text-center py-10 min-h-[60vh]"
              >
                <div
                  className="w-24 h-24 mb-8 rounded-full flex items-center justify-center relative"
                  style={{
                    background: "rgba(0,240,255,0.06)",
                    border: "1px solid rgba(0,240,255,0.25)",
                    boxShadow: "0 0 40px rgba(0,240,255,0.15)",
                  }}
                >
                  <Bot className="w-10 h-10" style={{ color: "var(--ac)" }} />
                  <div
                    className="absolute inset-0 rounded-full border border-dashed animate-spin"
                    style={{
                      borderColor: "rgba(0,240,255,0.35)",
                      animationDuration: "5s",
                    }}
                  />
                </div>

                <h2 className="text-[32px] font-black text-white mb-4 leading-tight">
                  Initialize Your <GradientLabel>AI Coach</GradientLabel>
                </h2>
                <p className="text-[15px] text-white/55 leading-relaxed max-w-[300px] mb-8">
                  The Vision Engine needs to know your discipline and skill
                  level to accurately track your joints and score your movements
                  in real-time.
                </p>

                <div
                  className="w-full rounded-2xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <h3 className="font-bold text-white text-sm mb-4 text-left">
                    Calibration Sequence
                  </h3>
                  <ul className="text-left text-[13px] text-white/50 space-y-3">
                    {[
                      "Select primary arena discipline",
                      "Define current athlete tier",
                      "Set competitive goals",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "var(--ac)" }}
                        />
                        <span>
                          {i + 1}. {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Discipline ── */}
            {step === 1 && (
              <motion.div
                key="disc"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Choose your <GradientLabel>discipline</GradientLabel>
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Your primary training focus — add more later
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {DISCIPLINES.map((d: any) => {
                    const banner =
                      DISCIPLINE_BANNER[d.id] ??
                      PREMIUM_ASSETS.ATHLETES.WARRIOR;
                    const selected = disciplineId === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          setDisciplineId(d.id);
                          setSubDisciplineId(undefined);
                        }}
                        className="h-32 rounded-2xl overflow-hidden relative group active:scale-[0.97] transition-transform"
                        style={{
                          border: selected
                            ? "2px solid rgba(0,240,255,0.5)"
                            : "1px solid rgba(255,255,255,0.07)",
                          boxShadow: selected
                            ? "0 0 24px rgba(0,240,255,0.15)"
                            : "none",
                        }}
                      >
                        <img
                          src={banner}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#040610] via-[#040610]/55 to-transparent" />
                        {selected && (
                          <div className="absolute inset-0 bg-[var(--ac)]/8" />
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center gap-2">
                            <DynamicIcon
                              name={d.icon}
                              className="w-4 h-4"
                              style={{
                                color: selected ? "var(--ac)" : "white",
                              }}
                            />
                            <p className="font-black text-white text-sm">
                              {d.name}
                            </p>
                          </div>
                          {d.subDisciplines.length > 0 && (
                            <p className="text-[9px] font-mono text-white/35 mt-0.5 uppercase tracking-widest">
                              {d.subDisciplines.length} styles
                            </p>
                          )}
                        </div>

                        {selected && (
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "var(--ac)" }}
                          >
                            <CheckCircle className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Sub-style ── */}
            {step === 2 && hasSubDisciplines && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Choose your <GradientLabel>style</GradientLabel>
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
                    border: "1px solid rgba(255,255,255,0.07)",
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

            {/* ── Step 3: Experience ── */}
            {step === 3 && (
              <motion.div
                key="exp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Your <GradientLabel>experience</GradientLabel> level
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  We'll personalise drills and AI coaching
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {EXPERIENCE_LEVELS.map((level) => {
                    const selected = experience === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => setExperience(level.id)}
                        className="rounded-2xl p-4 flex flex-col items-center text-center transition-all active:scale-[0.97] relative overflow-hidden"
                        style={
                          selected
                            ? {
                                background: "rgba(0,240,255,0.06)",
                                border: "1px solid rgba(0,240,255,0.30)",
                                boxShadow: "0 0 20px rgba(0,240,255,0.08)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }
                        }
                      >
                        <img
                          src={level.badge}
                          alt=""
                          className={`w-16 h-16 mb-3 object-contain transition-all duration-300 ${selected ? "drop-shadow-[0_0_16px_rgba(0,240,255,0.5)] scale-110" : "opacity-55"}`}
                        />
                        <p
                          className={`font-black text-base ${selected ? "text-white" : "text-white/65"}`}
                        >
                          {level.title}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {level.desc}
                        </p>
                        {selected && (
                          <div
                            className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "var(--ac)" }}
                          >
                            <CheckCircle className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-white/45 mb-3">
                    Training frequency
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENCIES.map((f) => (
                      <CardGlass
                        key={f.id}
                        selected={frequency === f.id}
                        onClick={() => setFrequency(f.id)}
                        className="text-center"
                      >
                        <p className="text-sm font-bold text-white">
                          {f.label}
                        </p>
                        <p className="text-[10px] text-white/30">{f.desc}</p>
                      </CardGlass>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Goals ── */}
            {step === 4 && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  What <GradientLabel>drives</GradientLabel> you?
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Select all that apply
                </p>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  {GOALS.map((g) => {
                    const on = goals.includes(g.id);
                    return (
                      <CardGlass
                        key={g.id}
                        selected={on}
                        onClick={() => toggleGoal(g.id)}
                        className="flex flex-col items-center text-center !py-6 relative overflow-hidden"
                      >
                        {on && (
                          <div className="absolute inset-0 bg-[var(--ac)]/5 pointer-events-none" />
                        )}
                        <div
                          className={`mb-4 w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-300 ${on ? "scale-110" : ""}`}
                          style={{
                            background: on
                              ? "rgba(0,240,255,0.08)"
                              : "rgba(255,255,255,0.04)",
                            border: on
                              ? "1px solid rgba(0,240,255,0.3)"
                              : "1px solid rgba(255,255,255,0.08)",
                            boxShadow: on
                              ? "0 0 20px rgba(0,240,255,0.2)"
                              : "none",
                          }}
                        >
                          <img
                            src={g.icon}
                            alt={g.title}
                            className={`w-9 h-9 object-contain ${on ? "" : "opacity-50"}`}
                          />
                        </div>
                        <p
                          className={`text-[15px] font-black relative z-10 ${on ? "text-white" : "text-white/65"}`}
                        >
                          {g.title}
                        </p>
                        <p className="text-[10px] text-white/40 mt-1 relative z-10 leading-tight">
                          {g.desc}
                        </p>
                      </CardGlass>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Avatar (3D R3F) ── */}
            {step === 5 && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col h-full"
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Choose <GradientLabel>Avatar</GradientLabel>
                </h2>
                <p className="text-sm text-white/35 mb-6">
                  Your representation in the Global Arena.
                </p>

                {/* 3D Preview Glass Panel */}
                <div className="w-full h-[260px] mb-6 rounded-3xl overflow-hidden relative shadow-[0_0_30px_rgba(0,240,255,0.15)] border border-white/10 bg-black/40">
                  <AvatarCanvas />
                </div>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  {[
                    {
                      id: "/assets/models/avatar.vrm",
                      title: "Standard VRM",
                      desc: "Anime base model",
                      icon: User,
                    },
                    {
                      id: "/assets/models/Xbot.glb",
                      title: "XBot Tactical",
                      desc: "Military grade",
                      icon: Target,
                    },
                    {
                      id: "/assets/models/RobotExpressive.glb",
                      title: "Android",
                      desc: "Expressive synth",
                      icon: Sparkles,
                    },
                  ].map((av) => {
                    const selected = avatarUrl === av.id;
                    return (
                      <CardGlass
                        key={av.id}
                        selected={selected}
                        onClick={() => {
                          setAvatarUrl(av.id);
                          setAvatarConfig({ modelUrl: av.id });
                        }}
                        className="flex flex-col items-center justify-center p-4 min-h-[140px] relative"
                      >
                        <av.icon
                          className={cn(
                            "w-6 h-6 mb-3",
                            selected ? "text-[var(--ac)]" : "text-t3",
                          )}
                        />
                        <span className="font-bold text-sm text-center mb-1 text-white">
                          {av.title}
                        </span>
                        <span className="text-[10px] text-white/50 text-center">
                          {av.desc}
                        </span>

                        {selected && (
                          <div
                            className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "var(--ac)" }}
                          >
                            <CheckCircle className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </CardGlass>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step 6: Coach ── */}
            {step === 6 && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <h2 className="text-2xl font-black text-white mb-1">
                  Select your <GradientLabel>AI Coach</GradientLabel>
                </h2>
                <p className="text-sm text-white/35 mb-8">
                  Choose a personality to guide your {disc.name} training
                </p>

                <div className="space-y-4">
                  {COACHES.map((coach) => {
                    const selected = coachName === coach.id;
                    return (
                      <CardGlass
                        key={coach.id}
                        selected={selected}
                        onClick={() => setCoachName(coach.id)}
                        className="flex items-center gap-4 !p-4 overflow-hidden"
                      >
                        <div
                          className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: `${coach.color}15`,
                            border: `1px solid ${coach.color}30`,
                          }}
                        >
                          <img
                            src={coach.img}
                            alt=""
                            className="w-11 h-11 object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-black text-white uppercase tracking-tight">
                              {coach.name}
                            </span>
                            <span
                              className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                              style={{
                                color: selected
                                  ? coach.color
                                  : "rgba(255,255,255,0.35)",
                                background: selected
                                  ? `${coach.color}15`
                                  : "rgba(255,255,255,0.04)",
                                border: `1px solid ${selected ? coach.color + "40" : "rgba(255,255,255,0.08)"}`,
                              }}
                            >
                              {coach.desc}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/40 italic leading-tight">
                            "{coach.motto}"
                          </p>
                        </div>
                        {selected && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: coach.color,
                              boxShadow: `0 0 16px ${coach.color}80`,
                            }}
                          >
                            <Bot className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </CardGlass>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step 7: Confirm ── */}
            {step === 7 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="py-6 flex flex-col items-center"
              >
                <motion.h2
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, transition: { delay: 0.2 } }}
                  className="text-3xl font-black text-white mb-2 text-center"
                >
                  <GradientLabel>Ready</GradientLabel> for Battle
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
                  className="text-[15px] text-white/50 mb-8 text-center max-w-[280px]"
                >
                  Coach {coachName} is calibrated and waiting in the arena.
                </motion.p>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, transition: { delay: 0.6 } }}
                  className="w-full rounded-[28px] overflow-hidden relative"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(0,240,255,0.2)",
                    boxShadow: "0 0 40px rgba(0,240,255,0.08)",
                  }}
                >
                  {/* Athlete portrait (right side fade) */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none"
                    style={{
                      maskImage:
                        "linear-gradient(to left, rgba(0,0,0,0.5), transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to left, rgba(0,0,0,0.5), transparent)",
                    }}
                  >
                    <img
                      src={
                        DISCIPLINE_ATHLETE[disciplineId] ??
                        PREMIUM_ASSETS.ATHLETES.BOXER
                      }
                      alt=""
                      className="w-full h-full object-cover object-top opacity-60"
                    />
                  </div>

                  <div className="relative z-10 p-6">
                    {/* Header row */}
                    <div
                      className="flex items-center gap-2 mb-5 pb-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] animate-pulse"
                        style={{ boxShadow: "0 0 8px var(--ac)" }}
                      />
                      <h3
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.25em]"
                        style={{ color: "var(--ac)" }}
                      >
                        Athlete Profile
                      </h3>
                    </div>

                    <div className="space-y-4 w-[58%]">
                      <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-1">
                          Discipline
                        </p>
                        <p className="text-2xl font-black text-white">
                          {disc.name}
                        </p>
                        {hasSubDisciplines && subDisciplineId && (
                          <p
                            className="text-[12px] font-bold uppercase tracking-wide mt-0.5"
                            style={{ color: "var(--ac)" }}
                          >
                            {
                              disc.subDisciplines.find(
                                (s) => s.id === subDisciplineId,
                              )?.name
                            }{" "}
                            style
                          </p>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-2 gap-3 pt-3"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">
                            Tier
                          </p>
                          <p className="text-sm font-black text-white">
                            {
                              EXPERIENCE_LEVELS.find((l) => l.id === experience)
                                ?.title
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">
                            Frequency
                          </p>
                          <p className="text-sm font-black text-white">
                            {FREQUENCIES.find((f) => f.id === frequency)?.label}
                          </p>
                        </div>
                      </div>

                      {goals.length > 0 && (
                        <div
                          className="pt-3"
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-2">
                            Goals
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {goals.map((gId) => {
                              const lg = GOALS.find((g) => g.id === gId);
                              return lg ? (
                                <span
                                  key={gId}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
                                  style={{
                                    background: "rgba(0,240,255,0.08)",
                                    border: "1px solid rgba(0,240,255,0.2)",
                                  }}
                                >
                                  {lg.title}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CTA ── */}
        <div className="px-5 pb-8 pt-3">
          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className={cn(
              "w-full h-16 rounded-[24px] font-black text-[16px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
              canAdvance() && !saving
                ? "text-[#040914]"
                : "opacity-40 cursor-not-allowed text-white/40",
            )}
            style={
              canAdvance() && !saving
                ? {
                    background:
                      "linear-gradient(135deg, var(--ac), var(--ac2))",
                    boxShadow: "0 0 30px rgba(0,240,255,0.3)",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : step === STEPS.length - 1 ? (
              "Enter Arena"
            ) : (
              <>
                Continue{" "}
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
