// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Edit Profile & 3D Avatar Customizer
// ═══════════════════════════════════════════════════════════════════════════════

import { AvatarCanvas } from "@/components/3d/AvatarCanvas";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { DynamicIcon } from "@features/shared/components/ui/DynamicIcon";
import { usePersonalization } from "@hooks/usePersonalization";
import { analytics } from "@lib/analytics";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import { COACH_IMAGES, PREMIUM_ASSETS, pickImage } from "@utils/assets";
import { DISCIPLINES as DISCIPLINES_LIST } from "@utils/constants";
import { getDiscipline } from "@utils/constants/disciplines";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Save, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Customization config ────────────────────────────────────────────────────

const SKIN_TONES = [
  { hex: "#FDDBB4", label: "Light" },
  { hex: "#F1C27D", label: "Medium" },
  { hex: "#C68642", label: "Tan" },
  { hex: "#8D5524", label: "Brown" },
  { hex: "#4B2C20", label: "Dark" },
  { hex: "#3b2f2f", label: "Deep" },
];

const HAIR_COLORS = [
  { hex: "#1A1110", label: "Black" },
  { hex: "#4A2912", label: "Brunette" },
  { hex: "#9B6B3E", label: "Chestnut" },
  { hex: "#D4A017", label: "Blonde" },
  { hex: "#B22222", label: "Red" },
  { hex: "#808080", label: "Gray" },
  { hex: "#FF00FF", label: "Magenta" },
  { hex: "#00F0FF", label: "Cyber" },
];

const CLOTHING_STYLES = [
  { id: "default", label: "Classic", emoji: "👕" },
  { id: "cyberpunk", label: "Cyberpunk", emoji: "🟣" },
  { id: "fighter", label: "Fighter", emoji: "🥊" },
  { id: "athlete", label: "Athlete", emoji: "⚡" },
  { id: "street", label: "Street", emoji: "🏙️" },
] as const;

const AI_COACHES = [
  { name: "Aria", role: "Form Expert", emoji: "🤖", images: COACH_IMAGES.Aria },
  { name: "Max", role: "Power Trainer", emoji: "💪", images: COACH_IMAGES.Max },
  {
    name: "Sensei",
    role: "Zen Master",
    emoji: "🧘",
    images: COACH_IMAGES.Sensei,
  },
];

const RANDOMIZE_SKINS = () =>
  SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
const RANDOMIZE_HAIR = () =>
  HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
const RANDOMIZE_STYLE = () =>
  CLOTHING_STYLES[Math.floor(Math.random() * CLOTHING_STYLES.length)].id;

// ─── Swatch picker ────────────────────────────────────────────────────────────
function Swatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-8 h-8 rounded-full flex-shrink-0 transition-transform active:scale-90"
      style={{
        background: color,
        boxShadow: selected ? `0 0 0 2px #040914, 0 0 0 4px ${color}` : "none",
        transform: selected ? "scale(1.15)" : "scale(1)",
      }}
    >
      {selected && (
        <Check
          className="absolute inset-0 m-auto w-3.5 h-3.5"
          style={{
            color: "#040914",
            filter: "brightness(0) invert(0) contrast(100)",
          }}
        />
      )}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/30 mb-3">
      {children}
    </p>
  );
}

// ─── Coach Card (handles image cycling with proper hooks) ─────────────────────
function CoachCard({
  coach,
  selected,
  accentColor,
  onSelect,
}: {
  coach: { name: string; role: string; images: string[] };
  selected: boolean;
  accentColor: string;
  onSelect: () => void;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (coach.images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => i + 1), 2500);
    return () => clearInterval(t);
  }, [coach.images.length]);
  return (
    <button
      onClick={onSelect}
      className="rounded-2xl p-3 text-center transition-all"
      style={
        selected
          ? {
              background: `${accentColor}12`,
              border: `1.5px solid ${accentColor}40`,
            }
          : {
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }
      }
    >
      <img
        src={pickImage(coach.images, idx)}
        alt={coach.name}
        className="w-10 h-10 object-contain mx-auto mb-1.5 transition-opacity duration-500"
      />
      <p
        className="text-[11px] font-bold"
        style={{ color: selected ? accentColor : "rgba(255,255,255,0.6)" }}
      >
        {coach.name}
      </p>
      <p className="text-[9px] text-white/25 font-mono mt-0.5">{coach.role}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvatarPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { updateUser, setAvatarConfig } = useStore();
  const { accentColor } = usePersonalization();

  const [arenaName, setArenaName] = useState(user?.arenaName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [disciplineId, setDisciplineId] = useState<DisciplineId>(
    user?.discipline ?? "boxing",
  );
  const [subDisciplineId, setSubDisciplineId] = useState<
    SubDisciplineId | undefined
  >(user?.subDiscipline);
  const [aiCoach, setAiCoach] = useState(user?.aiCoachName ?? "Aria");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Avatar state (mirrors store)
  const [skinTone, setSkinToneLocal] = useState(
    user?.avatarConfig?.skinTone ?? "#f1c27d",
  );
  const [hairColor, setHairColorLocal] = useState(
    user?.avatarConfig?.hairColor ?? "#333",
  );
  const [clothingStyle, setClothingStyleLocal] = useState<string>(
    user?.avatarConfig?.clothingStyle ?? "default",
  );

  const selectedDisc = getDiscipline(disciplineId);

  const applyAvatar = (skin: string, hair: string, style: string) => {
    setSkinToneLocal(skin);
    setHairColorLocal(hair);
    setClothingStyleLocal(style);
    setAvatarConfig({ skinTone: skin, hairColor: hair, clothingStyle: style });
  };

  const randomize = () => {
    const s = RANDOMIZE_SKINS(),
      h = RANDOMIZE_HAIR(),
      c = RANDOMIZE_STYLE();
    applyAvatar(s, h, c);
  };

  const save = async () => {
    setSaving(true);
    updateUser({
      arenaName,
      bio,
      discipline: disciplineId,
      subDiscipline: subDisciplineId,
      aiCoachName: aiCoach,
    });
    setAvatarConfig({ skinTone, hairColor, clothingStyle });
    analytics.avatarSaved(disciplineId, aiCoach);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("/profile");
    }, 800);
  };

  return (
    <div className="page pb-safe" style={{ background: "#040610" }}>
      {/* Glow background */}
      <img
        src={PREMIUM_ASSETS.ATMOSPHERE.PROFILE_GLOW}
        alt=""
        className="fixed top-0 inset-x-0 w-full h-[300px] object-cover opacity-30 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">
            Customize
          </p>
          <h1 className="font-black text-white text-xl leading-none">
            Edit Profile
          </h1>
        </div>
      </div>

      <div className="px-5 space-y-6 pb-10 relative z-10">
        {/* ── 3D Avatar Canvas ── */}
        <div
          className="w-full h-72 rounded-[28px] overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AvatarCanvas />
          {/* Randomize button */}
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            onClick={randomize}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Shuffle className="w-4 h-4" style={{ color: accentColor }} />
          </motion.button>
          <div
            className="absolute bottom-0 inset-x-0 h-12"
            style={{
              background:
                "linear-gradient(to top, rgba(4,6,16,0.8), transparent)",
            }}
          />
        </div>

        {/* ── Skin Tone ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Skin Tone</SectionLabel>
          <div className="flex items-center gap-3 flex-wrap">
            {SKIN_TONES.map((s) => (
              <Swatch
                key={s.hex}
                color={s.hex}
                selected={skinTone === s.hex}
                onClick={() => applyAvatar(s.hex, hairColor, clothingStyle)}
              />
            ))}
          </div>
        </div>

        {/* ── Hair Color ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Hair Color</SectionLabel>
          <div className="flex items-center gap-3 flex-wrap">
            {HAIR_COLORS.map((h) => (
              <Swatch
                key={h.hex}
                color={h.hex}
                selected={hairColor === h.hex}
                onClick={() => applyAvatar(skinTone, h.hex, clothingStyle)}
              />
            ))}
          </div>
        </div>

        {/* ── Clothing Style ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Outfit</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {CLOTHING_STYLES.map((c) => (
              <button
                key={c.id}
                onClick={() => applyAvatar(skinTone, hairColor, c.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={
                  clothingStyle === c.id
                    ? { background: accentColor, color: "#040914" }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)",
                      }
                }
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Coach ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>AI Coach</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {AI_COACHES.map((c) => (
              <CoachCard
                key={c.name}
                coach={c}
                selected={aiCoach === c.name}
                accentColor={accentColor}
                onSelect={() => setAiCoach(c.name)}
              />
            ))}
          </div>
        </div>

        {/* ── Arena Name ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Arena Name</SectionLabel>
          <input
            value={arenaName}
            onChange={(e) => setArenaName(e.target.value.slice(0, 20))}
            placeholder={user?.displayName ?? "Your arena name…"}
            className="w-full bg-transparent text-white text-base font-bold outline-none placeholder:text-white/20"
          />
          <div
            className="h-px mt-3"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <p className="text-[9px] font-mono text-white/20 mt-1.5 text-right">
            {arenaName.length}/20
          </p>
        </div>

        {/* ── Bio ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Bio</SectionLabel>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 120))}
            placeholder="Tell the arena who you are…"
            rows={2}
            className="w-full bg-transparent text-white/70 text-sm outline-none placeholder:text-white/20 resize-none"
          />
          <div
            className="h-px mt-2"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <p className="text-[9px] font-mono text-white/20 mt-1 text-right">
            {bio.length}/120
          </p>
        </div>

        {/* ── Discipline ── */}
        <div
          className="rounded-[20px] p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <SectionLabel>Discipline</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {DISCIPLINES_LIST.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDisciplineId(d.id);
                  setSubDisciplineId(undefined);
                }}
                className="py-3 rounded-xl text-center transition-all"
                style={
                  disciplineId === d.id
                    ? {
                        background: `${d.color}15`,
                        border: `1.5px solid ${d.color}40`,
                      }
                    : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }
                }
              >
                <DynamicIcon
                  name={d.icon}
                  className="w-7 h-7 mb-1.5 mx-auto opacity-75"
                />
                <p className="text-[9px] text-white/50 font-mono">{d.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-discipline */}
        {selectedDisc.subDisciplines.length > 0 && (
          <SubDisciplineSelector
            disciplineId={disciplineId}
            selected={subDisciplineId}
            onSelect={setSubDisciplineId}
          />
        )}

        {/* ── Save button ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving || saved}
          className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          style={{
            background: saved ? "#22c55e" : accentColor,
            color: "#040914",
          }}
        >
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.div
                key="spin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-5 h-5 border-2 border-black/30 border-t-black/70 rounded-full animate-spin"
              />
            ) : saved ? (
              <motion.span
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5" /> Saved!
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> Save Profile
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
