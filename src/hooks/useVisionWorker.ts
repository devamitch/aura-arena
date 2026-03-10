// Aura Arena — Vision Hook (Worker-first with main-thread fallback)
//
// STRATEGY:
//   1. Spawn vision.worker.ts (combined Pose + Hands + Face)
//   2. Worker uses @vite-ignore dynamic import — works in dev AND production
//   3. If worker sends READY within WORKER_TIMEOUT_MS → use worker path (off main thread)
//   4. If worker errors / times out → fall back to main-thread landmarkers
//   5. sendFrame() transparently routes to whichever backend is active

import disciplineConfig from "@/data/discipline-config.json";
import { bus } from "@/lib/eventBus";
import type { VisionFrameResult } from "@/lib/mediapipe/types";
import { EMPTY_VISION_RESULT } from "@/lib/mediapipe/types";
import type { MediaPipeTask } from "@/types";
import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DC = Record<string, { handTracking: boolean; faceTracking: boolean }>;
const DC_MAP = disciplineConfig as DC;

const WASM = "/mediapipe-wasm";
const POSE_MODEL = "/mediapipe-models/pose_landmarker_lite.task";
const HANDS_MODEL = "/mediapipe-models/hand_landmarker.task";
const FACE_MODEL = "/mediapipe-models/face_landmarker.task";

const WORKER_TIMEOUT_MS = 20000;

// ── Module-level FilesetResolver singleton (shared by main-thread fallback) ──
type Fileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
let _sharedFileset: Fileset | null = null;
let _sharedFilesetPromise: Promise<Fileset> | null = null;

async function getFileset(): Promise<Fileset> {
  if (_sharedFileset) return _sharedFileset;
  if (!_sharedFilesetPromise) {
    _sharedFilesetPromise = FilesetResolver.forVisionTasks(WASM).then((fs) => {
      _sharedFileset = fs;
      return fs;
    });
  }
  return _sharedFilesetPromise;
}

interface VisionState {
  poseReady: boolean;
  handsReady: boolean;
  faceReady: boolean;
  error: string | null;
  usingWorker: boolean;
}

export function useVisionWorker(
  discipline: string,
  extraTasks?: MediaPipeTask[],
): VisionState & {
  sendFrame: (bitmap: ImageBitmap, timestamp: number) => void;
  latestResult: React.MutableRefObject<VisionFrameResult>;
} {
  const [state, setState] = useState<VisionState>({
    poseReady: false,
    handsReady: false,
    faceReady: false,
    error: null,
    usingWorker: false,
  });

  const poseRef = useRef<PoseLandmarker | null>(null);
  const handsRef = useRef<HandLandmarker | null>(null);
  const faceRef = useRef<FaceLandmarker | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerModeRef = useRef<"pending" | "worker" | "main">("pending");

  const latestResult = useRef<VisionFrameResult>({ ...EMPTY_VISION_RESULT });
  const poseBusyRef = useRef(false);
  const lastTsRef = useRef(-1);

  const cfg = useMemo(() => {
    const base = DC_MAP[discipline] ?? { handTracking: false, faceTracking: false };
    if (extraTasks && extraTasks.length > 0) {
      return {
        handTracking: extraTasks.includes("hands"),
        faceTracking: extraTasks.includes("face"),
      };
    }
    return base;
  }, [discipline, extraTasks]);

  // ── Worker result handler ────────────────────────────────────────────────
  const handleWorkerResult = useCallback((data: {
    poseLandmarks: VisionFrameResult["poseLandmarks"];
    poseWorldLandmarks: VisionFrameResult["poseWorldLandmarks"];
    handLandmarks: VisionFrameResult["handLandmarks"];
    handedness: string[];
    faceLandmarks: VisionFrameResult["faceLandmarks"];
    faceBlendshapes: VisionFrameResult["faceBlendshapes"];
    timestamp: number;
  }) => {
    latestResult.current = {
      ...latestResult.current,
      poseLandmarks: data.poseLandmarks,
      poseWorldLandmarks: data.poseWorldLandmarks,
      handLandmarks: data.handLandmarks,
      handedness: data.handedness,
      faceLandmarks: data.faceLandmarks,
      faceBlendshapes: data.faceBlendshapes,
      timestamp: data.timestamp,
    };
    bus.emit("pose:result", {
      poseLandmarks: data.poseLandmarks,
      poseWorldLandmarks: data.poseWorldLandmarks,
      timestamp: data.timestamp,
    });
    if (data.handLandmarks.length > 0) {
      bus.emit("hands:result", { handLandmarks: data.handLandmarks, handedness: data.handedness, timestamp: data.timestamp });
    }
    if (data.faceLandmarks.length > 0) {
      bus.emit("face:result", { faceLandmarks: data.faceLandmarks, faceBlendshapes: data.faceBlendshapes, timestamp: data.timestamp });
    }
    poseBusyRef.current = false;
  }, []);

  // ── Main-thread fallback init ────────────────────────────────────────────
  const initMainThread = useCallback(async (cancelled: { value: boolean }) => {
    workerModeRef.current = "main";
    try {
      const vision = await getFileset();
      if (cancelled.value) return;

      const lm = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
      if (cancelled.value) { lm.close(); return; }
      poseRef.current = lm;
      setState(s => ({ ...s, poseReady: true }));
      bus.emit("worker:ready", { worker: "pose" });

      if (cfg.handTracking) {
        try {
          const hlm = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HANDS_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numHands: 2,
          });
          if (cancelled.value) { hlm.close(); }
          else { handsRef.current = hlm; setState(s => ({ ...s, handsReady: true })); }
        } catch { setState(s => ({ ...s, handsReady: true })); }
      } else {
        setState(s => ({ ...s, handsReady: true }));
      }

      if (cfg.faceTracking) {
        try {
          const flm = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
          });
          if (cancelled.value) { flm.close(); }
          else { faceRef.current = flm; setState(s => ({ ...s, faceReady: true })); }
        } catch { setState(s => ({ ...s, faceReady: true })); }
      } else {
        setState(s => ({ ...s, faceReady: true }));
      }
    } catch (err) {
      if (!cancelled.value) {
        const msg = String(err);
        setState(s => ({ ...s, error: msg }));
        bus.emit("worker:error", { worker: "pose", message: msg });
      }
    }
  }, [cfg.handTracking, cfg.faceTracking]);

  // ── Primary init: try worker → fall back to main thread ──────────────────
  useEffect(() => {
    setState({ poseReady: false, handsReady: false, faceReady: false, error: null, usingWorker: false });
    latestResult.current = { ...EMPTY_VISION_RESULT };
    poseBusyRef.current = false;
    lastTsRef.current = -1;
    workerModeRef.current = "pending";

    const cancelled = { value: false };
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fallback = (reason: string) => {
      if (cancelled.value) return;
      console.warn(`[Vision] ${reason} — using main-thread MediaPipe`);
      workerRef.current = null;
      initMainThread(cancelled);
    };

    try {
      const worker = new Worker(
        new URL("../workers/mediapipe/vision.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      timeoutId = setTimeout(() => {
        worker.terminate();
        fallback("Worker INIT timeout");
      }, WORKER_TIMEOUT_MS);

      worker.onerror = (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        worker.terminate();
        workerRef.current = null;
        fallback(`Worker onerror: ${err.message}`);
      };

      worker.onmessage = (e: MessageEvent) => {
        if (cancelled.value) return;
        const { type } = e.data as { type: string };

        if (type === "READY") {
          if (timeoutId) clearTimeout(timeoutId);
          workerModeRef.current = "worker";
          console.info("[Vision] Worker READY ✓ (detection off main thread)");
          setState({ poseReady: true, handsReady: true, faceReady: true, error: null, usingWorker: true });
          bus.emit("worker:ready", { worker: "pose" });
          worker.onmessage = (ev: MessageEvent) => {
            if (ev.data.type === "VISION_RESULT") handleWorkerResult(ev.data);
          };
        } else if (type === "ERROR") {
          if (timeoutId) clearTimeout(timeoutId);
          worker.terminate();
          workerRef.current = null;
          fallback(`Worker ERROR: ${e.data.message}`);
        }
      };

      worker.postMessage({ type: "INIT", enableHands: cfg.handTracking, enableFace: cfg.faceTracking });
    } catch (spawnErr) {
      if (timeoutId) clearTimeout(timeoutId);
      fallback(`Worker spawn failed: ${spawnErr}`);
    }

    return () => {
      cancelled.value = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "DESTROY" });
        setTimeout(() => workerRef.current?.terminate(), 300);
        workerRef.current = null;
      }
      poseRef.current?.close(); poseRef.current = null;
      handsRef.current?.close(); handsRef.current = null;
      faceRef.current?.close(); faceRef.current = null;
    };
  }, [discipline, cfg.handTracking, cfg.faceTracking]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-frame detection ─────────────────────────────────────────────────
  const sendFrame = useCallback((bitmap: ImageBitmap, timestamp: number) => {
    if (timestamp <= lastTsRef.current) { bitmap.close(); return; }

    const mode = workerModeRef.current;

    // Worker path — transfer bitmap ownership (zero-copy)
    if (mode === "worker" && workerRef.current) {
      if (poseBusyRef.current) { bitmap.close(); return; }
      poseBusyRef.current = true;
      lastTsRef.current = timestamp;
      workerRef.current.postMessage({ type: "DETECT", bitmap, timestamp }, [bitmap]);
      return;
    }

    // Main-thread path
    if (mode === "main" && poseRef.current) {
      if (poseBusyRef.current) { bitmap.close(); return; }
      poseBusyRef.current = true;
      lastTsRef.current = timestamp;
      try {
        const pr = poseRef.current.detectForVideo(bitmap, timestamp);
        const poseLandmarks = pr.landmarks ?? [];
        const poseWorldLandmarks = pr.worldLandmarks ?? [];

        let handLandmarks: VisionFrameResult["handLandmarks"] = [];
        let handedness: string[] = [];
        if (handsRef.current && cfg.handTracking) {
          const hr = handsRef.current.detectForVideo(bitmap, timestamp);
          handLandmarks = hr.landmarks ?? [];
          handedness = (hr.handedness ?? []).map(
            (h: { categoryName?: string }[]) => h[0]?.categoryName ?? "",
          );
          bus.emit("hands:result", { handLandmarks, handedness, timestamp });
        }

        let faceLandmarks: VisionFrameResult["faceLandmarks"] = [];
        let faceBlendshapes: VisionFrameResult["faceBlendshapes"] = [];
        if (faceRef.current && cfg.faceTracking) {
          const fr = faceRef.current.detectForVideo(bitmap, timestamp);
          faceLandmarks = fr.faceLandmarks ?? [];
          faceBlendshapes = (fr.faceBlendshapes ?? []).map(
            (bs: { categories?: { categoryName: string; score: number }[] }) =>
              (bs.categories ?? []).slice(0, 20).map(c => ({ categoryName: c.categoryName, score: c.score })),
          );
          bus.emit("face:result", { faceLandmarks, faceBlendshapes, timestamp });
        }

        latestResult.current = {
          ...latestResult.current,
          poseLandmarks, poseWorldLandmarks,
          handLandmarks, handedness,
          faceLandmarks, faceBlendshapes,
          timestamp,
        };
        bus.emit("pose:result", { poseLandmarks, poseWorldLandmarks, timestamp });
      } catch (err) {
        console.error("[Vision] main-thread detectForVideo error:", err);
      } finally {
        bitmap.close();
        poseBusyRef.current = false;
      }
      return;
    }

    // Still initializing — discard
    bitmap.close();
  }, [cfg.handTracking, cfg.faceTracking, handleWorkerResult]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, sendFrame, latestResult };
}
