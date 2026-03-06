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
    <div className="page pb-safe" style={{ background: "#040610" }}>
      {/* ── Header ── */}
      <div className="relative px-5 pt-12 pb-6 border-b border-[#00f0ff]/20 bg-[#020a0d]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/10 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-12 w-10 h-10 flex items-center justify-center rounded-full bg-[#041216] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] z-10 hover:scale-110 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-[#00f0ff]" />
        </button>

        <div className="pl-14 relative z-10 mt-1">
          <p className="text-[10px] font-bold text-[#00f0ff]/80 uppercase tracking-widest mb-1.5 shadow-sm">
            {subDiscipline?.name || discipline.name}
          </p>
          <h1 className="text-2xl font-black text-white tracking-wide drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            Select Training
          </h1>
        </div>
      </div>

      {/* ── Drills List ── */}
      <div
        className="p-5 flex flex-col pt-4"
        style={{
          background: "linear-gradient(180deg, #020a0d 0%, #010609 100%)",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {/* Freestyle Option */}
        <div
          onClick={() => navigate(`/arena/train`)}
          className="w-full rounded-[24px] p-5 mb-4 border border-[#00f0ff]/40 hover:border-[#00f0ff]/80 bg-[#06191f]/70 cursor-pointer group shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,240,255,0.1)] transition-all overflow-hidden relative"
        >
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/80 to-transparent" />
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00f0ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#00f0ff] transition-colors drop-shadow-md">
                Freestyle Session
              </h3>
              <p className="text-[12px] text-[#00f0ff] tracking-widest font-bold uppercase mt-1">
                Open Flow • ∞
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border border-[#00f0ff]/50 bg-[#020a0d] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:bg-[#00f0ff]/20 transition-all group-hover:scale-110">
              <Play className="w-5 h-5 text-[#00f0ff]" fill="currentColor" />
            </div>
          </div>
          <p className="text-sm text-[#e0f2fe]/60 relative z-10 font-medium">
            Open-ended motion tracking. No specific time limit.
          </p>
        </div>

        <div className="w-full flex items-center gap-4 my-3 opacity-60">
          <div className="h-px bg-gradient-to-r from-transparent to-[#00f0ff]/50 flex-1" />
          <span className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em]">
            Targeted Drills
          </span>
          <div className="h-px bg-gradient-to-l from-transparent to-[#00f0ff]/50 flex-1" />
        </div>

        {drills.length === 0 && (
          <p className="text-[#00f0ff]/40 text-center py-10 text-sm font-medium tracking-wide">
            No specific drills loaded for this discipline yet.
          </p>
        )}

        {drills.map((drill) => (
          <div
            key={drill.id}
            onClick={() => navigate(`/arena/train/${drill.id}`)}
            className="w-full rounded-[24px] p-5 mb-4 border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 bg-[#06191f]/40 cursor-pointer group shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(0,240,255,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,240,255,0.05)] transition-all overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent group-hover:via-[#00f0ff]/80 transition-colors" />

            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                  {drill.name}
                </h3>
                <p className="text-[11px] text-[#00f0ff]/60 tracking-wider font-bold uppercase mt-1">
                  {drill.difficulty * 25} Aura-X • {drill.duration}s
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#00f0ff]/30 bg-[#020a0d] flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.15)] group-hover:bg-[#00f0ff]/10 transition-colors">
                <Play className="w-4 h-4 text-[#00f0ff]" fill="currentColor" />
              </div>
            </div>
            <p className="text-[13px] text-[#e0f2fe]/50 font-medium">
              {drill.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
