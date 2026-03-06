// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Opponents List (Exact Match to MusicX "Contests" screen)
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { useStore, useUser } from "@store";
import type { AiOpponent } from "@types";
import { AI_OPPONENTS } from "@utils/constants";
import { ChevronLeft, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PvePrePage() {
  const navigate = useNavigate();
  const { selectOpponent, setBattlePhase } = useStore();
  const user = useUser();
  const { discipline: disc } = usePersonalization();

  const handleSelect = (opp: AiOpponent) => {
    selectOpponent(opp);
    setBattlePhase("select");
    navigate(`/battle/pve/${opp.id}`);
  };

  const firstName = (user?.arenaName || user?.displayName || "You").split(
    " ",
  )[0];

  return (
    <div
      className="page min-h-screen text-white font-sans pb-safe pt-12"
      style={{
        background:
          "radial-gradient(circle at top right, #09343B 0%, #040914 40%, #040610 100%)",
      }}
    >
      {/* ── Header ── */}
      <div className="relative flex items-center justify-center px-5 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold tracking-wide">Contests</h1>
        <div className="absolute right-5 flex items-center gap-2">
          <Globe className="w-5 h-5" style={{ color: "#00f0ff" }} />
          <div
            className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center text-[8px] font-bold"
            style={{ color: "#00f0ff" }}
          >
            24
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex px-2 mb-6 border-b border-white/5">
        {["Upcoming", "Live", "Completed", "Declared"].map((tab) => (
          <button
            key={tab}
            className="flex-1 pb-3 text-sm font-semibold relative"
            style={{ color: tab === "Live" ? "#00f0ff" : "#8F9A9F" }}
          >
            {tab}
            {tab === "Live" && (
              <div
                className="absolute bottom-[-1px] left-0 right-0 h-0.5"
                style={{ background: "#00f0ff" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Cards List ── */}
      <div className="px-5 space-y-4 pb-24">
        {AI_OPPONENTS.slice(0, 4).map((opp, i) => (
          <button
            key={opp.id}
            onClick={() => handleSelect(opp)}
            className="w-full text-left rounded-[24px] relative overflow-hidden"
            style={{
              background: "#0C171A",
              border: "1px solid rgba(0, 240, 255, 0.1)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff] blur-[100px] opacity-10" />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Overlapping Avatars */}
                <div className="relative w-20 h-16 flex-shrink-0">
                  {/* Left Avatar (You) */}
                  <div className="absolute left-0 top-0 w-12 h-12 rounded-full border-2 border-[#0C171A] z-10 overflow-hidden flex items-center justify-center text-xl font-bold bg-[#1C2A34]">
                    {firstName[0]}
                  </div>
                  <div
                    className="absolute left-0 -bottom-1 z-20 px-1.5 py-0.5 rounded-sm text-[8px] font-bold"
                    style={{
                      background: "#0A262C",
                      color: "#00f0ff",
                      border: "1px solid #00f0ff",
                    }}
                  >
                    You
                  </div>

                  {/* Right Avatar (Opponent) */}
                  <div className="absolute left-8 top-0 w-12 h-12 rounded-full border-2 border-[#0C171A] z-0 overflow-hidden flex items-center justify-center text-2xl bg-[#09151A]">
                    {opp.avatar}
                  </div>
                  <div
                    className="absolute left-10 -bottom-1 z-20 px-1.5 py-0.5 rounded-sm text-[8px] font-bold"
                    style={{ background: "#2E3B44", color: "white" }}
                  >
                    {opp.name}
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex-1 mt-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span className="text-white">You</span>
                    <span className="text-[#8F9A9F]">vs</span>
                    <span className="text-white">{opp.name}</span>
                  </h3>
                  <p
                    className="text-[11px] mt-1 line-clamp-1"
                    style={{ color: "#7BA7B4" }}
                  >
                    {opp.description}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className="px-3 py-1.5 rounded text-[10px] font-bold"
                      style={{ background: "#00f0ff", color: "#040610" }}
                    >
                      50 Aura-X
                    </span>
                    <span
                      className="px-3 py-1.5 rounded text-[10px] font-bold border"
                      style={{
                        background: "#0C171A",
                        color: "#00f0ff",
                        borderColor: "#00f0ff",
                      }}
                    >
                      {opp.difficulty} Star
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              className="px-5 py-3 flex items-center justify-between text-[10px] font-bold"
              style={{
                background: "#081115",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2 tracking-widest text-[#8F9A9F]">
                <span>MATCH {i + 1}</span>
                <span>|</span>
                <span>ROUND 1</span>
                <span>|</span>
                <span style={{ color: "#00f0ff" }}>WORLD CUP</span>
              </div>
              <div className="font-mono text-[#7BA7B4] tracking-wider text-xs">
                22 : 47 : 36
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
