// Aura Arena — Hands Worker (MediaPipe HandLandmarker only)
import type { Landmark } from "@/types";
import {
  FilesetResolver,
  HandLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";

const WASM = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/hand_landmarker.task`;

let landmarker: HandLandmarker | null = null;
let lastTimestamp = -1;
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

async function init() {
  const vision = await FilesetResolver.forVisionTasks(WASM);
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  post({ type: "READY" });
}

function detect(bitmap: ImageBitmap, timestamp: number) {
  if (!landmarker) {
    bitmap.close();
    return;
  }
  if (timestamp <= lastTimestamp) {
    post({
      type: "HANDS_RESULT",
      handLandmarks: [],
      handedness: [],
      timestamp,
    });
    bitmap.close();
    return;
  }
  lastTimestamp = timestamp;

  try {
    const r = landmarker.detectForVideo(bitmap, timestamp);
    const handLandmarks = (r.landmarks ?? []) as Landmark[][];
    const handedness = (r.handedness ?? []).map(
      (h: { categoryName?: string }[]) => h[0]?.categoryName ?? "Unknown",
    );
    post({ type: "HANDS_RESULT", handLandmarks, handedness, timestamp });
  } catch (err) {
    console.error("MediaPipe Hands Error:", err);
    post({
      type: "HANDS_RESULT",
      handLandmarks: [],
      handedness: [],
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
