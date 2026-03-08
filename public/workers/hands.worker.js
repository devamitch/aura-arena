// Aura Arena — Static Hands Worker

const WASM_LOCAL = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/hand_landmarker.task`;

let landmarker = null;
let lastTimestamp = -1;
const post = (data) => self.postMessage(data);

async function init() {
  let FilesetResolver, HandLandmarker;

  try {
    const pkg = await import("../mediapipe-wasm/vision_bundle.mjs");
    FilesetResolver = pkg.FilesetResolver;
    HandLandmarker = pkg.HandLandmarker;
  } catch (e) {
    console.error("Failed to load local MediaPipe bundle for Hands", e);
    throw e;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);
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

function detect(bitmap, timestamp) {
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
    const handLandmarks = r.landmarks || [];
    const handedness = (r.handedness || []).map(
      (h) => h[0]?.categoryName || "Unknown",
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

self.addEventListener("message", async (e) => {
  const msg = e.data;
  if (msg.type === "INIT") {
    try {
      await init();
    } catch (err) {
      post({ type: "ERROR", message: String(err) });
    }
  } else if (msg.type === "DETECT" && msg.bitmap) {
    detect(msg.bitmap, msg.timestamp || 0);
  } else if (msg.type === "DESTROY") {
    landmarker?.close();
    landmarker = null;
  }
});
