// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Opponent Selection Page
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { useStore } from "@store";
import type { AiOpponent } from "@types";
import { AI_OPPONENTS } from "@utils/constants";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DIFF_STARS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];
const DIFF_COLORS = ["", "#3b82f6", "#22d3ee", "#00f0ff", "#a855f7", "#ff00ff"];

export default function PvePrePage() {
  const navigate = useNavigate();
  const { selectOpponent, setBattlePhase } = useStore();
  const { discipline: disc } = usePersonalization();

  const opponents = AI_OPPONENTS.filter(
    (o) => o.discipline === disc.id || true,
  );

  const handleSelect = (opp: AiOpponent) => {
    selectOpponent(opp);
    setBattlePhase("select");
    navigate("/battle/pve");
  };

  return (
    <div className="page pb-safe bg-void">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-t2" />
        </button>
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Choose Opponent
          </p>
          <p className="font-black text-t1">PvE Battle</p>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {opponents.map((opp, i) => {
          const diffColor = DIFF_COLORS[opp.difficulty];
          return (
            <motion.button
              key={opp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(opp)}
              className="w-full text-left bg-s1 rounded-2xl p-4 border border-b1 hover:border-opacity-40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-s2 flex items-center justify-center text-3xl flex-shrink-0">
                  {opp.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-t1">{opp.name}</p>
                    <span
                      className="flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: `${diffColor}20`, color: diffColor }}
                    >
                      {DIFF_STARS[opp.difficulty]}
                    </span>
                  </div>
                  <p className="text-xs text-t3 mt-0.5 leading-tight">
                    {opp.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-t3">
                      <Zap className="w-3 h-3" /> Target: {opp.targetScore}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-t3">
                      <Users className="w-3 h-3" />{" "}
                      {opp.usersBeaten.toLocaleString()} beaten
                    </span>
                  </div>
                  <p className="text-[10px] text-t3 italic mt-1">
                    {opp.styleNote}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
