// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useCamera Hook (100% functional)
// Owns: camera permission state, MediaPipe task init, rAF detection loop,
// score computation via scoreEngine, canvas rendering.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  DISCIPLINE_TASKS,
  anyTaskReady,
  expressionCoachFeedback,
  initVisionTasks,
  isTaskReady,
  parseFaceExpressions,
  processVideoFrame,
  renderFrameToCanvas,
  type VisionFrameResult,
} from "@lib/mediapipe/allTasks";
import {
  computeSessionSummary,
  createRhythmState,
  scoreFrame,
  zeroScore,
  type RhythmState,
  type ScoreFrameInput,
} from "@lib/scoreEngine";
import type {
  DisciplineId,
  FrameScore,
  Landmark,
  MediaPipeTask,
  SubDisciplineId,
} from "@types";
import { getDiscipline } from "@utils/constants/disciplines";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type CameraPermission =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export interface UseCameraOptions {
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  extraTasks?: MediaPipeTask[];
  onFrame?: (result: VisionFrameResult, score: FrameScore) => void;
  onComboChange?: (combo: number) => void;
  onGesture?: (label: string, bonus: number) => void;
  autoStart?: boolean;
  facingMode?: "user" | "environment";
  targetWidth?: number;
  targetHeight?: number;
  showSkeleton?: boolean;
  showFace?: boolean;
  showHands?: boolean;
  showObjects?: boolean;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  permission: CameraPermission;
  engineReady: boolean;
  streaming: boolean;
  mirrored: boolean;
  scanProgress: number; // 0→1 for HUD scan animation
  currentScore: FrameScore;
  lastResult: VisionFrameResult | null;
  errorMessage: string | null;
  coachMessage: string | null;
  outOfFrame: boolean;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleMirror: () => void;
  resetScoring: () => void;
  getSessionSummary: () => ReturnType<typeof computeSessionSummary>;
}

// ─── SIMULATED DATA (for when MediaPipe hasn't loaded yet) ────────────────────

const simulateScore = (t: number, _discipline: DisciplineId): FrameScore => {
  const base = 65;
  const wave = Math.sin(t / 3000) * 12 + Math.sin(t / 1100) * 6;
  const noise = (Math.random() - 0.5) * 8;
  const overall = Math.max(0, Math.min(100, Math.round(base + wave + noise)));
  return {
    overall,
    accuracy: Math.round(overall + (Math.random() - 0.5) * 10),
    stability: Math.round(overall + (Math.random() - 0.5) * 8),
    timing: Math.round(overall + (Math.random() - 0.5) * 12),
    expressiveness: Math.round(60 + Math.random() * 20),
    power: Math.round(50 + Math.random() * 30),
    balance: Math.round(65 + Math.random() * 20),
    combo: overall > 78 ? Math.floor(t / 3000) % 8 : 0,
    raw: {
      cosineSimilarity: 0,
      jitterMagnitude: 0,
      rhythmPhaseError: 0,
      symmetryScore: 0,
      depthScore: 0,
      velocityScore: 0,
      keypointConfidence: 0,
    },
  };
};

const simulateLandmarks = (t: number): Landmark[] =>
  Array.from({ length: 33 }, (_, i) => ({
    x: 0.5 + (i % 2 === 0 ? -0.1 : 0.1) + Math.sin(t / 2000 + i) * 0.02,
    y: 0.05 + i * 0.028 + Math.sin(t / 3000 + i * 0.5) * 0.015,
    z: Math.sin(t / 4000 + i) * 0.02,
    visibility: 0.9,
  }));

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useCamera = (opts: UseCameraOptions): UseCameraReturn => {
  const {
    discipline,
    subDiscipline,
    extraTasks = [],
    onFrame,
    onComboChange,
    onGesture,
    autoStart = false,
    facingMode = "user",
    targetWidth = 1280,
    targetHeight = 720,
    showSkeleton = true,
    showFace = true,
    showHands = true,
    showObjects = true,
  } = opts;

  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(0);

  // Scoring state (mutable refs — don't need re-renders)
  const prevLandmarksRef = useRef<Landmark[]>([]);
  const frameWindowRef = useRef<Landmark[][]>([]);
  const rhythmStateRef = useRef<RhythmState | null>(null);
  const comboRef = useRef(0);
  const lastComboTimeRef = useRef(0);
  const lastGestureRef = useRef<string | null>(null);
  const frameScoresRef = useRef<FrameScore[]>([]);
  const comboHistoryRef = useRef<number[]>([]);
  const scanStartRef = useRef<number>(Date.now());

  // React state (drives UI)
  const [permission, setPermission] = useState<CameraPermission>("idle");
  const [engineReady, setEngineReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [mirrored, setMirrored] = useState(facingMode === "user");
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScore, setCurrentScore] = useState<FrameScore>(zeroScore());
  const [lastResult, setLastResult] = useState<VisionFrameResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [outOfFrame, setOutOfFrame] = useState(false);

  // Accent color for canvas rendering
  const accentColor = useMemo(
    () => getDiscipline(discipline).color,
    [discipline],
  );

  // Rhythm BPM from discipline/subdiscipline
  const bpm = useMemo(() => {
    const d = getDiscipline(discipline);
    return d.rhythmBPM ?? 80;
  }, [discipline]);

  // ── Init MediaPipe tasks ──────────────────────────────────────────────────

  useEffect(() => {
    const tasks: MediaPipeTask[] = [
      ...DISCIPLINE_TASKS[discipline],
      ...extraTasks,
    ].filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

    let cancelled = false;
    initVisionTasks(tasks).then(() => {
      if (!cancelled) setEngineReady(anyTaskReady());
    });

    return () => {
      cancelled = true;
    };
  }, [discipline, extraTasks]);

  // ── rAF detection loop ────────────────────────────────────────────────────

  const startLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    rhythmStateRef.current = createRhythmState(bpm);
    scanStartRef.current = Date.now();

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      if (video.readyState < 2) return;

      // Keep canvas in sync with video dimensions
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth || targetWidth;
        canvas.height = video.videoHeight || targetHeight;
      }

      const timestamp = video.currentTime * 1000;
      const elapsedMs = now - sessionStartRef.current;

      // Scan line animation (0→1 in 2.5s)
      const scanMs = now - scanStartRef.current;
      if (scanMs < 2500) setScanProgress(scanMs / 2500);

      let result: VisionFrameResult;
      let score: FrameScore;

      if (isTaskReady("pose")) {
        // Real MediaPipe processing
        result = processVideoFrame(video, timestamp);

        const landmarks = result.poseLandmarks[0] ?? [];

        // Framing Check — Ensure head, shoulders and hips are visible
        const nose = landmarks[0];
        const ls = landmarks[11];
        const rs = landmarks[12];
        const lh = landmarks[23];
        const rh = landmarks[24];

        const isOutOfFrame =
          !nose ||
          nose.visibility! < 0.6 ||
          !ls ||
          ls.visibility! < 0.5 ||
          !rs ||
          rs.visibility! < 0.5 ||
          !lh ||
          lh.visibility! < 0.4 ||
          !rh ||
          rh.visibility! < 0.4;

        setOutOfFrame(isOutOfFrame);

        // Update frame window (last 30 frames)
        frameWindowRef.current = [
          ...frameWindowRef.current.slice(-29),
          landmarks,
        ];

        const rhythmState = rhythmStateRef.current ?? createRhythmState(bpm);

        const input: ScoreFrameInput = {
          landmarks,
          previousLandmarks: prevLandmarksRef.current,
          frameWindow: frameWindowRef.current,
          discipline,
          subDiscipline,
          elapsedMs,
          rhythmState,
          currentCombo: comboRef.current,
          lastComboTime: lastComboTimeRef.current,
          gestures: result.gestures,
          drill: undefined, // Add if needed
        };

        const output = scoreFrame(input);
        score = output.frameScore;

        // Gesture Detection & Event
        const topGest = result.gestures?.[0]?.[0];
        if (
          topGest &&
          topGest.score > 0.85 &&
          topGest.categoryName !== "None"
        ) {
          if (topGest.categoryName !== lastGestureRef.current) {
            lastGestureRef.current = topGest.categoryName;
            onGesture?.(topGest.categoryName, 5);
          }
        } else if (!topGest || topGest.score < 0.4) {
          lastGestureRef.current = null;
        }

        // Update refs
        rhythmStateRef.current = output.updatedRhythmState;
        prevLandmarksRef.current = landmarks;

        if (output.newCombo !== comboRef.current) {
          comboRef.current = output.newCombo;
          onComboChange?.(output.newCombo);
        }
        lastComboTimeRef.current = output.newLastComboTime;

        // Gesture events
        const gesture = result.gestures[0]?.[0];
        if (gesture && gesture.categoryName !== "None" && gesture.score > 0.7) {
          onGesture?.(gesture.categoryName, output.newCombo);
        }

        // Face expression coaching feedback
        if (result.faceBlendshapes[0]?.length) {
          const exprs = parseFaceExpressions(result.faceBlendshapes[0]);
          const msg = expressionCoachFeedback(exprs, discipline);
          setCoachMessage(msg);
        } else {
          setCoachMessage(null);
        }

        setLastResult(result);
      } else {
        // Simulation mode
        const simLandmarks = simulateLandmarks(elapsedMs);
        result = {
          timestamp,
          poseLandmarks: [simLandmarks],
          poseWorldLandmarks: [],
          handLandmarks: [],
          handedness: [],
          faceLandmarks: [],
          faceBlendshapes: [],
          gestures: [],
          objectDetections: [],
        };
        score = simulateScore(elapsedMs, discipline);
      }

      // History for session summary
      frameScoresRef.current = [...frameScoresRef.current.slice(-300), score];
      comboHistoryRef.current = [
        ...comboHistoryRef.current.slice(-300),
        score.combo,
      ];

      setCurrentScore(score);

      // Render canvas
      renderFrameToCanvas(canvas, result, accentColor, {
        drawSkeleton: showSkeleton,
        drawHands: showHands,
        drawFace: showFace,
        drawObjects: showObjects,
        drawBrackets: true,
        drawScanLine: scanMs < 2500,
        scanProgress: Math.min(1, scanMs / 2500),
        mirrored,
      });

      onFrame?.(result, score);
    };

    sessionStartRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
  }, [
    discipline,
    subDiscipline,
    bpm,
    accentColor,
    mirrored,
    showSkeleton,
    showHands,
    showFace,
    showObjects,
    onFrame,
    onComboChange,
    onGesture,
    targetHeight,
    targetWidth,
  ]);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Camera permission + stream ────────────────────────────────────────────

  const requestCamera = useCallback(async () => {
    setPermission("requesting");
    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unavailable");
      setErrorMessage("Camera API not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      setPermission("granted");
      setStreaming(true);
      startLoop();
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings."
          : err?.name === "NotFoundError"
            ? "No camera found on this device."
            : `Camera error: ${err?.message ?? "Unknown error"}`;
      setPermission(err?.name === "NotAllowedError" ? "denied" : "error");
      setErrorMessage(msg);
    }
  }, [facingMode, targetWidth, targetHeight, startLoop]);

  const stopCamera = useCallback(() => {
    stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setStreaming(false);
    setScanProgress(0);
    // Keep last score visible for post-session screen
  }, [stopLoop]);

  const toggleMirror = useCallback(() => setMirrored((m) => !m), []);

  const resetScoring = useCallback(() => {
    frameScoresRef.current = [];
    comboHistoryRef.current = [];
    prevLandmarksRef.current = [];
    frameWindowRef.current = [];
    comboRef.current = 0;
    lastComboTimeRef.current = 0;
    rhythmStateRef.current = createRhythmState(bpm);
    setCurrentScore(zeroScore());
    scanStartRef.current = Date.now();
    setScanProgress(0);
  }, [bpm]);

  const getSessionSummary = useCallback(
    () =>
      computeSessionSummary(frameScoresRef.current, comboHistoryRef.current),
    [],
  );

  // Auto-start
  useEffect(() => {
    if (autoStart) requestCamera();
    return () => {
      stopCamera();
      // DON'T destroy tasks here — they are expensive to reload
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef,
    canvasRef,
    permission,
    engineReady,
    streaming,
    mirrored,
    scanProgress,
    currentScore,
    lastResult,
    errorMessage,
    coachMessage,
    outOfFrame,
    requestCamera,
    stopCamera,
    toggleMirror,
    resetScoring,
    getSessionSummary,
  };
};
