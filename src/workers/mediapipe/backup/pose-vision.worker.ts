import type { Landmark } from "@/types";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let initialized = false;

const HAND_DISCIPLINES = new Set([
  "boxing",
  "martialarts",
  "dance",
  "gymnastics",
]);

async function init(msg: any) {
  if (initialized) return;

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  if (HAND_DISCIPLINES.has(msg.discipline)) {
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate: "CPU" },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  initialized = true;
  (self as unknown as Worker).postMessage({ type: "READY" });
}

async function processFrame(msg: any) {
  if (!poseLandmarker || !msg.bitmap) return;

  try {
    const rawPose = poseLandmarker.detectForVideo(msg.bitmap, msg.timestamp);
    const poseLandmarks = (rawPose.landmarks ?? []) as Landmark[][];

    let handLandmarks: Landmark[][] = [];
    if (handLandmarker) {
      try {
        const rawHand = handLandmarker.detectForVideo(
          msg.bitmap,
          msg.timestamp,
        );
        handLandmarks = (rawHand.landmarks ?? []) as Landmark[][];
      } catch (e) {
        // Hand optional
      }
    }

    msg.bitmap.close();

    (self as unknown as Worker).postMessage({
      type: "VISION_RESULT",
      poseLandmarks,
      handLandmarks,
      timestamp: msg.timestamp,
    });
  } catch (err) {
    msg.bitmap?.close();
  }
}

self.addEventListener("message", async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "INIT") {
    try {
      await init(msg);
    } catch (err) {
      (self as unknown as Worker).postMessage({
        type: "ERROR",
        message: String(err),
      });
    }
  } else if (msg.type === "PROCESS_FRAME") {
    await processFrame(msg);
  } else if (msg.type === "DESTROY") {
    poseLandmarker?.close();
    handLandmarker?.close();
    initialized = false;
  }
});
