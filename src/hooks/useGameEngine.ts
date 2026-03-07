// Aura Arena — Game Engine Hook (coordinates all workers via event bus)
import { useCallback, useEffect, useRef, useState } from 'react';
import { bus } from '@/lib/eventBus';
import { useVisionWorker } from './useVisionWorker';
import { useScoringWorker } from './useScoringWorker';
import { renderFrameToCanvas } from '@/lib/mediapipe/canvas';
import type { FrameScore } from '@/types';
import type { PoseCorrectness } from '@/lib/poseCorrectness';
import { zeroScore } from '@/lib/score/session';
import { createRhythmState } from '@/lib/score/rhythm';

export interface GameEngineState {
  engineReady:     boolean;
  currentScore:    FrameScore;
  poseCorrectness: PoseCorrectness;
  combo:           number;
  coachMessage:    string | null;
}

export function useGameEngine(
  videoRef:    React.RefObject<HTMLVideoElement | null>,
  canvasRef:   React.RefObject<HTMLCanvasElement | null>,
  discipline:  string,
  subDiscipline?: string,
  accentColor = '#00f0ff',
): GameEngineState & {
  startLoop:         () => void;
  stopLoop:          () => void;
  addFrame:          (fs: FrameScore) => void;
  resetSession:      () => void;
  getSessionSummary: () => Promise<unknown>;
} {
  const vision  = useVisionWorker(discipline);
  const scoring = useScoringWorker(discipline, subDiscipline);

  const [score,       setScore]       = useState<FrameScore>(zeroScore());
  const [correctness, setCorrectness] = useState<PoseCorrectness>({ isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle' });
  const [combo,       setCombo]       = useState(0);
  const [coach,       setCoach]       = useState<string | null>(null);

  const rafRef          = useRef(0);
  const prevLmRef       = useRef<unknown[]>([]);
  const frameWinRef     = useRef<unknown[][]>([]);
  const rhythmRef       = useRef(createRhythmState(90));
  const lastComboRef    = useRef(0);
  const uiThrottleRef   = useRef(0);
  const coachTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef(0);
  const comboRef        = useRef(combo);
  const scoreRef        = useRef(score);

  comboRef.current = combo;
  scoreRef.current = score;

  const engineReady = vision.poseReady && scoring.frameReady && scoring.correctnessReady;

  useEffect(() => {
    const unPose = bus.on('pose:result', ({ poseLandmarks }) => {
      const lms = (poseLandmarks as unknown[][])[0] ?? [];
      if (!lms.length) return;
      scoring.scoreFrame({
        landmarks:     lms,
        prevLandmarks: prevLmRef.current,
        frameWindow:   frameWinRef.current,
        discipline,
        subDiscipline,
        elapsedMs:     performance.now() - sessionStartRef.current,
        rhythmState:   rhythmRef.current,
        combo:         comboRef.current,
        lastComboTime: lastComboRef.current,
      });
      scoring.checkForm(lms as Parameters<typeof scoring.checkForm>[0], discipline, subDiscipline);
      prevLmRef.current   = lms as unknown[];
      frameWinRef.current = [...frameWinRef.current.slice(-29), lms as unknown[]];
    });

    const unScore = bus.on('frame:scored', (r) => {
      rhythmRef.current    = r.updatedRhythmState as ReturnType<typeof createRhythmState>;
      lastComboRef.current = r.newLastComboTime;
      scoring.addFrame(r.frameScore as FrameScore);
      const now = performance.now();
      if (now - uiThrottleRef.current > 66) {
        uiThrottleRef.current = now;
        setScore(r.frameScore as FrameScore);
        setCombo(r.newCombo);
      }
    });

    const unForm = bus.on('form:result', ({ poseCorrectness: pc }) => {
      const pcu = pc as PoseCorrectness;
      setCorrectness(pcu);
      if (pcu.exercise !== 'idle' && !pcu.isCorrect && pcu.feedback.length) {
        setCoach(pcu.feedback[0]);
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(() => setCoach(null), 3500);
      } else if (pcu.score >= 85 && scoreRef.current.combo >= 3) {
        setCoach('Perfect form!');
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(() => setCoach(null), 2500);
      }
    });

    return () => { unPose(); unScore(); unForm(); };
  }, [discipline, subDiscipline, scoring]);

  const startLoop = useCallback(() => {
    sessionStartRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      if (canvas.width  !== video.videoWidth)  canvas.width  = video.videoWidth  || 1280;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 720;
      renderFrameToCanvas(canvas, vision.latestResult.current, accentColor, { drawSkeleton:true, drawHands:true, drawFace:true, drawBrackets:true });
      if (engineReady) {
        createImageBitmap(video).then(bmp => vision.sendFrame(bmp, video.currentTime * 1000)).catch(() => {});
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [engineReady, vision, accentColor, videoRef, canvasRef]);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
  }, []);

  return {
    engineReady, currentScore: score, poseCorrectness: correctness, combo, coachMessage: coach,
    startLoop, stopLoop,
    addFrame: scoring.addFrame, resetSession: scoring.resetSession, getSessionSummary: scoring.getSessionSummary,
  };
}
