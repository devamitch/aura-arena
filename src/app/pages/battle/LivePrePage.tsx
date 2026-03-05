import { usePersonalization } from "@hooks/usePersonalization";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useUser } from "@store";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Users, Wifi, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LivePrePage() {
  const navigate = useNavigate();
  const { accentColor, discipline: disc } = usePersonalization();
  const user = useUser();

  return (
    <div className="min-h-screen bg-void pb-24">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-t2" />
        </button>
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Live Battle
          </p>
          <p className="font-black text-t1">Find Opponent</p>
        </div>
      </div>

      <div className="px-5">
        {/* Matchmaking card */}
        <div className="bg-s1 rounded-3xl border border-b1 p-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
            style={{
              background: `${accentColor}20`,
              border: `2px solid ${accentColor}40`,
              color: accentColor,
            }}
          >
            <DynamicIcon name={disc.icon} className="w-10 h-10" />
          </motion.div>
          <p className="font-black text-t1 text-xl mb-1">Live Match</p>
          <p className="text-sm text-t3 mb-6">
            Battle real athletes in real-time. Your camera-scored performance vs
            theirs.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Globe, label: "Global", desc: "Worldwide" },
              { icon: Users, label: "1v1", desc: "Head-to-head" },
              { icon: Zap, label: "Ranked", desc: "Affects tier" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-s2 rounded-xl p-3 text-center">
                <Icon
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: accentColor }}
                />
                <p className="text-xs font-bold text-t1">{label}</p>
                <p className="text-[9px] text-t3">{desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/battle/live")}
            className="w-full py-4 rounded-2xl font-black text-void text-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              boxShadow: `0 0 30px ${accentColor}50`,
            }}
          >
            <Wifi className="w-5 h-5 inline mr-2" />
            Find Match
          </button>
        </div>

        <p className="text-center text-xs text-t3 mt-4">
          Live battles require a stable internet connection
        </p>
      </div>
    </div>
  );
}
