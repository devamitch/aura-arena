// Aura Arena — Static Face Worker

const WASM_LOCAL = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/face_landmarker.task`;

let landmarker = null;
let lastTimestamp = -1;
const post = (data) => self.postMessage(data);

async function init() {
  let FilesetResolver, FaceLandmarker;

  try {
    const pkg = await import("../mediapipe-wasm/vision_bundle.mjs");
    FilesetResolver = pkg.FilesetResolver;
    FaceLandmarker = pkg.FaceLandmarker;
  } catch (e) {
    console.error("Failed to load local MediaPipe bundle for Face", e);
    throw e;
  }

  const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
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
      type: "FACE_RESULT",
      faceLandmarks: [],
      faceBlendshapes: [],
      timestamp,
    });
    bitmap.close();
    return;
  }
  lastTimestamp = timestamp;

  try {
    const r = landmarker.detectForVideo(bitmap, timestamp);
    const faceLandmarks = (r.faceLandmarks || []).map((lms) =>
      lms.map((l) => ({ x: l.x, y: l.y, z: l.z || 0 })),
    );
    const faceBlendshapes = (r.faceBlendshapes || []).map((bs) =>
      (bs.categories || [])
        .slice(0, 20)
        .map((c) => ({ categoryName: c.categoryName, score: c.score })),
    );
    post({ type: "FACE_RESULT", faceLandmarks, faceBlendshapes, timestamp });
  } catch (err) {
    console.error("MediaPipe Face Error:", err);
    post({
      type: "FACE_RESULT",
      faceLandmarks: [],
      faceBlendshapes: [],
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
