// Aura Arena — Pose Worker (MediaPipe PoseLandmarker only, < 200 lines)
import type { Landmark } from "@/types";
import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";

const WASM = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/pose_landmarker_lite.task`;

let landmarker: PoseLandmarker | null = null;
let lastTimestamp = -1;
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

async function init() {
  const vision = await FilesetResolver.forVisionTasks(WASM);
  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
  post({ type: "READY" });
}

function detect(bitmap: ImageBitmap, timestamp: number) {
  if (!landmarker) {
    bitmap.close();
    return;
  }
  // MediaPipe requires strictly monotonically increasing timestamps
  if (timestamp <= lastTimestamp) {
    post({
      type: "POSE_RESULT",
      poseLandmarks: [],
      poseWorldLandmarks: [],
      timestamp,
    });
    bitmap.close();
    return;
  }
  lastTimestamp = timestamp;

  try {
    const r = landmarker.detectForVideo(bitmap, timestamp);
    const poseLandmarks = (r.landmarks ?? []) as Landmark[][];
    const poseWorldLandmarks = (r.worldLandmarks ?? []) as Landmark[][];
    post({ type: "POSE_RESULT", poseLandmarks, poseWorldLandmarks, timestamp });
  } catch (error) {
    console.error("MediaPipe Pose Error:", error);
    post({
      type: "POSE_RESULT",
      poseLandmarks: [],
      poseWorldLandmarks: [],
      timestamp,
    });
  } finally {
    bitmap.close();
  }
}

self.addEventListener("message", async (e: MessageEvent) => {
  const msg = e.data as {
    type: string;
    bitmap?: ImageBitmap;
    timestamp?: number;
  };
  if (msg.type === "INIT") {
    try {
      await init();
    } catch (err) {
      post({ type: "ERROR", message: String(err) });
    }
  } else if (msg.type === "DETECT" && msg.bitmap) {
    detect(msg.bitmap, msg.timestamp ?? 0);
  } else if (msg.type === "DESTROY") {
    landmarker?.close();
    landmarker = null;
  }
});
