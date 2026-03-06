// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Battle (Exact Match to MusicX "Choose Winner" VS screen)
// ═══════════════════════════════════════════════════════════════════════════════

import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { useStore, useUser } from "@store";
import { AI_OPPONENTS } from "@utils/constants";
import { motion } from "framer-motion";
import { Globe, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function PveBattlePage() {
  const navigate = useNavigate();
  const { opponentId } = useParams<{ opponentId?: string }>();
  const { discipline: disc } = usePersonalization();
  const { selectOpponent, setBattlePhase, addXP } = useStore();
  const user = useUser();

  const opp = AI_OPPONENTS.find((o) => o.id === opponentId) ?? AI_OPPONENTS[0];
  const firstName = (user?.arenaName || user?.displayName || "You").split(
    " ",
  )[0];

  // Battle state
  const [battleActive, setBattleActive] = useState(false);
  const [score, setScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const camera = useCamera({
    discipline: disc.id,
    onFrame: useCallback((_res: any, s: any) => setScore(s.overall), []),
  });

  useEffect(() => {
    selectOpponent(opp);
    setBattlePhase("select");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    setBattleActive(true);
    setScore(0);
    setOppScore(0);
    setElapsed(0);
    setResult(null);
    camera.requestCamera();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Simulate opponent scoring
    const base = opp.targetScore;
    oppTimerRef.current = setInterval(() => {
      setOppScore((s) =>
        Math.min(Math.round(s + Math.random() * 5), base + 15),
      );
    }, 2000);
  }, [camera, opp.targetScore]);

  const handleEnd = useCallback(() => {
    setBattleActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (oppTimerRef.current) clearInterval(oppTimerRef.current);
    camera.stopCamera();
    const won = score >= oppScore;
    setResult(won ? "win" : "lose");
    addXP(won ? score * 3 : score);
  }, [camera, score, oppScore, addXP]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")} : ${(s % 60).toString().padStart(2, "0")}`;

  // ── Battle Result ──
  if (result) {
    const won = result === "win";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040914] text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1
            className="text-4xl font-black mb-2"
            style={{ color: won ? "#00f0ff" : "#ef4444" }}
          >
            {won ? "VICTORY" : "DEFEAT"}
          </h1>
          <p className="text-[#8F9A9F] mb-8">
            You: {score} • {opp.name}: {oppScore}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setResult(null);
                handleStart();
              }}
              className="px-6 py-3 rounded-xl border border-[#00f0ff] text-[#00f0ff] font-bold"
            >
              Rematch
            </button>
            <button
              onClick={() => navigate("/arena")}
              className="px-6 py-3 rounded-xl bg-[#00f0ff] text-[#040610] font-bold"
            >
              Continue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── In-Battle Fullscreen Camera ──
  if (battleActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex-1 relative">
          <video
            ref={camera.videoRef}
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ transform: camera.mirrored ? "scaleX(-1)" : "none" }}
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={camera.canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
            style={{ transform: camera.mirrored ? "scaleX(-1)" : "none" }}
          />
          {/* HUD Overlay matching MusicX cyan theme */}
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={handleEnd}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-mono tracking-[0.2em] text-[#00f0ff] mb-1">
                LIVE MATCH
              </p>
              <p className="font-mono font-bold text-white text-lg tracking-wider">
                {formatTime(elapsed)}
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* Scores Bottom */}
          <div className="absolute bottom-10 inset-x-0 px-6 flex items-end justify-between">
            <div className="text-center">
              <p className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
                {score}
              </p>
              <p className="text-[10px] font-bold tracking-widest text-[#00f0ff]">
                YOU
              </p>
            </div>
            <p className="text-sm font-black italic text-white/50 mb-3">VS</p>
            <div className="text-center">
              <p className="text-4xl font-black text-white">{oppScore}</p>
              <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                {opp.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pre-Battle VS Screen (Exact MusicX Match) ──
  return (
    <div
      className="page min-h-screen font-sans pb-safe pt-12 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top right, #0a252f 0%, #03080e 50%, #010305 100%)",
      }}
    >
      {/* ── Top Nav ── */}
      <div className="px-5 mb-8 flex justify-between items-start relative z-10">
        <h1 className="text-[22px] font-bold tracking-tight text-white leading-none">
          <span className="text-[#00f0ff]">Music</span>X
        </h1>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/5 backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-[10px] font-bold tracking-widest text-[#00f0ff] uppercase">
            MusicX World Cup
          </span>
        </div>
      </div>

      <div className="text-center relative z-10 mb-10">
        <h2 className="text-[32px] font-black uppercase tracking-[0.15em] text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
          Choose Winner
        </h2>
      </div>

      {/* ── VS Split Cards ── */}
      <div className="flex justify-center items-center gap-6 px-4 h-[42vh] relative mb-12 z-10">
        {/* VS Badge in Middle */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] w-[52px] h-[52px] flex items-center justify-center z-30"
          style={{
            background: "linear-gradient(135deg, #0cebeb 0%, #00f0ff 100%)",
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            boxShadow: "0 0 30px rgba(0, 240, 255, 0.6)",
          }}
        >
          <div
            className="w-[48px] h-[48px] flex items-center justify-center bg-[#040914]"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <span className="font-black italic text-xl tracking-tighter text-[#00f0ff]">
              VS
            </span>
          </div>
        </div>

        {/* ── Left Card (Player) ── */}
        <div className="flex-1 max-w-[160px] h-full flex flex-col items-center">
          <div
            className="w-full h-[75%] relative overflow-hidden flex items-center justify-center"
            style={{
              clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0 100%)", // Angled left
              background:
                "linear-gradient(180deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)",
              border: "1px solid rgba(0,240,255,0.3)",
            }}
          >
            <div className="absolute inset-0 bg-[#00f0ff]/5 backdrop-blur-md z-0" />
            <span className="text-6xl z-10 text-[#00f0ff]/80 font-black">
              {firstName[0]}
            </span>
            {/* Gradient glow top edge */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[#00f0ff] z-20 shadow-[0_4px_15px_#00f0ff]" />
          </div>

          <div className="mt-4 text-center w-full">
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-3 leading-none">
              {firstName}
            </h3>
            <button
              onClick={handleStart}
              className="w-full py-2.5 rounded-[8px] font-bold text-[11px] uppercase tracking-widest text-[#040914]"
              style={{
                background: "#00f0ff",
                boxShadow: "0 4px 15px rgba(0,240,255,0.3)",
              }}
            >
              Bet 50 Tokens
            </button>
          </div>
        </div>

        {/* ── Right Card (Opponent) ── */}
        <div className="flex-1 max-w-[160px] h-full flex flex-col items-center">
          <div
            className="w-full h-[75%] relative overflow-hidden flex items-center justify-center"
            style={{
              clipPath: "polygon(0 0, 85% 0, 100% 100%, 15% 100%)", // Angled right
              background:
                "linear-gradient(180deg, rgba(8, 20, 25, 0.9) 0%, rgba(0, 0, 0, 0.8) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="absolute inset-0 bg-white/5 backdrop-blur-md z-0" />
            <span className="text-[70px] z-10 grayscale brightness-150">
              {opp.avatar}
            </span>
          </div>

          <div className="mt-4 text-center w-full flex flex-col justify-between">
            <h3 className="text-xl font-black text-white/50 uppercase tracking-widest mb-3 leading-none drop-shadow-md">
              {opp.name}
            </h3>
            <button
              onClick={handleStart}
              className="w-full py-2.5 rounded-[8px] border border-white/20 font-bold text-[11px] uppercase tracking-widest text-white/80"
              style={{
                background: "#061217",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
              }}
            >
              Bet 50 Tokens
            </button>
          </div>
        </div>
      </div>

      {/* ── Match Details Footer ── */}
      <div className="absolute bottom-safe w-full px-6 pb-6 text-center z-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00f0ff] opacity-70 mb-2 cursor-pointer flex items-center justify-center gap-2">
          Match Details
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </p>
      </div>

      {/* Background Grid / Detail lines */}
      <div
        className="absolute inset-x-0 top-1/2 bottom-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
