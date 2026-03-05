import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import {
  useBattleResult,
  useBattleTime,
  useOpponentScore,
  usePlayerScore,
  useSelectedOpponent,
  useStore,
} from "@store";
import { CameraView } from "@features/arena/components/CameraView";
import { useBattleCoach } from "@hooks/useAI";
import { AnimatedNumber } from "@shared/components/ui/AnimatedNumber";
import { ArcGauge } from "@shared/components/ui/ArcGauge";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PveBattlePage() {
  const navigate = useNavigate();
  const opponent = useSelectedOpponent();
  const pScore = usePlayerScore();
  const oScore = useOpponentScore();
  const timeLeft = useBattleTime();
  const result = useBattleResult();
  const {
    updateBattleScores,
    setBattleTime,
    setBattleResult,
    resetBattle,
    unlockAchievement,
    updateMissionProgress,
    addXP,
    updateUser,
  } = useStore();
  const { discipline: disc, accentColor } = usePersonalization();
  const camera = useCamera({ discipline: disc.id, autoStart: false });
  const coachAI = useBattleCoach();

  const [phase, setPhase] = useState<"countdown" | "battle" | "result">(
    "countdown",
  );
  const [cd, setCd] = useState(3);
  const oppRef = useRef(oScore);
  oppRef.current = oScore;

  /* countdown */
  useEffect(() => {
    if (cd <= 0) {
      camera.requestCamera();
      setPhase("battle");
      return;
    }
    const t = setTimeout(() => setCd((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [cd, camera]);

  /* battle timer + opponent drift */
  useEffect(() => {
    if (phase !== "battle") return;
    const interval = setInterval(() => {
      /* tick timer */
      setBattleTime((t: number) => {
        if (t <= 1) {
          clearInterval(interval);
          finishBattle();
          return 0;
        }
        return t - 1;
      });
      /* drift opponent score toward target */
      const target = opponent?.targetScore ?? 75;
      const noise = (Math.random() - 0.48) * 4;
      const next = Math.min(
        100,
        Math.max(0, oppRef.current + (target - oppRef.current) * 0.06 + noise),
      );
      updateBattleScores(camera.currentScore.overall, Math.round(next));
    }, 1000);
    return () => clearInterval(interval);
  }, [
    phase,
    setBattleTime,
    finishBattle,
    opponent?.targetScore,
    camera.currentScore.overall,
    updateBattleScores,
  ]);

  const finishBattle = useCallback(() => {
    camera.stopCamera();
    const won = pScore >= oScore;
    const summary = camera.getSessionSummary();
    const resultObj = {
      won,
      playerScore: pScore,
      opponentScore: oScore,
      accuracy: summary.accuracy,
      stability: summary.stability,
      timing: summary.timing,
      expressiveness: summary.expressiveness,
      power: summary.power,
      balance: summary.balance,
      maxCombo: summary.maxCombo,
      duration: 60,
      framesScored: summary.totalFrames,
    };
    setBattleResult(resultObj);
    if (won) {
      unlockAchievement("pve_win");
      updateMissionProgress("pve_win", 1);
      addXP(150);
      updateUser({ pveWins: 1 });
    } else {
      unlockAchievement("pve_loss");
      addXP(40);
    }
    coachAI.generate(disc.id, undefined, summary, 2, won);
    setPhase("result");
  }, [
    pScore,
    oScore,
    camera,
    setBattleResult,
    unlockAchievement,
    updateMissionProgress,
    addXP,
    updateUser,
    coachAI,
    disc.id,
  ]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const winning = pScore >= oScore;

  if (!opponent) {
    navigate("/battle/pve/select");
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "var(--void)" }}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-3 pb-2 flex-shrink-0 z-20">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            camera.stopCamera();
            resetBattle();
            navigate("/arena");
          }}
          className="btn-icon"
        >
          <X className="w-4 h-4" />
        </motion.button>
        <div className="flex-1" />
        {phase === "battle" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 anim-live" />
            <p className="font-mono text-sm font-bold tabular text-[var(--t1)]">
              {mm}:{ss}
            </p>
          </div>
        )}
      </div>

      {/* countdown */}
      <AnimatePresence>
        {phase === "countdown" && cd > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-40"
            style={{
              background: "rgba(4,6,16,.9)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p className="label-section mb-6 text-[var(--t3)]">
              vs {opponent.name} — {opponent.targetScore} target
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={cd}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="font-display font-extrabold"
                style={{
                  fontSize: "clamp(90px,24vw,130px)",
                  color: accentColor,
                  textShadow: `0 0 70px ${accentColor}99`,
                }}
              >
                {cd}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* battle view */}
      {phase === "battle" && (
        <div className="flex-1 flex flex-col gap-2 px-3 overflow-hidden">
          {/* score comparison */}
          <div className="flex items-center gap-2 py-2 flex-shrink-0">
            <ScoreBar
              label="You"
              score={pScore}
              color={accentColor}
              align="left"
              winning={winning}
            />
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <p className="font-display font-extrabold text-lg text-[var(--t3)] leading-none">
                VS
              </p>
            </div>
            <ScoreBar
              label={opponent.name}
              score={oScore}
              color={`${opponent.color || "#ef4444"}`}
              align="right"
              winning={!winning}
            />
          </div>

          {/* camera */}
          <div className="flex-1">
            <CameraView
              camera={camera}
              score={camera.currentScore}
              accentColor={accentColor}
              showScore
            />
          </div>

          {/* end btn */}
          <div className="pb-safe pb-4 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={finishBattle}
              className="w-full py-3.5 rounded-[18px] font-display font-bold text-sm"
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)",
                color: "#ef4444",
              }}
            >
              End Battle
            </motion.button>
          </div>
        </div>
      )}

      {/* result overlay */}
      <AnimatePresence>
        {phase === "result" && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 z-50"
            style={{
              background: "rgba(4,6,16,.96)",
              backdropFilter: "blur(16px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 18,
                delay: 0.1,
              }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                {result.won ? (
                  <Trophy className="w-10 h-10 text-primary" />
                ) : (
                  <X className="w-10 h-10 text-destructive" />
                )}
              </div>
              <p className="font-display font-extrabold text-4xl text-[var(--t1)] leading-none mb-1">
                {result.won ? "Victory!" : "Defeated"}
              </p>
              <p
                className="label-hud mb-6"
                style={{ color: result.won ? "#10b981" : "#ef4444" }}
              >
                {result.won
                  ? "Outstanding performance"
                  : "+40 XP for the effort"}
              </p>
            </motion.div>

            {/* scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 280 }}
              className="w-full rounded-[22px] p-4 mb-6"
              style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
            >
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <ArcGauge
                    value={result.playerScore}
                    size={80}
                    strokeWidth={7}
                    color={accentColor}
                  />
                  <p className="label-hud mt-2">You</p>
                </div>
                <p className="font-display font-extrabold text-2xl text-[var(--t4)]">
                  VS
                </p>
                <div className="text-center">
                  <ArcGauge
                    value={result.opponentScore}
                    size={80}
                    strokeWidth={7}
                    color="#6b7280"
                  />
                  <p className="label-hud mt-2">{opponent.name}</p>
                </div>
              </div>
            </motion.div>

            {/* coach */}
            {coachAI.text && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full rounded-[18px] p-3.5 mb-6"
                style={{
                  background: "var(--s2)",
                  border: "1px solid var(--b1)",
                }}
              >
                <p className="text-sm text-[var(--t2)] italic leading-relaxed">
                  "{coachAI.text}"
                </p>
              </motion.div>
            )}

            {/* actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full grid grid-cols-2 gap-3"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetBattle();
                  navigate("/battle/pve/select");
                }}
                className="py-3.5 rounded-[18px] font-display font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: "var(--s2)",
                  border: "1px solid var(--b1)",
                  color: "var(--t2)",
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Again
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetBattle();
                  navigate("/arena");
                }}
                className="py-3.5 rounded-[18px] font-display font-bold text-sm"
                style={{
                  background: `linear-gradient(145deg,${accentColor},${accentColor}bb)`,
                  color: "#040610",
                }}
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ScoreBar = ({
  label,
  score,
  color,
  align,
  winning,
}: {
  label: string;
  score: number;
  color: string;
  align: "left" | "right";
  winning: boolean;
}) => (
  <div className={cn("flex-1 flex flex-col", align === "right" && "items-end")}>
    <p className="label-hud mb-1">{label}</p>
    <motion.p
      animate={{ scale: winning ? [1, 1.06, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className="font-display font-extrabold text-3xl leading-none tabular"
      style={{ color: winning ? color : "var(--t3)" }}
    >
      <AnimatedNumber value={score} />
    </motion.p>
    <div
      className="w-full h-1.5 mt-1 rounded-full overflow-hidden"
      style={{ background: "var(--s3)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        animate={{ width: `${score}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
      />
    </div>
  </div>
);
