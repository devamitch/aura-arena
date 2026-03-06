// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Training Selection Page (MusicX-inspired premium)
// Lists all available drills for the active discipline
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { PREMIUM_ASSETS } from "@utils/assets";
import { ArrowLeft, Play, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrainingSelectionPage() {
  const navigate = useNavigate();
  const { discipline, subDiscipline } = usePersonalization();

  const drills = subDiscipline?.drills || discipline.drills || [];
  const name = subDiscipline?.name || discipline.name;

  return (
    <div className="page pb-safe" style={{ background: "var(--background)" }}>
      {/* ── Hero Banner ── */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.TRAINING_HUB_HERO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(1,6,8,0.2) 0%, rgba(1,6,8,0.7) 60%, rgba(1,6,8,1) 100%)",
          }}
        />
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-5 w-10 h-10 rounded-2xl flex items-center justify-center z-10"
          style={{
            background: "rgba(1,6,8,0.6)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>

        {/* Hero title */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <p
            className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
            style={{ color: "var(--ac)" }}
          >
            Select Drill
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">{name}</h1>
        </div>
      </div>

      {/* ── Drills List ── */}
      <div className="px-5 pt-4 pb-6 flex flex-col gap-3">
        {/* Freestyle Option */}
        <button
          onClick={() => navigate("/arena/train")}
          className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group"
          style={{
            background: "rgba(0,240,255,0.04)",
            border: "1px solid rgba(0,240,255,0.2)",
            boxShadow: "0 0 30px rgba(0,240,255,0.06) inset",
          }}
        >
          <div
            className="absolute top-0 inset-x-8 h-[1px]"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(0,240,255,0.6), transparent)",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" style={{ color: "var(--ac)" }} />
                <h3 className="text-base font-black text-white group-hover:text-[var(--ac)] transition-colors">
                  Freestyle Session
                </h3>
              </div>
              <p
                className="text-[10px] font-mono uppercase tracking-[0.15em]"
                style={{ color: "var(--ac)", opacity: 0.7 }}
              >
                Open Flow · No Time Limit
              </p>
              <p className="text-xs text-white/40 mt-2">
                Open-ended motion tracking with no specific drill targets.
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-3 group-hover:scale-110 transition-transform"
              style={{
                background: "rgba(0,240,255,0.08)",
                border: "1px solid rgba(0,240,255,0.3)",
                boxShadow: "0 0 20px rgba(0,240,255,0.2)",
              }}
            >
              <Play className="w-5 h-5 fill-current" style={{ color: "var(--ac)" }} />
            </div>
          </div>
        </button>

        {/* Divider */}
        {drills.length > 0 && (
          <div className="flex items-center gap-4 my-1 opacity-50">
            <div
              className="h-px flex-1"
              style={{
                background: "linear-gradient(to right, transparent, rgba(0,240,255,0.4))",
              }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-[0.25em] font-mono"
              style={{ color: "var(--ac)" }}
            >
              Targeted Drills
            </span>
            <div
              className="h-px flex-1"
              style={{
                background: "linear-gradient(to left, transparent, rgba(0,240,255,0.4))",
              }}
            />
          </div>
        )}

        {drills.length === 0 && (
          <div
            className="rounded-[22px] p-8 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p
              className="text-sm font-mono"
              style={{ color: "rgba(0,240,255,0.3)" }}
            >
              No specific drills for this discipline yet.
            </p>
            <p className="text-xs text-white/20 mt-1">
              Use Freestyle mode to start training.
            </p>
          </div>
        )}

        {drills.map((drill) => (
          <button
            key={drill.id}
            onClick={() => navigate(`/arena/train/${drill.id}`)}
            className="w-full rounded-[22px] p-5 text-left relative overflow-hidden group"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="absolute top-0 inset-x-8 h-[1px]"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(0,240,255,0.25), transparent)",
              }}
            />
            {/* Hover accent line on left */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(to bottom, var(--ac), transparent)" }}
            />

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-[15px] font-bold text-white group-hover:text-[var(--ac)] transition-colors truncate">
                  {drill.name}
                </h3>
                <p
                  className="text-[9px] font-mono uppercase tracking-[0.15em] mt-0.5"
                  style={{ color: "rgba(0,240,255,0.5)" }}
                >
                  {drill.difficulty * 25} Aura-X · {drill.duration}s
                </p>
                <p className="text-xs text-white/30 mt-1.5 leading-snug">{drill.description}</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Play
                  className="w-4 h-4 fill-current"
                  style={{ color: "var(--ac)" }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
