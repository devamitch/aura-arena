// Aura Arena — Combined Vision Worker (Pose + Hands + Face in one thread)
// KEY FIX: Uses /* @vite-ignore */ dynamic import from /mediapipe-wasm/vision_bundle.mjs
// This bypasses Vite's module bundling which breaks the WASM factory registration
// when @mediapipe/tasks-vision is statically imported in a Vite module worker.
export {}; // ES module — prevents TS variable collision with other worker files
//
// Why static imports fail in Vite workers:
// Vite tree-shakes and re-bundles @mediapipe/tasks-vision, breaking the singleton
// WASM factory that MediaPipe uses internally. By loading from the raw public asset
// with @vite-ignore, the browser loads the file as-is with no Vite transformation.

const ORIGIN = self.location.origin;
const WASM_BASE = `${ORIGIN}/mediapipe-wasm`;
const POSE_MODEL = `${ORIGIN}/mediapipe-models/pose_landmarker_lite.task`;
const HANDS_MODEL = `${ORIGIN}/mediapipe-models/hand_landmarker.task`;
const FACE_MODEL = `${ORIGIN}/mediapipe-models/face_landmarker.task`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poseLandmarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let handLandmarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceLandmarker: any = null;
let lastTimestamp = -1;

const post = (msg: unknown) => (self as unknown as Worker).postMessage(msg);

async function init(enableHands: boolean, enableFace: boolean) {
  try {
    // @vite-ignore: Load vision bundle directly from public assets.
    // This is the SAME file as @mediapipe/tasks-vision but loaded as a raw
    // static asset, bypassing Vite's bundling that breaks WASM factory init.
    const { FilesetResolver, PoseLandmarker, HandLandmarker, FaceLandmarker } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import(/* @vite-ignore */ `${WASM_BASE}/vision_bundle.mjs`)) as any;

    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);

    // Pose — always enabled
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false,
    });

    // Hands — if requested
    if (enableHands) {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HANDS_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    // Face — if requested
    if (enableFace) {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });
    }

    post({ type: "READY" });
  } catch (err) {
    post({ type: "ERROR", message: String(err) });
  }
}

function detect(bitmap: ImageBitmap, timestamp: number) {
  if (!poseLandmarker) {
    bitmap.close();
    return;
  }

  // MediaPipe requires strictly monotonically increasing timestamps
  if (timestamp <= lastTimestamp) {
    post({
      type: "VISION_RESULT",
      poseLandmarks: [],
      poseWorldLandmarks: [],
      handLandmarks: [],
      handedness: [],
      faceLandmarks: [],
      faceBlendshapes: [],
      timestamp,
    });
    bitmap.close();
    return;
  }
  lastTimestamp = timestamp;

  try {
    // ── Pose ──────────────────────────────────────────────────────────────
    const pr = poseLandmarker.detectForVideo(bitmap, timestamp);
    const poseLandmarks = pr.landmarks ?? [];
    const poseWorldLandmarks = pr.worldLandmarks ?? [];

    // ── Hands ─────────────────────────────────────────────────────────────
    let handLandmarks: unknown[] = [];
    let handedness: string[] = [];
    if (handLandmarker) {
      const hr = handLandmarker.detectForVideo(bitmap, timestamp);
      handLandmarks = hr.landmarks ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handedness = (hr.handedness ?? []).map((h: any) => h[0]?.categoryName ?? "");
    }

    // ── Face ───────────────────────────────────────────────────────────────
    let faceLandmarks: unknown[] = [];
    let faceBlendshapes: unknown[] = [];
    if (faceLandmarker) {
      const fr = faceLandmarker.detectForVideo(bitmap, timestamp);
      faceLandmarks = (fr.faceLandmarks ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lms: any) => lms.map((l: any) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
      );
      faceBlendshapes = (fr.faceBlendshapes ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (bs: any) =>
          (bs.categories ?? [])
            .slice(0, 20)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any) => ({ categoryName: c.categoryName, score: c.score })),
      );
    }

    post({
      type: "VISION_RESULT",
      poseLandmarks,
      poseWorldLandmarks,
      handLandmarks,
      handedness,
      faceLandmarks,
      faceBlendshapes,
      timestamp,
    });
  } catch (err) {
    console.error("[Vision Worker] detection error:", err);
    post({
      type: "VISION_RESULT",
      poseLandmarks: [],
      poseWorldLandmarks: [],
      handLandmarks: [],
      handedness: [],
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
    enableHands?: boolean;
    enableFace?: boolean;
    bitmap?: ImageBitmap;
    timestamp?: number;
  };

  switch (msg.type) {
    case "INIT":
      await init(msg.enableHands ?? false, msg.enableFace ?? false);
      break;
    case "DETECT":
      if (msg.bitmap) detect(msg.bitmap, msg.timestamp ?? 0);
      break;
    case "DESTROY":
      poseLandmarker?.close();
      poseLandmarker = null;
      handLandmarker?.close();
      handLandmarker = null;
      faceLandmarker?.close();
      faceLandmarker = null;
      break;
  }
});
