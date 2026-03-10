// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useCamera Hook (thin wrapper over useGameEngine)
// Camera stream management only. Detection + scoring in workers via useGameEngine.
// ═══════════════════════════════════════════════════════════════════════════════

import { bus } from "@/lib/eventBus";
import type { VisionFrameResult } from "@/lib/mediapipe/types";
import type { PoseCorrectness } from "@lib/poseCorrectness";
import { computeSessionSummary, zeroScore } from "@lib/score/session";
import type {
  DisciplineId,
  FrameScore,
  MediaPipeTask,
  SubDisciplineId,
} from "@types";
import { getDiscipline } from "@utils/constants/disciplines";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameEngine } from "./useGameEngine";

// Helper: merge explicit extraTasks with showFace/showHands options
function deriveExtraTasks(
  extraTasks: MediaPipeTask[] | undefined,
  showFace?: boolean,
  showHands?: boolean,
): MediaPipeTask[] | undefined {
  const base: MediaPipeTask[] = extraTasks ? [...extraTasks] : [];
  if (showFace && !base.includes("face")) base.push("face");
  if (showHands && !base.includes("hands")) base.push("hands");
  return base.length > 0 ? base : undefined;
}

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
  scanProgress: number;
  currentScore: FrameScore;
  poseCorrectness: PoseCorrectness;
  lastResult: VisionFrameResult | null;
  errorMessage: string | null;
  coachMessage: string | null;
  outOfFrame: boolean;
  workerReady: boolean;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleMirror: () => void;
  resetScoring: () => void;
  getSessionSummary: () => ReturnType<typeof computeSessionSummary>;
}

const POSE_OK: PoseCorrectness = {
  isCorrect: true,
  score: 100,
  feedback: [],
  jointAngles: [],
  exercise: "idle",
};

export const useCamera = (opts: UseCameraOptions): UseCameraReturn => {
  const {
    discipline,
    subDiscipline,
    autoStart = false,
    facingMode = "user",
    targetWidth = 1280,
    targetHeight = 720,
  } = opts;

  // Own refs passed into engine
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);

  // Local frame accumulation so getSessionSummary stays synchronous
  const frameScores = useRef<FrameScore[]>([]);
  const comboHistory = useRef<number[]>([]);
  const comboRef = useRef(0);

  const [permission, setPermission] = useState<CameraPermission>("idle");
  const [streaming, setStreaming] = useState(false);
  const [mirrored, setMirrored] = useState(facingMode === "user");
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outOfFrame, setOutOfFrame] = useState(false);

  const accentColor = useMemo(
    () => getDiscipline(discipline).color,
    [discipline],
  );

  // Merge showFace/showHands into extraTasks so VisionWorker initialises the right landmarkers
  const effectiveExtraTasks = useMemo(
    () => deriveExtraTasks(opts.extraTasks, opts.showFace, opts.showHands),
    [opts.extraTasks, opts.showFace, opts.showHands],
  );

  // Delegate detection + scoring to useGameEngine (worker-based)
  const engine = useGameEngine(
    videoRef,
    canvasRef,
    discipline,
    subDiscipline,
    accentColor,
    {
      showSkeleton: opts.showSkeleton,
      showHands: opts.showHands,
      showFace: opts.showFace,
      showObjects: opts.showObjects,
      showBrackets: true,
    },
    undefined,
    undefined,
    effectiveExtraTasks,
  );

  // Accumulate frame scores from event bus (synchronous session summary)
  useEffect(() => {
    const unsub = bus.on("frame:scored", ({ frameScore, newCombo }) => {
      const fs = frameScore as FrameScore;
      const nc = newCombo as number;
      frameScores.current = [...frameScores.current.slice(-599), fs];
      comboHistory.current = [...comboHistory.current.slice(-599), nc];
      if (nc !== comboRef.current) {
        comboRef.current = nc;
        opts.onComboChange?.(nc);
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Out-of-frame detection from pose landmarks
  useEffect(() => {
    const unsub = bus.on("pose:result", ({ poseLandmarks }) => {
      const lms = (poseLandmarks as unknown[][])[0] ?? [];
      const vis = (i: number) =>
        (lms[i] as { visibility?: number })?.visibility ?? 0;
      setOutOfFrame(
        vis(0) < 0.6 || vis(11) < 0.5 || vis(12) < 0.5 || vis(23) < 0.4,
      );
    });
    return unsub;
  }, []);

  // Scan progress animation (first 2.5 s)
  useEffect(() => {
    if (!streaming) return;
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const ms = performance.now() - start;
      setScanProgress(Math.min(1, ms / 2500));
      if (ms < 2500) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [streaming]);

  // ── Camera stream ─────────────────────────────────────────────────────────
  const requestCamera = useCallback(async () => {
    setPermission("requesting");
    setErrorMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unavailable");
      setErrorMessage("Camera API not available.");
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
        // Wait for metadata so videoWidth/videoHeight are set before the loop runs
        if (video.readyState < 1) {
          await new Promise<void>((res) => {
            video.onloadedmetadata = () => res();
          });
        }
        await video.play();
      }
      setPermission("granted");
      setStreaming(true);
      engine.startLoop();
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      setPermission(e.name === "NotAllowedError" ? "denied" : "error");
      setErrorMessage(
        e.name === "NotAllowedError"
          ? "Camera permission denied."
          : e.name === "NotFoundError"
            ? "No camera found."
            : `Camera error: ${e.message ?? "Unknown"}`,
      );
    }
  }, [facingMode, targetWidth, targetHeight, engine, videoRef]);

  const stopCamera = useCallback(() => {
    engine.stopLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setStreaming(false);
    setScanProgress(0);
  }, [engine, videoRef]);

  const toggleMirror = useCallback(() => setMirrored((m) => !m), []);

  const resetScoring = useCallback(() => {
    frameScores.current = [];
    comboHistory.current = [];
    comboRef.current = 0;
    engine.resetSession();
  }, [engine]);

  const getSessionSummary = useCallback(
    () => computeSessionSummary(frameScores.current, comboHistory.current),
    [],
  );

  // Auto-start
  useEffect(() => {
    if (autoStart) requestCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Suppress unused-import warnings
  void zeroScore;

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    permission,
    engineReady: engine.engineReady,
    streaming,
    mirrored,
    scanProgress,
    currentScore: engine.currentScore,
    poseCorrectness: engine.poseCorrectness ?? POSE_OK,
    lastResult: engine.latestResult.current,
    errorMessage,
    coachMessage: engine.coachMessage,
    outOfFrame,
    workerReady: engine.engineReady,
    requestCamera,
    stopCamera,
    toggleMirror,
    resetScoring,
    getSessionSummary,
  };
};
