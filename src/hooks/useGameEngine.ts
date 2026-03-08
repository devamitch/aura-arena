// Aura Arena — Game Engine Hook (coordinates all workers via event bus)
import { bus } from "@/lib/eventBus";
import { renderFrameToCanvas } from "@/lib/mediapipe/canvas";
import type { PoseCorrectness } from "@/lib/poseCorrectness";
import { createRhythmState } from "@/lib/score/rhythm";
import { zeroScore } from "@/lib/score/session";
import type { FrameScore } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScoringWorker } from "./useScoringWorker";
import { useSupabaseSync } from "./useSupabaseSync";
import { useVisionWorker } from "./useVisionWorker";

export interface GameEngineState {
  engineReady: boolean;
  currentScore: FrameScore;
  poseCorrectness: PoseCorrectness;
  combo: number;
  coachMessage: string | null;
}

export function useGameEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  discipline: string,
  subDiscipline?: string,
  accentColor = "#00f0ff",
  drawOptions?: {
    showSkeleton?: boolean;
    showHands?: boolean;
    showFace?: boolean;
    showObjects?: boolean;
    showBrackets?: boolean;
  },
  userId?: string,
  sessionId?: string,
): GameEngineState & {
  startLoop: () => void;
  stopLoop: () => void;
  addFrame: (fs: FrameScore) => void;
  resetSession: () => void;
  getSessionSummary: () => Promise<unknown>;
} {
  const vision = useVisionWorker(discipline);
  const scoring = useScoringWorker(discipline, subDiscipline);
  const sync = useSupabaseSync();
  const lastSyncSecRef = useRef(-1); // throttle: 1 frame/second saved

  const [score, setScore] = useState<FrameScore>(zeroScore());
  const [correctness, setCorrectness] = useState<PoseCorrectness>({
    isCorrect: true,
    score: 100,
    feedback: [],
    jointAngles: [],
    exercise: "idle",
  });
  const [combo, setCombo] = useState(0);
  const [coach, setCoach] = useState<string | null>(null);

  const rafRef = useRef(0);
  const prevLmRef = useRef<unknown[]>([]);
  const frameWinRef = useRef<unknown[][]>([]);
  const rhythmRef = useRef(createRhythmState(90));
  const lastComboRef = useRef(0);
  const uiThrottleRef = useRef(0);
  const coachTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef(0);
  const comboRef = useRef(combo);
  const scoreRef = useRef(score);

  comboRef.current = combo;
  scoreRef.current = score;

  // Core ready = pose tracking + frame scoring. Correctness (TF.js) is bonus — don't block on it.
  const engineReady = vision.poseReady && scoring.frameReady;

  useEffect(() => {
    console.log(
      `[Engine State] vision: ${vision.poseReady}, scoring: ${scoring.frameReady}`,
    );
    if (vision.error) console.error("Vision Error:", vision.error);
  }, [vision.poseReady, scoring.frameReady, vision.error]);

  // Ref so the RAF loop always reads the LATEST value without stale closures
  const engineReadyRef = useRef(false);
  const visionRef = useRef(vision);
  const accentColorRef = useRef(accentColor);
  engineReadyRef.current = engineReady;
  visionRef.current = vision;
  accentColorRef.current = accentColor;
  const drawOptionsRef = useRef(drawOptions);
  drawOptionsRef.current = drawOptions;

  useEffect(() => {
    const unPose = bus.on("pose:result", ({ poseLandmarks }) => {
      const lms = (poseLandmarks as unknown[][])[0] ?? [];
      if (!lms.length) return;

      // ── Throttled Supabase sync (1 frame/sec) ─────────────────────────────
      if (userId && sessionId) {
        const second = Math.floor(
          (performance.now() - sessionStartRef.current) / 1000,
        );
        if (second !== lastSyncSecRef.current && second >= 0) {
          lastSyncSecRef.current = second;
          sync.queueFrames(
            userId,
            sessionId,
            discipline,
            [
              {
                second,
                landmarks: lms,
                score: scoreRef.current.overall,
              },
            ],
            subDiscipline,
          );
        }
      }

      scoring.scoreFrame({
        landmarks: lms,
        prevLandmarks: prevLmRef.current,
        frameWindow: frameWinRef.current,
        discipline,
        subDiscipline,
        elapsedMs: performance.now() - sessionStartRef.current,
        rhythmState: rhythmRef.current,
        combo: comboRef.current,
        lastComboTime: lastComboRef.current,
      });
      scoring.checkForm(
        lms as Parameters<typeof scoring.checkForm>[0],
        discipline,
        subDiscipline,
      );
      prevLmRef.current = lms as unknown[];
      frameWinRef.current = [
        ...frameWinRef.current.slice(-29),
        lms as unknown[],
      ];
    });

    const unScore = bus.on("frame:scored", (r) => {
      rhythmRef.current = r.updatedRhythmState as ReturnType<
        typeof createRhythmState
      >;
      lastComboRef.current = r.newLastComboTime;
      scoring.addFrame(r.frameScore as FrameScore);
      const now = performance.now();
      if (now - uiThrottleRef.current > 66) {
        uiThrottleRef.current = now;
        setScore(r.frameScore as FrameScore);
        setCombo(r.newCombo);
      }
    });

    const unForm = bus.on("form:result", ({ poseCorrectness: pc }) => {
      const pcu = pc as PoseCorrectness;
      setCorrectness(pcu);
      if (pcu.exercise !== "idle" && !pcu.isCorrect && pcu.feedback.length) {
        setCoach(pcu.feedback[0]);
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(() => setCoach(null), 3500);
      } else if (pcu.score >= 85 && scoreRef.current.combo >= 3) {
        setCoach("Perfect form!");
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(() => setCoach(null), 2500);
      }
    });

    return () => {
      unPose();
      unScore();
      unForm();
    };
  }, [discipline, subDiscipline, scoring]);

  const startLoop = useCallback(() => {
    sessionStartRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      // Wait until we have actual video dimensions (readyState ≥ HAVE_METADATA)
      if (video.readyState < 1 || !video.videoWidth) return;
      // Sync canvas buffer size to actual video resolution
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;
      renderFrameToCanvas(
        canvas,
        visionRef.current.latestResult.current,
        accentColorRef.current,
        {
          drawSkeleton: drawOptionsRef.current?.showSkeleton ?? true,
          drawHands: drawOptionsRef.current?.showHands ?? true,
          drawFace: drawOptionsRef.current?.showFace ?? true,
          drawBrackets: drawOptionsRef.current?.showBrackets ?? true,
          drawObjects: drawOptionsRef.current?.showObjects ?? true,
        },
      );
      // Send frame to workers only when ready — use ref so we never miss the transition
      if (engineReadyRef.current && video.readyState >= 2) {
        createImageBitmap(video)
          .then((bmp) =>
            visionRef.current.sendFrame(bmp, video.currentTime * 1000),
          )
          .catch(() => {});
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, canvasRef]); // stable — reads live values via refs

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
  }, []);

  return {
    engineReady,
    currentScore: score,
    poseCorrectness: correctness,
    combo,
    coachMessage: coach,
    startLoop,
    stopLoop,
    addFrame: scoring.addFrame,
    resetSession: scoring.resetSession,
    getSessionSummary: scoring.getSessionSummary,
  };
}
