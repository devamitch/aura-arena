// Aura Arena — Vision Hook (Main-thread only, no web workers)
//
// STRATEGY:
//   Runs PoseLandmarker + HandLandmarker + FaceLandmarker directly on the
//   main thread. All three models are ALWAYS initialized regardless of discipline,
//   so every camera view shows pose skeleton + hand mesh + face contours.
//
//   Backup of the previous worker-based version: useVisionWorker.worker.bak.ts

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
import { useCallback, useEffect, useRef, useState } from "react";

const LOCAL_WASM = "/mediapipe-wasm";
const CDN_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const POSE_MODEL = "/mediapipe-models/pose_landmarker_lite.task";
const HANDS_MODEL = "/mediapipe-models/hand_landmarker.task";
const FACE_MODEL = "/mediapipe-models/face_landmarker.task";

// ── Module-level FilesetResolver singleton ────────────────────────────────────
// Prevents double WASM initialization on React StrictMode double-mount.
// Tries local WASM first (fast, offline-capable), falls back to versioned CDN.
type Fileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
let _sharedFileset: Fileset | null = null;
let _sharedFilesetPromise: Promise<Fileset> | null = null;

async function getFileset(): Promise<Fileset> {
  if (_sharedFileset) return _sharedFileset;
  if (!_sharedFilesetPromise) {
    _sharedFilesetPromise = FilesetResolver.forVisionTasks(LOCAL_WASM)
      .catch(() => {
        console.warn("[Vision] Local WASM failed, falling back to CDN…");
        return FilesetResolver.forVisionTasks(CDN_WASM);
      })
      .then((fs) => {
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
  usingWorker: false;
}

// MediaPipeTask accepted for API compatibility but all landmarks always enabled
export function useVisionWorker(
  _discipline: string,
  _extraTasks?: MediaPipeTask[],
): VisionState & {
  sendFrame: (bitmap: ImageBitmap, timestamp: number) => void;
  latestResult: React.RefObject<VisionFrameResult>;
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

  const latestResult = useRef<VisionFrameResult>({ ...EMPTY_VISION_RESULT });
  const busyRef = useRef(false);
  const lastTsRef = useRef(-1);

  // ── Init all three landmarkers on main thread ─────────────────────────────
  useEffect(() => {
    setState({ poseReady: false, handsReady: false, faceReady: false, error: null, usingWorker: false });
    latestResult.current = { ...EMPTY_VISION_RESULT };
    busyRef.current = false;
    lastTsRef.current = -1;

    const cancelled = { value: false };

    (async () => {
      try {
        const vision = await getFileset();
        if (cancelled.value) return;

        // ── Pose (always) ──────────────────────────────────────────────────
        const pose = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        });
        if (cancelled.value) { pose.close(); return; }
        poseRef.current = pose;
        setState(s => ({ ...s, poseReady: true }));
        bus.emit("worker:ready", { worker: "pose" });

        // ── Hands (always) ─────────────────────────────────────────────────
        try {
          const hands = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HANDS_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (cancelled.value) { hands.close(); return; }
          handsRef.current = hands;
          setState(s => ({ ...s, handsReady: true }));
        } catch (err) {
          console.warn("[Vision] HandLandmarker failed to load, continuing without hands:", err);
          setState(s => ({ ...s, handsReady: true }));
        }

        // ── Face (always) ──────────────────────────────────────────────────
        try {
          const face = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
          });
          if (cancelled.value) { face.close(); return; }
          faceRef.current = face;
          setState(s => ({ ...s, faceReady: true }));
        } catch (err) {
          console.warn("[Vision] FaceLandmarker failed to load, continuing without face:", err);
          setState(s => ({ ...s, faceReady: true }));
        }
      } catch (err) {
        if (!cancelled.value) {
          const msg = String(err);
          console.error("[Vision] Failed to initialize MediaPipe:", msg);
          setState(s => ({ ...s, error: msg }));
          bus.emit("worker:error", { worker: "pose", message: msg });
        }
      }
    })();

    return () => {
      cancelled.value = true;
      poseRef.current?.close(); poseRef.current = null;
      handsRef.current?.close(); handsRef.current = null;
      faceRef.current?.close(); faceRef.current = null;
    };
  }, []);

  // ── Per-frame detection (main thread) ────────────────────────────────────
  const sendFrame = useCallback((bitmap: ImageBitmap, timestamp: number) => {
    if (timestamp <= lastTsRef.current) { bitmap.close(); return; }
    if (!poseRef.current) { bitmap.close(); return; }
    if (busyRef.current) { bitmap.close(); return; }

    busyRef.current = true;
    lastTsRef.current = timestamp;

    try {
      // ── Pose ─────────────────────────────────────────────────────────────
      const pr = poseRef.current.detectForVideo(bitmap, timestamp);
      const poseLandmarks = pr.landmarks ?? [];
      const poseWorldLandmarks = pr.worldLandmarks ?? [];

      // ── Hands ────────────────────────────────────────────────────────────
      let handLandmarks: VisionFrameResult["handLandmarks"] = [];
      let handedness: string[] = [];
      if (handsRef.current) {
        const hr = handsRef.current.detectForVideo(bitmap, timestamp);
        handLandmarks = hr.landmarks ?? [];
        handedness = (hr.handedness ?? []).map(
          (h: { categoryName?: string }[]) => h[0]?.categoryName ?? "",
        );
      }

      // ── Face ─────────────────────────────────────────────────────────────
      let faceLandmarks: VisionFrameResult["faceLandmarks"] = [];
      let faceBlendshapes: VisionFrameResult["faceBlendshapes"] = [];
      if (faceRef.current) {
        const fr = faceRef.current.detectForVideo(bitmap, timestamp);
        faceLandmarks = fr.faceLandmarks ?? [];
        faceBlendshapes = (fr.faceBlendshapes ?? []).map(
          (bs: { categories?: { categoryName: string; score: number }[] }) =>
            (bs.categories ?? []).slice(0, 20).map(c => ({ categoryName: c.categoryName, score: c.score })),
        );
      }

      latestResult.current = {
        ...latestResult.current,
        poseLandmarks,
        poseWorldLandmarks,
        handLandmarks,
        handedness,
        faceLandmarks,
        faceBlendshapes,
        timestamp,
      };

      bus.emit("pose:result", { poseLandmarks, poseWorldLandmarks, timestamp });
      if (handLandmarks.length > 0) {
        bus.emit("hands:result", { handLandmarks, handedness, timestamp });
      }
      if (faceLandmarks.length > 0) {
        bus.emit("face:result", { faceLandmarks, faceBlendshapes, timestamp });
      }
    } catch (err) {
      console.error("[Vision] detectForVideo error:", err);
    } finally {
      bitmap.close();
      busyRef.current = false;
    }
  }, []);

  return { ...state, sendFrame, latestResult };
}
