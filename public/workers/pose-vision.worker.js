// Aura Arena — Static Pose-Vision Worker for Video Analysis

const WASM_LOCAL = `${self.location.origin}/mediapipe-wasm`;
const POSE_MODEL = `${self.location.origin}/mediapipe-models/pose_landmarker_lite.task`;
const HAND_MODEL = `${self.location.origin}/mediapipe-models/hand_landmarker.task`;

let poseLandmarker = null;
let handLandmarker = null;
let initialized = false;

const HAND_DISCIPLINES = new Set([
  "boxing",
  "martialarts",
  "dance",
  "gymnastics",
]);

async function init(msg) {
  if (initialized) return;

  let FilesetResolver, PoseLandmarker, HandLandmarker;

  try {
    const pkg = await import("../mediapipe-wasm/vision_bundle.mjs");
    FilesetResolver = pkg.FilesetResolver;
    PoseLandmarker = pkg.PoseLandmarker;
    HandLandmarker = pkg.HandLandmarker;
  } catch (e) {
    console.error(
      "Failed to load local MediaPipe bundle for Video Analysis",
      e,
    );
    throw e;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);

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
  self.postMessage({ type: "READY" });
}

async function processFrame(msg) {
  if (!poseLandmarker || !msg.bitmap) return;

  try {
    const rawPose = poseLandmarker.detectForVideo(msg.bitmap, msg.timestamp);
    const poseLandmarks = rawPose.landmarks || [];

    let handLandmarks = [];
    if (handLandmarker) {
      try {
        const rawHand = handLandmarker.detectForVideo(
          msg.bitmap,
          msg.timestamp,
        );
        handLandmarks = rawHand.landmarks || [];
      } catch (e) {
        // Hand optional
      }
    }

    msg.bitmap.close();

    self.postMessage({
      type: "VISION_RESULT",
      poseLandmarks,
      handLandmarks,
      timestamp: msg.timestamp,
    });
  } catch (err) {
    if (msg.bitmap) msg.bitmap.close();
  }
}

self.addEventListener("message", async (e) => {
  const msg = e.data;
  if (msg.type === "INIT") {
    try {
      await init(msg);
    } catch (err) {
      self.postMessage({
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
