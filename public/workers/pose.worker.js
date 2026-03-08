// Aura Arena — Static Pose Worker

const WASM_LOCAL = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/pose_landmarker_lite.task`;

let landmarker = null;
let lastTimestamp = -1;
const post = (data) => self.postMessage(data);

async function init() {
  let FilesetResolver, PoseLandmarker;

  try {
    const pkg = await import("../mediapipe-wasm/vision_bundle.mjs");
    FilesetResolver = pkg.FilesetResolver;
    PoseLandmarker = pkg.PoseLandmarker;
  } catch (e) {
    console.error("Failed to load local MediaPipe bundle for Pose", e);
    throw e;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);
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

function detect(bitmap, timestamp) {
  if (!landmarker) {
    bitmap.close();
    return;
  }
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
    const poseLandmarks = r.landmarks || [];
    const poseWorldLandmarks = r.worldLandmarks || [];
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
