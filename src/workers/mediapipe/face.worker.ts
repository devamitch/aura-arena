// Aura Arena — Face Worker (MediaPipe FaceLandmarker)
// @ts-expect-error: Polyfill self.import for MediaPipe's internal loader in module workers
if (typeof self.import === "undefined") {
  (self as any).import = (url: string) => import(url);
}
import type { Landmark } from "@/types";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/face_landmarker.task`;

let landmarker: FaceLandmarker | null = null;
let lastTimestamp = -1;
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

async function init() {
  const vision = await FilesetResolver.forVisionTasks(WASM);
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

function detect(bitmap: ImageBitmap, timestamp: number) {
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
    const faceLandmarks = (r.faceLandmarks ?? []).map(
      (lms: { x: number; y: number; z?: number }[]) =>
        lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
    ) as Landmark[][];
    const faceBlendshapes = (r.faceBlendshapes ?? []).map(
      (bs: { categories?: { categoryName: string; score: number }[] }) =>
        (bs.categories ?? [])
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
