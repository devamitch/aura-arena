// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Onboarding (Premium Multi-Step, MusicX Aesthetic)
// Dynamic backgrounds per step + discipline | Full asset utilization
// ═══════════════════════════════════════════════════════════════════════════════

import { AvatarCanvas } from "@/components/3d/AvatarCanvas";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { generateWelcomeMessage } from "@lib/gemini";
import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { AuraLogoText } from "@shared/components/ui/aura-logo-text";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import {
  ALL_ATHLETES,
  ALL_AVATARS,
  DISCIPLINE_ATHLETE,
  DISCIPLINE_BANNER,
  INTRO_MISC,
  INTRO_SLIDES,
  MODELS,
  PREMIUM_ASSETS,
  pickImage,
} from "@utils/assets";
import { DISCIPLINES, getDiscipline } from "@utils/constants/disciplines";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Box,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  ImageIcon,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    title: "Rookie",
    sub: "Just starting out",
    badge: PREMIUM_ASSETS.BADGES.BEGINNER,
    badge3d: PREMIUM_ASSETS.BADGES.BEGINNER_3D,
    color: "#6b7280",
  },
  {
    id: "intermediate",
    title: "Amateur",
    sub: "Train regularly",
    badge: PREMIUM_ASSETS.BADGES.INTERMEDIATE,
    badge3d: PREMIUM_ASSETS.BADGES.INTERMEDIATE_3D,
    color: "#22c55e",
  },
  {
    id: "advanced",
    title: "Pro",
    sub: "Compete at high level",
    badge: PREMIUM_ASSETS.BADGES.ADVANCED,
    badge3d: PREMIUM_ASSETS.BADGES.ADVANCED_3D,
    color: "var(--ac)",
  },
  {
    id: "expert",
    title: "Elite",
    sub: "Master of craft",
    badge: PREMIUM_ASSETS.BADGES.PROFESSIONAL,
    badge3d: PREMIUM_ASSETS.BADGES.PROFESSIONAL_3D,
    color: "#f59e0b",
  },
] as const;

const GOALS = [
  {
    id: "fitness",
    title: "Fitness",
    desc: "Build muscle & stamina",
    icon: PREMIUM_ASSETS.GOALS.FITNESS,
    color: "#22c55e",
  },
  {
    id: "compete",
    title: "Competition",
    desc: "Climb ranks & win",
    icon: PREMIUM_ASSETS.GOALS.COMPETE,
    color: "#f43f5e",
  },
  {
    id: "skills",
    title: "Skill Master",
    desc: "Perfect form & technique",
    icon: PREMIUM_ASSETS.GOALS.SKILLS,
    color: "var(--ac)",
  },
  {
    id: "social",
    title: "Community",
    desc: "Train with friends",
    icon: PREMIUM_ASSETS.GOALS.COMMUNITY,
    color: "#a855f7",
  },
];

const FREQUENCIES = [
  { id: 3, label: "3×/wk", sub: "Casual" },
  { id: 5, label: "5×/wk", sub: "Committed" },
  { id: 7, label: "Daily", sub: "Dedicated" },
];

const COACHES = [
  {
    id: "Aria",
    name: "ARIA AI",
    motto: "Train smart, not just hard.",
    img: PREMIUM_ASSETS.COACHES.ARIA,
    imgAlt: PREMIUM_ASSETS.COACHES.ARIA_ALT,
    desc: "Balanced",
    color: "var(--ac)",
    colorHex: "#00f0ff",
  },
  {
    id: "Max",
    name: "MAX",
    motto: "Unleash your inner power.",
    img: PREMIUM_ASSETS.COACHES.MAX,
    imgAlt: PREMIUM_ASSETS.COACHES.MAX_ALT,
    desc: "Power",
    color: "#f43f5e",
    colorHex: "#f43f5e",
  },
  {
    id: "Sensei",
    name: "SENSEI",
    motto: "Master the art of focus.",
    img: PREMIUM_ASSETS.COACHES.SENSEI,
    imgAlt: PREMIUM_ASSETS.COACHES.SENSEI_ALT,
    desc: "Focus",
    color: "#22c55e",
    colorHex: "#22c55e",
  },
];

const STEPS = [
  "Welcome",
  "Discipline",
  "Style",
  "Level",
  "Goals",
  "Avatar",
  "Coach",
  "Confirm",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns the background image to show for a given step + discipline */
function getStepBackground(step: number, disciplineId: DisciplineId): string {
  if (step === 0) return INTRO_SLIDES[0];
  if (step === 1) return INTRO_MISC[4]; // onboarding_global_arena.png
  if (step === 7) return PREMIUM_ASSETS.ATMOSPHERE.BATTLE_VICTORY;
  const banners = DISCIPLINE_BANNER[disciplineId];
  if (banners) return Array.isArray(banners) ? banners[0] : banners;
  return PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA;
}

const GradientText = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "text-transparent bg-clip-text font-black tracking-tight",
      className,
    )}
    style={{
      backgroundImage:
        "linear-gradient(135deg, #00f0ff 0%, #3b82f6 60%, #a855f7 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    {children}
  </span>
);

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useUser();
  const updateUser = useStore((s) => s.updateUser);
  const setAvatarConfig = useStore((s) => s.setAvatarConfig);

  const [step, setStep] = useState(0);
  const [bgSlide, setBgSlide] = useState(0);
  const [disciplineId, setDisciplineId] = useState<DisciplineId>("boxing");
  const [subDisciplineId, setSubDisciplineId] = useState<
    SubDisciplineId | undefined
  >();
  const [experience, setExperience] = useState<string>("beginner");
  const [goals, setGoals] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(3);
  const [avatarUrl, setAvatarUrl] = useState<string>(MODELS.VROID_MALE);
  const [avatarType, setAvatarType] = useState<"3d" | "photo">("photo");
  const [coachName, setCoachName] = useState("");
  const [saving, setSaving] = useState(false);

  // Cycle slides on welcome screen
  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => setBgSlide((i) => i + 1), 3500);
    return () => clearInterval(t);
  }, [step]);

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
    if (step === 5) return !!avatarUrl;
    if (step === 6) return coachName.trim().length >= 2;
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
      avatarUrl,
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
  const bgImage = getStepBackground(step, disciplineId);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#040610" }}
    >
      {/* ── Dynamic Full-bleed Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            // Welcome: cycle through intro slides
            <motion.img
              key={`welcome-${bgSlide}`}
              src={pickImage(INTRO_SLIDES, bgSlide)}
              alt=""
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <motion.img
              key={`step-${step}-${disciplineId}`}
              src={bgImage}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </AnimatePresence>

        {/* Gradient overlay — heavier on non-welcome steps */}
        <div
          className="absolute inset-0"
          style={{
            background:
              step === 0
                ? "linear-gradient(180deg, rgba(4,6,16,0.5) 0%, rgba(4,6,16,0.7) 50%, rgba(4,6,16,1) 100%)"
                : "linear-gradient(180deg, rgba(4,6,16,0.75) 0%, rgba(4,6,16,0.88) 60%, rgba(4,6,16,1) 100%)",
          }}
        />

        {/* Bottom ambient glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(0,240,255,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Main Layout ── */}
      <div className="relative z-10 flex flex-col h-full">
        {/* ── Progress bar ── */}
        <div
          className="h-[2px]"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full relative overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #00f0ff, #3b82f6, #a855f7)",
              boxShadow: "0 0 12px rgba(0,240,255,0.5)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "circOut" }}
          />
        </div>

        {/* ── Top navigation row ── */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={back}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
              step === 0 ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5 items-center">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 6,
                  opacity: i <= step ? 1 : 0.2,
                }}
                transition={{ duration: 0.3 }}
                className="h-1.5 rounded-full"
                style={{
                  background:
                    i <= step
                      ? "linear-gradient(90deg, #00f0ff, #3b82f6)"
                      : "rgba(255,255,255,0.15)",
                  boxShadow:
                    i === step ? "0 0 8px rgba(0,240,255,0.6)" : "none",
                }}
              />
            ))}
          </div>

          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-[10px] font-black text-white/40 tracking-widest">
              {step + 1}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* ── Content area ── */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-4"
          style={{ scrollbarWidth: "none" }}
        >
          <AnimatePresence mode="wait">
            {/* ════════════════════════════════════════════════
                STEP 0 — Welcome / Splash
            ════════════════════════════════════════════════ */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="flex flex-col items-center justify-center text-center pt-8 pb-4 min-h-[68vh]"
              >
                {/* Logo glow icon */}
                <motion.div
                  className="relative mb-6"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 240,
                    damping: 18,
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-[28px] flex items-center justify-center relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(0,240,255,0.12), rgba(59,130,246,0.08))",
                      border: "1px solid rgba(0,240,255,0.3)",
                      boxShadow:
                        "0 0 40px rgba(0,240,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    <img
                      src={PREMIUM_ASSETS.BRANDING.LOGO_PREMIUM}
                      alt="Logo"
                      className="w-10 h-10 object-contain relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,240,255,0.15)] to-transparent" />
                  </div>
                  {/* Orbit ring */}
                  <div
                    className="absolute inset-[-8px] rounded-full border border-dashed animate-spin"
                    style={{
                      borderColor: "rgba(0,240,255,0.25)",
                      animationDuration: "6s",
                    }}
                  />
                  {/* Glow pulse */}
                  <div
                    className="absolute inset-[-4px] rounded-full animate-ping"
                    style={{
                      background: "rgba(0,240,255,0.08)",
                      animationDuration: "2.5s",
                    }}
                  />
                </motion.div>

                {/* Logo text */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <AuraLogoText size="lg" glow={true} />
                </motion.div>

                {/* Headline */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight mb-3">
                    Your <GradientText>AI Coach</GradientText>
                    <br />
                    Awaits
                  </h1>
                  <p className="text-[14px] text-white/50 leading-relaxed max-w-[280px] mx-auto">
                    Vision Engine calibration initializing — 60 seconds to setup
                    your personalized arena.
                  </p>
                </motion.div>

                {/* Stats pills */}
                <motion.div
                  className="flex gap-3 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  {[
                    { Icon: Users, text: "50K+ Athletes", color: "var(--ac)" },
                    { Icon: Flame, text: "Real-time AI", color: "#f59e0b" },
                    { Icon: Zap, text: "Global Arena", color: "#a855f7" },
                  ].map(({ Icon, text, color }) => (
                    <div
                      key={text}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{
                        background: `${color}10`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      <Icon
                        className="w-3 h-3 flex-shrink-0"
                        style={{ color }}
                      />
                      <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">
                        {text}
                      </span>
                    </div>
                  ))}
                </motion.div>

                {/* Calibration checklist */}
                <motion.div
                  className="w-full rounded-2xl p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] animate-pulse"
                      style={{ boxShadow: "0 0 6px var(--ac)" }}
                    />
                    <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                      Calibration Sequence
                    </p>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      { text: "Select primary discipline", done: true },
                      { text: "Set your athlete tier", done: false },
                      { text: "Define training goals", done: false },
                      { text: "Choose AI coach personality", done: false },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              i === 0 ? "var(--ac)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${i === 0 ? "var(--ac)" : "rgba(255,255,255,0.1)"}`,
                          }}
                        >
                          {i === 0 && (
                            <CheckCircle className="w-2.5 h-2.5 text-black" />
                          )}
                        </div>
                        <span
                          className={`text-[12px] ${i === 0 ? "text-white/70" : "text-white/35"}`}
                        >
                          {i + 1}. {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 1 — Discipline
            ════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="discipline"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              >
                <div className="pt-2 mb-5">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    Your <GradientText>Arena</GradientText>
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Primary discipline — expand your roster later
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {DISCIPLINES.map((d: any) => {
                    const banner =
                      DISCIPLINE_BANNER[d.id] ??
                      PREMIUM_ASSETS.ATHLETES.WARRIOR;
                    const selected = disciplineId === d.id;
                    return (
                      <motion.button
                        key={d.id}
                        onClick={() => {
                          setDisciplineId(d.id);
                          setSubDisciplineId(undefined);
                          const newDisc = getDiscipline(d.id);
                          setTimeout(() => {
                            setStep(newDisc.subDisciplines.length > 0 ? 2 : 3);
                          }, 380);
                        }}
                        className="h-36 rounded-[20px] overflow-hidden relative group transition-transform active:scale-[0.97]"
                        whileTap={{ scale: 0.96 }}
                        style={{
                          border: selected
                            ? "2px solid rgba(0,240,255,0.6)"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: selected
                            ? "0 0 28px rgba(0,240,255,0.2), inset 0 0 20px rgba(0,240,255,0.06)"
                            : "0 4px 12px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Banner image */}
                        <img
                          src={Array.isArray(banner) ? banner[0] : banner}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#040610] via-[#040610]/50 to-transparent" />
                        {/* Selected overlay */}
                        {selected && (
                          <div
                            className="absolute inset-0"
                            style={{ background: "rgba(0,240,255,0.07)" }}
                          />
                        )}

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center gap-2">
                            <DynamicIcon
                              name={d.icon}
                              className="w-4 h-4 flex-shrink-0"
                              style={{
                                color: selected ? "var(--ac)" : "white",
                              }}
                            />
                            <p className="font-black text-white text-sm leading-tight">
                              {d.name}
                            </p>
                          </div>
                          {d.subDisciplines.length > 0 && (
                            <p
                              className="text-[9px] font-mono tracking-widest uppercase mt-0.5"
                              style={{
                                color: selected
                                  ? "var(--ac)"
                                  : "rgba(255,255,255,0.35)",
                              }}
                            >
                              {d.subDisciplines.length} styles
                            </p>
                          )}
                        </div>

                        {/* Selected check */}
                        {selected && (
                          <div
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_12px_var(--ac)]"
                            style={{ background: "var(--ac)" }}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-black" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 2 — Sub-style
            ════════════════════════════════════════════════ */}
            {step === 2 && hasSubDisciplines && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="pt-2 mb-5">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    Your <GradientText>Style</GradientText>
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Pick a {disc.name} specialty — or train all
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSubDisciplineId(undefined);
                    next();
                  }}
                  className="w-full mb-4 py-3.5 rounded-2xl text-sm text-white/40 font-semibold text-center active:scale-[0.97] transition-transform"
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

            {/* ════════════════════════════════════════════════
                STEP 3 — Experience Level
            ════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="pt-2 mb-5">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    Your <GradientText>Level</GradientText>
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Calibrates AI difficulty and drill complexity
                  </p>
                </div>

                {/* Experience grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {EXPERIENCE_LEVELS.map((level) => {
                    const selected = experience === level.id;
                    return (
                      <motion.button
                        key={level.id}
                        onClick={() => { setExperience(level.id); setTimeout(next, 320); }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-[20px] p-5 flex flex-col items-center text-center relative overflow-hidden transition-all"
                        style={
                          selected
                            ? {
                                background:
                                  "linear-gradient(145deg, rgba(12,16,30,0.96), rgba(6,8,18,0.98))",
                                border: `1px solid ${level.color}60`,
                                boxShadow: `0 0 28px ${level.color}25, inset 0 0 16px ${level.color}08`,
                              }
                            : {
                                background:
                                  "linear-gradient(145deg, rgba(20,26,45,0.8), rgba(12,16,28,0.85))",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                              }
                        }
                      >
                        {/* 3D Badge */}
                        <img
                          src={selected ? level.badge3d : level.badge}
                          alt={level.title}
                          className={cn(
                            "w-20 h-20 mb-3 object-contain transition-all duration-300",
                            selected
                              ? "drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-110"
                              : "opacity-50 scale-100",
                          )}
                        />
                        <p
                          className={cn(
                            "font-black text-[15px]",
                            selected ? "text-white" : "text-white/55",
                          )}
                        >
                          {level.title}
                        </p>
                        <p className="text-[11px] text-white/35 mt-0.5 leading-tight">
                          {level.sub}
                        </p>

                        {selected && (
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              background: level.color,
                              boxShadow: `0 0 10px ${level.color}60`,
                            }}
                          >
                            <CheckCircle className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Frequency */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-3">
                    Training Frequency
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFrequency(f.id)}
                        className="py-3 rounded-xl text-center transition-all active:scale-[0.97]"
                        style={
                          frequency === f.id
                            ? {
                                background: "rgba(0,240,255,0.1)",
                                border: "1px solid rgba(0,240,255,0.4)",
                                boxShadow: "0 0 12px rgba(0,240,255,0.15)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }
                        }
                      >
                        <p
                          className="text-sm font-black"
                          style={{
                            color:
                              frequency === f.id
                                ? "var(--ac)"
                                : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {f.label}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {f.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 4 — Goals
            ════════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="pt-2 mb-5">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    What <GradientText>Drives</GradientText> You?
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Select all that apply — we'll tailor your experience
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  {GOALS.map((g) => {
                    const on = goals.includes(g.id);
                    return (
                      <motion.button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-[20px] py-6 flex flex-col items-center text-center relative overflow-hidden"
                        style={
                          on
                            ? {
                                background: `linear-gradient(145deg, ${g.color}12, ${g.color}06)`,
                                border: `1px solid ${g.color}45`,
                                boxShadow: `0 0 20px ${g.color}18`,
                              }
                            : {
                                background:
                                  "linear-gradient(145deg, rgba(20,26,45,0.8), rgba(12,16,28,0.85))",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                              }
                        }
                      >
                        {/* Goal icon */}
                        <div
                          className={cn(
                            "mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                            on ? "scale-105" : "scale-100",
                          )}
                          style={{
                            background: on
                              ? `${g.color}14`
                              : "rgba(255,255,255,0.04)",
                            border: `1px solid ${on ? g.color + "40" : "rgba(255,255,255,0.08)"}`,
                            boxShadow: on ? `0 0 20px ${g.color}25` : "none",
                          }}
                        >
                          <img
                            src={g.icon}
                            alt={g.title}
                            className={cn(
                              "w-10 h-10 object-contain",
                              on ? "" : "opacity-45",
                            )}
                          />
                        </div>

                        <p
                          className={cn(
                            "text-[15px] font-black",
                            on ? "text-white" : "text-white/60",
                          )}
                        >
                          {g.title}
                        </p>
                        <p className="text-[11px] text-white/35 mt-1 leading-tight px-2">
                          {g.desc}
                        </p>

                        {on && (
                          <div
                            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              background: g.color,
                              boxShadow: `0 0 10px ${g.color}60`,
                            }}
                          >
                            <CheckCircle className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 5 — Avatar
            ════════════════════════════════════════════════ */}
            {step === 5 && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col"
              >
                <div className="pt-2 mb-4">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    Your <GradientText>Avatar</GradientText>
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Choose your identity in the Global Arena
                  </p>
                </div>

                {/* Tab switcher */}
                <div
                  className="flex gap-1 p-1 rounded-2xl mb-4"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {(["3d", "photo"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setAvatarType(t);
                        if (t === "3d") setAvatarUrl(MODELS.VROID_MALE);
                        else { setAvatarUrl(ALL_AVATARS[0]); setAvatarConfig({ modelUrl: ALL_AVATARS[0] }); }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                      style={
                        avatarType === t
                          ? { background: "var(--ac)", color: "#040914" }
                          : { color: "rgba(255,255,255,0.4)" }
                      }
                    >
                      {t === "3d" ? <Box className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      {t === "3d" ? "3D Model" : "Photo"}
                    </button>
                  ))}
                </div>

                {avatarType === "3d" ? (
                  <>
                    {/* 3D Preview */}
                    <div
                      className="w-full rounded-[24px] overflow-hidden relative mb-4"
                      style={{ height: "300px", border: "1px solid rgba(0,240,255,0.2)", boxShadow: "0 0 40px rgba(0,240,255,0.06)" }}
                    >
                      <img src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,9,20,0.85) 0%, transparent 60%)" }} />
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.012) 3px, rgba(0,240,255,0.012) 4px)" }} />
                      <div className="absolute inset-0 z-10"><AvatarCanvas url={avatarUrl} /></div>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20">
                        <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(0,240,255,0.25)", color: "var(--ac)", backdropFilter: "blur(8px)" }}>
                          ● LIVE 3D PREVIEW
                        </div>
                      </div>
                    </div>

                    {/* 3D model grid */}
                    <div className="grid grid-cols-2 gap-3 pb-8">
                      {[
                        { id: MODELS.VROID_MALE,   title: "VRoid Male",   desc: "Human · Realistic", preview: PREMIUM_ASSETS.ATHLETES.BOXER,    color: "var(--ac)",  glyph: "♂" },
                        { id: MODELS.VROID_FEMALE, title: "VRoid Female", desc: "Human · Graceful",  preview: PREMIUM_ASSETS.AVATARS.FIGHTER,   color: "#f43f5e",    glyph: "♀" },
                        { id: MODELS.XBOT,         title: "XBot Alpha",   desc: "Military Synth",    preview: PREMIUM_ASSETS.AVATARS.FIGHTER,   color: "#3b82f6",    glyph: "🤖" },
                        { id: MODELS.ROBOT,        title: "Android",      desc: "Expressive Bot",    preview: PREMIUM_ASSETS.ATHLETES.ARENA,    color: "#a855f7",    glyph: "⚡" },
                      ].map((av) => {
                        const sel = avatarUrl === av.id;
                        return (
                          <motion.button
                            key={av.id}
                            onClick={() => { setAvatarUrl(av.id); setAvatarConfig({ modelUrl: av.id }); setTimeout(next, 300); }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-[20px] min-h-[130px] relative overflow-hidden flex flex-col items-center justify-center p-4"
                            style={sel
                              ? { border: `2px solid ${av.color}70`, boxShadow: `0 0 24px ${av.color}25`, background: "rgba(8,12,24,0.95)" }
                              : { border: "1px solid rgba(255,255,255,0.08)", background: "rgba(16,22,40,0.8)" }}
                          >
                            <img src={av.preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,9,20,0.92) 40%, rgba(4,9,20,0.4) 100%)" }} />
                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                              <span className="text-2xl">{av.glyph}</span>
                              <span className="font-black text-[12px] text-white uppercase tracking-wide">{av.title}</span>
                              <span className="text-[10px] text-white/35 font-bold">{av.desc}</span>
                            </div>
                            {sel && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: av.color }}>
                                <CheckCircle className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Photo Preview */}
                    <div
                      className="w-full rounded-[24px] overflow-hidden relative mb-4"
                      style={{ height: "300px", border: "1px solid rgba(0,240,255,0.15)" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={avatarUrl}
                          src={avatarUrl.startsWith("/assets/models") ? ALL_AVATARS[0] : avatarUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover object-top"
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                        />
                      </AnimatePresence>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,9,20,0.65) 0%, transparent 50%)" }} />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                        <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
                          YOUR PROFILE PHOTO
                        </div>
                      </div>
                    </div>

                    {/* Photo grid */}
                    <div className="grid grid-cols-3 gap-2.5 pb-8">
                      {[...ALL_AVATARS, ...ALL_ATHLETES].map((img, i) => {
                        const sel = avatarUrl === img;
                        return (
                          <motion.button
                            key={i}
                            onClick={() => { setAvatarUrl(img); setAvatarConfig({ modelUrl: img }); setTimeout(next, 300); }}
                            whileTap={{ scale: 0.93 }}
                            className="relative rounded-[16px] overflow-hidden"
                            style={{ aspectRatio: "3/4", border: sel ? "2px solid var(--ac)" : "1px solid rgba(255,255,255,0.08)", boxShadow: sel ? "0 0 16px rgba(0,240,255,0.3)" : "none" }}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover object-top" />
                            {sel && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,240,255,0.15)" }}>
                                <CheckCircle className="w-6 h-6" style={{ color: "var(--ac)" }} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 6 — Coach Selection
            ════════════════════════════════════════════════ */}
            {step === 6 && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <div className="pt-2 mb-6">
                  <h2 className="text-[28px] font-black text-white leading-tight mb-1">
                    Your <GradientText>AI Coach</GradientText>
                  </h2>
                  <p className="text-[13px] text-white/40">
                    Choose the personality guiding your {disc.name} journey
                  </p>
                </div>

                <div className="space-y-3 pb-8">
                  {COACHES.map((coach) => {
                    const selected = coachName === coach.id;
                    return (
                      <motion.button
                        key={coach.id}
                        onClick={() => setCoachName(coach.id)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-[22px] overflow-hidden relative"
                        style={
                          selected
                            ? {
                                background: `linear-gradient(145deg, rgba(12,16,30,0.96), rgba(6,8,18,0.98))`,
                                border: `2px solid ${coach.colorHex}50`,
                                boxShadow: `0 0 30px ${coach.colorHex}20`,
                              }
                            : {
                                background:
                                  "linear-gradient(145deg, rgba(20,26,45,0.85), rgba(12,16,28,0.9))",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                              }
                        }
                      >
                        {/* Top accent line when selected */}
                        {selected && (
                          <div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${coach.colorHex}, transparent)`,
                            }}
                          />
                        )}

                        <div className="flex items-stretch">
                          {/* Coach portrait */}
                          <div
                            className="w-28 flex-shrink-0 relative overflow-hidden"
                            style={{
                              background: selected
                                ? `${coach.colorHex}10`
                                : "rgba(255,255,255,0.03)",
                              borderRight: `1px solid ${selected ? coach.colorHex + "25" : "rgba(255,255,255,0.05)"}`,
                              minHeight: 120,
                            }}
                          >
                            <img
                              src={selected ? coach.imgAlt : coach.img}
                              alt={coach.name}
                              className={cn(
                                "w-full h-full object-contain object-bottom transition-all duration-300",
                                selected ? "scale-105" : "scale-100 opacity-70",
                              )}
                            />
                            {/* Glow overlay on select */}
                            {selected && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `radial-gradient(circle at 50% 100%, ${coach.colorHex}15, transparent 70%)`,
                                }}
                              />
                            )}
                          </div>

                          {/* Coach info */}
                          <div className="flex-1 p-4 text-left flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[15px] font-black text-white uppercase tracking-tight">
                                {coach.name}
                              </span>
                              <span
                                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                                style={{
                                  color: coach.colorHex,
                                  background: `${coach.colorHex}15`,
                                  border: `1px solid ${coach.colorHex}40`,
                                }}
                              >
                                {coach.desc}
                              </span>
                            </div>
                            <p className="text-[12px] text-white/40 italic leading-snug mb-3">
                              "{coach.motto}"
                            </p>

                            {selected ? (
                              <div
                                className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg"
                                style={{
                                  background: `${coach.colorHex}15`,
                                  border: `1px solid ${coach.colorHex}40`,
                                }}
                              >
                                <Bot
                                  className="w-3 h-3"
                                  style={{ color: coach.colorHex }}
                                />
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: coach.colorHex }}
                                >
                                  Selected
                                </span>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                                  Tap to select
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════
                STEP 7 — Confirm / Launch
            ════════════════════════════════════════════════ */}
            {step === 7 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="py-4 flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-[38px] font-black text-white leading-[1.05] tracking-tight">
                    <GradientText>Ready</GradientText>
                    <br />
                    <span className="text-white">for Battle</span>
                  </h2>
                  <p className="text-[14px] text-white/45 mt-3 max-w-[260px] mx-auto leading-relaxed">
                    Coach {coachName} is calibrated and waiting in the arena.
                  </p>
                </motion.div>

                {/* Summary card */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 240,
                    damping: 22,
                  }}
                  className="w-full rounded-[28px] overflow-hidden relative"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(18,22,40,0.95), rgba(8,10,20,0.98))",
                    border: "1px solid rgba(0,240,255,0.2)",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,240,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Top gradient line */}
                  <div
                    className="h-[2px]"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), rgba(139,92,246,0.4), transparent)",
                    }}
                  />

                  {/* Athlete silhouette — right side fade */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none"
                    style={{
                      maskImage:
                        "linear-gradient(to left, rgba(0,0,0,0.55), transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to left, rgba(0,0,0,0.55), transparent)",
                    }}
                  >
                    <img
                      src={
                        DISCIPLINE_ATHLETE[disciplineId] ??
                        PREMIUM_ASSETS.ATHLETES.BOXER
                      }
                      alt=""
                      className="w-full h-full object-cover object-top opacity-55"
                    />
                  </div>

                  {/* Ambient pulsing overlay */}
                  <div
                    className="absolute inset-0 animate-pulse pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at 30% 50%, rgba(0,240,255,0.04) 0%, transparent 60%)",
                      animationDuration: "3s",
                    }}
                  />

                  <div className="relative z-10 p-6">
                    {/* Profile header */}
                    <div
                      className="flex items-center gap-2 mb-5 pb-4"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                          background: "var(--ac)",
                          boxShadow: "0 0 8px var(--ac)",
                        }}
                      />
                      <h3
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]"
                        style={{ color: "var(--ac)" }}
                      >
                        Athlete Profile — Active
                      </h3>
                    </div>

                    <div className="space-y-4 w-[60%]">
                      {/* Discipline */}
                      <div>
                        <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-1">
                          Discipline
                        </p>
                        <p className="text-[22px] font-black text-white leading-tight">
                          {disc.name}
                        </p>
                        {hasSubDisciplines && subDisciplineId && (
                          <p
                            className="text-[11px] font-bold uppercase tracking-wide mt-0.5"
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

                      {/* Stats row */}
                      <div
                        className="grid grid-cols-2 gap-3 pt-3"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div>
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-0.5">
                            Level
                          </p>
                          <p className="text-[13px] font-black text-white">
                            {
                              EXPERIENCE_LEVELS.find((l) => l.id === experience)
                                ?.title
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-0.5">
                            Frequency
                          </p>
                          <p className="text-[13px] font-black text-white">
                            {FREQUENCIES.find((f) => f.id === frequency)?.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-0.5">
                            AI Coach
                          </p>
                          <p className="text-[13px] font-black text-white">
                            {coachName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-0.5">
                            Status
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[13px] font-black text-emerald-400">
                              ACTIVE
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Goals */}
                      {goals.length > 0 && (
                        <div
                          className="pt-3"
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <p className="text-[9px] text-white/25 uppercase tracking-widest font-mono mb-2">
                            Goals
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {goals.map((gId) => {
                              const lg = GOALS.find((g) => g.id === gId);
                              return lg ? (
                                <span
                                  key={gId}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
                                  style={{
                                    background: `${lg.color}12`,
                                    border: `1px solid ${lg.color}35`,
                                    color:
                                      lg.color === "var(--ac)"
                                        ? "var(--ac)"
                                        : lg.color,
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

        {/* ── CTA Button ── */}
        <div className="px-5 pb-8 pt-3">
          <motion.button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            whileTap={canAdvance() && !saving ? { scale: 0.97 } : {}}
            className={cn(
              "w-full h-16 rounded-[22px] font-black text-[15px] uppercase tracking-[0.18em] flex items-center justify-center gap-3 transition-all duration-300",
              canAdvance() && !saving
                ? "text-[#040914]"
                : "opacity-35 cursor-not-allowed",
            )}
            style={
              canAdvance() && !saving
                ? {
                    background:
                      "linear-gradient(135deg, #00f0ff 0%, #3b82f6 60%, #a855f7 100%)",
                    boxShadow:
                      "0 10px 40px rgba(0,240,255,0.3), 0 0 0 1px rgba(0,240,255,0.1)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.3)",
                  }
            }
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <>
                Enter Arena
                <Zap className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={3} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
