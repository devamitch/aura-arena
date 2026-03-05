import { CameraView } from "@features/arena/components/CameraView";
import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Phase = "matchmaking" | "battle" | "result";

export default function LiveBattlePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("matchmaking");
  const [dots, setDots] = useState("");
  const { discipline: disc, accentColor } = usePersonalization();

  const camera = useCamera({ discipline: disc.id, autoStart: false });

  // Animate dots
  useEffect(() => {
    if (phase !== "matchmaking") return;
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      500,
    );
    return () => clearInterval(t);
  }, [phase]);

  // Simulate finding match after 4s
  useEffect(() => {
    if (phase !== "matchmaking") return;
    const t = setTimeout(() => {
      camera.requestCamera();
      setPhase("battle");
    }, 4000);
    return () => clearTimeout(t);
  }, [phase, camera]);

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => {
            camera.stopCamera();
            navigate(-1);
          }}
          className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
        >
          <X className="w-4 h-4 text-t2" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-mono text-t3 uppercase">LIVE</p>
        </div>
        <div className="w-9" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "matchmaking" && (
          <motion.div
            key="mm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 rounded-full border-4 border-transparent"
              style={{
                borderTopColor: accentColor,
                borderRightColor: `${accentColor}40`,
              }}
            />
            <div className="text-center">
              <p className="font-black text-t1 text-xl">
                Finding opponent{dots}
              </p>
              <p className="text-sm text-t3 mt-1">
                Searching global {disc.name} players
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-t3 underline"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {phase === "battle" && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col gap-3 px-4"
          >
            {/* Score strip */}
            <div className="bg-s1 rounded-2xl p-3 border border-b1 flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-t3">You</p>
                <p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: accentColor }}
                >
                  {camera.currentScore.overall}
                </p>
              </div>
              <p className="font-black text-t2 text-sm">VS</p>
              <div className="text-center flex-1">
                <p className="text-xs text-t3">Opponent</p>
                <p className="text-2xl font-black tabular-nums text-t2">
                  {Math.round(60 + Math.random() * 20)}
                </p>
              </div>
            </div>

            <CameraView
              camera={camera}
              score={camera.currentScore}
              accentColor={accentColor}
              showScore
            />

            <button
              onClick={() => {
                camera.stopCamera();
                setPhase("result");
              }}
              className="py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm"
            >
              End Battle
            </button>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 px-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <p className="text-3xl font-black text-t1">Battle Over!</p>
            <p className="text-sm text-t3">Results are being processed</p>
            <button
              onClick={() => navigate("/home")}
              className="mt-4 px-8 py-3.5 rounded-2xl font-bold text-void"
              style={{ background: accentColor }}
            >
              Return Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
