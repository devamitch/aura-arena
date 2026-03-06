// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Training Selection Page
// Lists all available drills for the active discipline
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrainingSelectionPage() {
  const navigate = useNavigate();
  const { discipline, subDiscipline } = usePersonalization();

  const drills = subDiscipline?.drills || discipline.drills || [];

  return (
    <div className="page pb-safe" style={{ background: "var(--background)" }}>
      {/* ── Header ── */}
      <div
        className="relative px-5 pt-12 pb-6"
        style={{
          borderBottom: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.2)",
          background: "var(--s1)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(var(--ac-rgb,0,240,255),0.1)] to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-12 w-10 h-10 flex items-center justify-center rounded-full z-10 hover:scale-110 transition-transform"
          style={{
            background: "var(--s2)",
            border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.3)",
            boxShadow: "0 0 15px rgba(var(--ac-rgb, 0,240,255), 0.15)",
          }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ac)" }} />
        </button>

        <div className="pl-14 relative z-10 mt-1">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1.5 shadow-sm"
            style={{ color: "var(--ac)", opacity: 0.8 }}
          >
            {subDiscipline?.name || discipline.name}
          </p>
          <h1 className="text-2xl font-black text-white tracking-wide drop-shadow-lg">
            Select Training
          </h1>
        </div>
      </div>

      {/* ── Drills List ── */}
      <div
        className="p-5 flex flex-col pt-4"
        style={{
          background:
            "linear-gradient(180deg, var(--s1) 0%, var(--background) 100%)",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {/* Freestyle Option */}
        <div
          onClick={() => navigate(`/arena/train`)}
          className="w-full rounded-[24px] p-5 mb-4 cursor-pointer group transition-all overflow-hidden relative"
          style={{
            border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.4)",
            background: "rgba(var(--ac-rgb, 0,240,255), 0.04)",
            boxShadow:
              "0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(var(--ac-rgb, 0,240,255), 0.1)",
          }}
        >
          <div
            className="absolute top-0 inset-x-8 h-[1px]"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(var(--ac-rgb, 0,240,255), 0.8), transparent)",
            }}
          />
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--ac)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-[var(--ac)] transition-colors drop-shadow-md">
                Freestyle Session
              </h3>
              <p
                className="text-[12px] tracking-widest font-bold uppercase mt-1"
                style={{ color: "var(--ac)" }}
              >
                Open Flow • ∞
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-all"
              style={{
                border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.5)",
                background: "var(--s2)",
                boxShadow: "0 0 20px rgba(var(--ac-rgb, 0,240,255), 0.3)",
              }}
            >
              <Play
                className="w-5 h-5"
                style={{ color: "var(--ac)" }}
                fill="currentColor"
              />
            </div>
          </div>
          <p className="text-sm text-white/60 relative z-10 font-medium">
            Open-ended motion tracking. No specific time limit.
          </p>
        </div>

        <div className="w-full flex items-center gap-4 my-3 opacity-60">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(var(--ac-rgb, 0,240,255), 0.5))",
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "var(--ac)" }}
          >
            Targeted Drills
          </span>
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(to left, transparent, rgba(var(--ac-rgb, 0,240,255), 0.5))",
            }}
          />
        </div>

        {drills.length === 0 && (
          <p
            className="text-center py-10 text-sm font-medium tracking-wide"
            style={{ color: "rgba(var(--ac-rgb, 0,240,255), 0.4)" }}
          >
            No specific drills loaded for this discipline yet.
          </p>
        )}

        {drills.map((drill) => (
          <div
            key={drill.id}
            onClick={() => navigate(`/arena/train/${drill.id}`)}
            className="w-full rounded-[24px] p-5 mb-4 cursor-pointer group transition-all overflow-hidden relative"
            style={{
              border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.2)",
              background: "rgba(var(--ac-rgb, 0,240,255), 0.02)",
              boxShadow:
                "0 10px 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(var(--ac-rgb, 0,240,255), 0.02)",
            }}
          >
            <div
              className="absolute top-0 inset-x-8 h-[1px]"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(var(--ac-rgb, 0,240,255), 0.4), transparent)",
              }}
            />

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[var(--ac)] transition-colors">
                  {drill.name}
                </h3>
                <p
                  className="text-[11px] tracking-wider font-bold uppercase mt-1"
                  style={{ color: "rgba(var(--ac-rgb, 0,240,255), 0.6)" }}
                >
                  {drill.difficulty * 25} Aura-X • {drill.duration}s
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[rgba(var(--ac-rgb,0,240,255),0.1)] transition-colors"
                style={{
                  border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.3)",
                  background: "var(--s2)",
                  boxShadow: "0 0 10px rgba(var(--ac-rgb, 0,240,255), 0.15)",
                }}
              >
                <Play
                  className="w-4 h-4"
                  style={{ color: "var(--ac)" }}
                  fill="currentColor"
                />
              </div>
            </div>
            <p className="text-[13px] text-white/50 font-medium">
              {drill.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
