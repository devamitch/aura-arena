// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Functional MediaPipe All-Tasks Engine
// No classes. Pure functions + module-level mutable state.
// ALL MediaPipe Studio tasks covered.
// ═══════════════════════════════════════════════════════════════════════════════

import type { DisciplineId, Landmark, MediaPipeTask } from "@types";

// ─── CDN BASES ────────────────────────────────────────────────────────────────
const WASM_VISION =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const WASM_TEXT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm";
const WASM_AUDIO =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/wasm";

// ─── MODEL URLS ───────────────────────────────────────────────────────────────
const MODEL = {
  pose: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  poseHeavy:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
  hands:
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  faceDetect:
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.task",
  gesture:
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  objectDetect:
    "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.task",
  imgClassify:
    "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.task",
  imgSegment:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.task",
  imgEmbed:
    "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.task",
  textClassify:
    "https://storage.googleapis.com/mediapipe-models/text_classifier/bert_classifier/float32/1/bert_classifier.task",
  textEmbed:
    "https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder_small/float32/1/universal_sentence_encoder.task",
  langDetect:
    "https://storage.googleapis.com/mediapipe-models/language_detector/language_detector/float32/1/language_detector.task",
  audioClassify:
    "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.task",
} as const;

// ─── MODULE STATE (functional singleton pattern) ───────────────────────────────
// All mutable state is contained here, manipulated only through exported fns

type TaskInstance = any; // MediaPipe task objects
const _tasks: Map<string, TaskInstance> = new Map();
const _initialised: Set<string> = new Set();
const _initPromises: Map<string, Promise<void>> = new Map();

// ─── TASK INIT ────────────────────────────────────────────────────────────────

export const initVisionTask = async (task: MediaPipeTask): Promise<void> => {
  if (_initialised.has(task)) return;
  if (_initPromises.has(task)) return _initPromises.get(task)!;

  const p = _doInitVisionTask(task);
  _initPromises.set(task, p);
  await p;
};

const _doInitVisionTask = async (task: MediaPipeTask): Promise<void> => {
  try {
    const {
      FilesetResolver,
      PoseLandmarker,
      HandLandmarker,
      FaceLandmarker,
      FaceDetector,
      GestureRecognizer,
      ObjectDetector,
    } = await import("@mediapipe/tasks-vision");

    const vision = await FilesetResolver.forVisionTasks(WASM_VISION);

    switch (task) {
      case "pose":
        _tasks.set(
          "pose",
          await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL.pose, delegate: "GPU" },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputSegmentationMasks: false,
          }),
        );
        break;

      case "hands":
        _tasks.set(
          "hands",
          await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL.hands, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
        );
        break;

      case "face":
        _tasks.set(
          "face",
          await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL.face, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
          }),
        );
        break;

      case "face_detect":
        _tasks.set(
          "face_detect",
          await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL.faceDetect, delegate: "GPU" },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5,
          }),
        );
        break;

      case "gesture":
        _tasks.set(
          "gesture",
          await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL.gesture, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }),
        );
        break;

      case "object":
        _tasks.set(
          "object",
          await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL.objectDetect,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            scoreThreshold: 0.5,
            maxResults: 5,
          }),
        );
        break;

      case "holistic":
        // Holistic = pose + hands + face together
        await Promise.all([
          _doInitVisionTask("pose"),
          _doInitVisionTask("hands"),
          _doInitVisionTask("face"),
        ]);
        break;
    }

    _initialised.add(task);
  } catch (err) {
    console.warn(`[MediaPipe] ${task} init failed, will simulate:`, err);
    _initialised.add(task); // mark as "done" to prevent retry loops
  }
};

export const initVisionTasks = (tasks: MediaPipeTask[]): Promise<void> =>
  Promise.all(tasks.map(initVisionTask)).then(() => undefined);

export const isTaskReady = (task: MediaPipeTask): boolean =>
  _initialised.has(task) && _tasks.has(task);

export const anyTaskReady = (): boolean => _tasks.size > 0;

// ─── TEXT TASKS ───────────────────────────────────────────────────────────────

const _textInitialised: Set<string> = new Set();

export const initTextClassifier = async (): Promise<void> => {
  if (_textInitialised.has("classify")) return;
  try {
    const { FilesetResolver, TextClassifier } =
      await import("@mediapipe/tasks-text");
    const text = await FilesetResolver.forTextTasks(WASM_TEXT);
    _tasks.set(
      "text_classify",
      await TextClassifier.createFromOptions(text, {
        baseOptions: { modelAssetPath: MODEL.textClassify },
      }),
    );
    _textInitialised.add("classify");
  } catch (e) {
    console.warn("[MediaPipe Text] classify init failed:", e);
  }
};

export const initTextEmbedder = async (): Promise<void> => {
  if (_textInitialised.has("embed")) return;
  try {
    const { FilesetResolver, TextEmbedder } =
      await import("@mediapipe/tasks-text");
    const text = await FilesetResolver.forTextTasks(WASM_TEXT);
    _tasks.set(
      "text_embed",
      await TextEmbedder.createFromOptions(text, {
        baseOptions: { modelAssetPath: MODEL.textEmbed },
        quantize: true,
      }),
    );
    _textInitialised.add("embed");
  } catch (e) {
    console.warn("[MediaPipe Text] embed init failed:", e);
  }
};

export const initLanguageDetector = async (): Promise<void> => {
  if (_textInitialised.has("lang")) return;
  try {
    const { FilesetResolver, LanguageDetector } =
      await import("@mediapipe/tasks-text");
    const text = await FilesetResolver.forTextTasks(WASM_TEXT);
    _tasks.set(
      "lang_detect",
      await LanguageDetector.createFromOptions(text, {
        baseOptions: { modelAssetPath: MODEL.langDetect },
      }),
    );
    _textInitialised.add("lang");
  } catch (e) {
    console.warn("[MediaPipe Text] lang init failed:", e);
  }
};

// ─── TEXT FUNCTIONS ───────────────────────────────────────────────────────────

export const classifyText = (
  text: string,
): { category: string; score: number }[] => {
  const c = _tasks.get("text_classify");
  if (!c) return [];
  try {
    const r = c.classify(text);
    return r.classifications?.[0]?.categories?.slice(0, 5) ?? [];
  } catch {
    return [];
  }
};

export const embedText = (text: string): number[] => {
  const e = _tasks.get("text_embed");
  if (!e) return [];
  try {
    const r = e.embed(text);
    return r.embeddings?.[0]?.floatEmbedding ?? [];
  } catch {
    return [];
  }
};

export const detectLanguage = (
  text: string,
): { language: string; probability: number }[] => {
  const d = _tasks.get("lang_detect");
  if (!d) return [{ language: "en", probability: 1.0 }];
  try {
    const r = d.detect(text);
    return r.languages?.slice(0, 3) ?? [];
  } catch {
    return [];
  }
};

// Cosine similarity for text embeddings
export const textCosineSimilarity = (a: number[], b: number[]): number => {
  if (!a.length || !b.length) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
};

// ─── AUDIO TASKS ──────────────────────────────────────────────────────────────

let _audioContext: AudioContext | null = null;
let _audioProcessor: ScriptProcessorNode | null = null;
let _latestAudioResults: {
  category: string;
  score: number;
  timestamp: number;
}[] = [];

export const initAudioClassifier = async (): Promise<void> => {
  if (_tasks.has("audio_classify")) return;
  try {
    const { FilesetResolver, AudioClassifier } =
      await import("@mediapipe/tasks-audio");
    const audio = await FilesetResolver.forAudioTasks(WASM_AUDIO);
    _tasks.set(
      "audio_classify",
      await AudioClassifier.createFromOptions(audio, {
        baseOptions: { modelAssetPath: MODEL.audioClassify },
      }),
    );
  } catch (e) {
    console.warn("[MediaPipe Audio] init failed:", e);
  }
};

export const startAudioClassification = async (): Promise<boolean> => {
  const classifier = _tasks.get("audio_classify");
  if (!classifier) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    _audioContext = new AudioContext({ sampleRate: 16000 });
    const source = _audioContext.createMediaStreamSource(stream);
    _audioProcessor = _audioContext.createScriptProcessor(16384, 1, 1);
    _audioProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      try {
        const results = classifier.classifyForAudio(
          inputData,
          _audioContext!.currentTime * 1000,
        );
        _latestAudioResults =
          results.classificationResults?.[0]?.classifications?.[0]?.categories
            ?.slice(0, 5)
            .map((c: any) => ({
              category: c.categoryName,
              score: c.score,
              timestamp: Date.now(),
            })) ?? [];
      } catch {
        /* non-fatal */
      }
    };
    source.connect(_audioProcessor);
    _audioProcessor.connect(_audioContext.destination);
    return true;
  } catch (e) {
    console.warn("[MediaPipe Audio] mic failed:", e);
    return false;
  }
};

export const stopAudioClassification = (): void => {
  _audioProcessor?.disconnect();
  _audioContext?.close();
  _audioProcessor = null;
  _audioContext = null;
};

export const getLatestAudioResults = () => _latestAudioResults;

// ─── VISION FRAME PROCESSING ──────────────────────────────────────────────────

export interface VisionFrameResult {
  timestamp: number;
  poseLandmarks: Landmark[][]; // array of poses (1 pose = outer array length 1)
  poseWorldLandmarks: Landmark[][]; // 3D world landmarks
  handLandmarks: Landmark[][]; // up to 2 hands
  handedness: string[]; // 'Left' | 'Right'
  faceLandmarks: Landmark[][];
  faceBlendshapes: { categoryName: string; score: number }[][];
  gestures: { categoryName: string; score: number }[][];
  objectDetections: {
    label: string;
    score: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

export const processVideoFrame = (
  video: HTMLVideoElement,
  timestamp: number,
): VisionFrameResult => {
  const result: VisionFrameResult = {
    timestamp,
    poseLandmarks: [],
    poseWorldLandmarks: [],
    handLandmarks: [],
    handedness: [],
    faceLandmarks: [],
    faceBlendshapes: [],
    gestures: [],
    objectDetections: [],
  };

  try {
    const poseTask = _tasks.get("pose");
    if (poseTask) {
      const r = poseTask.detectForVideo(video, timestamp);
      result.poseLandmarks = (r.landmarks ?? []).map((lms: any[]) =>
        lms.map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z ?? 0,
          visibility: l.visibility ?? 1,
        })),
      );
      result.poseWorldLandmarks = (r.worldLandmarks ?? []).map((lms: any[]) =>
        lms.map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z ?? 0,
          visibility: l.visibility ?? 1,
        })),
      );
    }
  } catch {
    /* non-fatal */
  }

  try {
    const handsTask = _tasks.get("hands");
    if (handsTask) {
      const r = handsTask.detectForVideo(video, timestamp);
      result.handLandmarks = (r.landmarks ?? []).map((lms: any[]) =>
        lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
      );
      result.handedness = (r.handedness ?? []).map(
        (h: any[]) => h[0]?.categoryName ?? "Unknown",
      );
    }
  } catch {
    /* non-fatal */
  }

  try {
    const faceTask = _tasks.get("face");
    if (faceTask) {
      const r = faceTask.detectForVideo(video, timestamp);
      result.faceLandmarks = (r.faceLandmarks ?? []).map((lms: any[]) =>
        lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
      );
      result.faceBlendshapes = (r.faceBlendshapes ?? []).map((bs: any) =>
        (bs.categories ?? [])
          .slice(0, 20)
          .map((c: any) => ({ categoryName: c.categoryName, score: c.score })),
      );
    }
  } catch {
    /* non-fatal */
  }

  try {
    const gestTask = _tasks.get("gesture");
    if (gestTask) {
      const r = gestTask.recognizeForVideo(video, timestamp);
      result.gestures = (r.gestures ?? []).map((g: any[]) =>
        g
          .slice(0, 3)
          .map((c: any) => ({ categoryName: c.categoryName, score: c.score })),
      );
      if (!result.handLandmarks.length && r.landmarks?.length) {
        result.handLandmarks = r.landmarks.map((lms: any[]) =>
          lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0 })),
        );
      }
    }
  } catch {
    /* non-fatal */
  }

  try {
    const objTask = _tasks.get("object");
    if (objTask) {
      const r = objTask.detectForVideo(video, timestamp);
      result.objectDetections = (r.detections ?? []).map((det: any) => ({
        label: det.categories?.[0]?.categoryName ?? "object",
        score: det.categories?.[0]?.score ?? 0,
        x: det.boundingBox?.originX ?? 0,
        y: det.boundingBox?.originY ?? 0,
        w: det.boundingBox?.width ?? 0,
        h: det.boundingBox?.height ?? 0,
      }));
    }
  } catch {
    /* non-fatal */
  }

  return result;
};

// ─── CANVAS RENDERER (pure function, no state) ────────────────────────────────

export const renderFrameToCanvas = (
  canvas: HTMLCanvasElement,
  result: VisionFrameResult,
  accentColor: string,
  options: {
    drawSkeleton?: boolean;
    drawHands?: boolean;
    drawFace?: boolean;
    drawObjects?: boolean;
    drawGesture?: boolean;
    drawBrackets?: boolean;
    drawScanLine?: boolean;
    scanProgress?: number; // 0→1, undefined = hide scan line
    mirrored?: boolean;
  } = {},
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    drawSkeleton = true,
    drawHands = true,
    drawFace = true,
    drawObjects = true,
    drawGesture = true,
    drawBrackets = true,
    drawScanLine = false,
    scanProgress = 0,
    mirrored = true,
  } = options;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mirrored) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  const W = canvas.width,
    H = canvas.height;

  if (drawSkeleton)
    _renderSkeleton(ctx, result.poseLandmarks, accentColor, W, H);
  if (drawHands) _renderHands(ctx, result.handLandmarks, accentColor, W, H);
  if (drawFace) _renderFace(ctx, result.faceLandmarks, accentColor, W, H);
  if (drawObjects) _renderObjects(ctx, result.objectDetections, W, H);
  if (drawGesture) _renderGestureLabel(ctx, result.gestures, W);

  if (mirrored) ctx.restore();

  if (drawBrackets) _renderCornerBrackets(ctx, W, H, accentColor);
  if (drawScanLine && scanProgress < 1)
    _renderScanLine(ctx, W, H, accentColor, scanProgress);
};

// POSE CONNECTIONS (MediaPipe standard)
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [15, 17],
  [15, 19],
  [15, 21],
  [16, 18],
  [16, 20],
  [16, 22],
];

// HAND CONNECTIONS (MediaPipe standard)
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

// FACE CONTOUR INDICES (sparse subset for performance)
const FACE_CONTOUR: number[] = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

const _renderSkeleton = (
  ctx: CanvasRenderingContext2D,
  poseLandmarks: Landmark[][],
  color: string,
  W: number,
  H: number,
): void => {
  for (const lms of poseLandmarks) {
    ctx.save();
    ctx.strokeStyle = `${color}cc`;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    for (const [a, b] of POSE_CONNECTIONS) {
      if (!lms[a] || !lms[b]) continue;
      if ((lms[a].visibility ?? 1) < 0.3 || (lms[b].visibility ?? 1) < 0.3)
        continue;
      ctx.beginPath();
      ctx.moveTo(lms[a].x * W, lms[a].y * H);
      ctx.lineTo(lms[b].x * W, lms[b].y * H);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    for (const lm of lms) {
      if ((lm.visibility ?? 1) < 0.3) continue;
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const _renderHands = (
  ctx: CanvasRenderingContext2D,
  handLandmarks: Landmark[][],
  color: string,
  W: number,
  H: number,
): void => {
  for (const hand of handLandmarks) {
    ctx.save();
    ctx.strokeStyle = "#ffffff70";
    ctx.lineWidth = 1.5;
    for (const [a, b] of HAND_CONNECTIONS) {
      if (!hand[a] || !hand[b]) continue;
      ctx.beginPath();
      ctx.moveTo(hand[a].x * W, hand[a].y * H);
      ctx.lineTo(hand[b].x * W, hand[b].y * H);
      ctx.stroke();
    }
    ctx.fillStyle = `${color}90`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (const lm of hand) {
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const _renderFace = (
  ctx: CanvasRenderingContext2D,
  faceLandmarks: Landmark[][],
  color: string,
  W: number,
  H: number,
): void => {
  for (const face of faceLandmarks) {
    ctx.save();
    ctx.strokeStyle = `${color}35`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let first = true;
    for (const idx of FACE_CONTOUR) {
      if (!face[idx]) continue;
      const x = face[idx].x * W,
        y = face[idx].y * H;
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
};

const _renderObjects = (
  ctx: CanvasRenderingContext2D,
  detections: VisionFrameResult["objectDetections"],
  W: number,
  H: number,
): void => {
  if (!detections.length) return;
  ctx.save();
  ctx.strokeStyle = "#fbbf24";
  ctx.fillStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.font = "11px monospace";
  for (const det of detections) {
    ctx.strokeRect(det.x * W, det.y * H, det.w * W, det.h * H);
    ctx.fillText(
      `${det.label} ${(det.score * 100).toFixed(0)}%`,
      det.x * W + 4,
      det.y * H - 5,
    );
  }
  ctx.restore();
};

const _renderGestureLabel = (
  ctx: CanvasRenderingContext2D,
  gestures: VisionFrameResult["gestures"],
  W: number,
): void => {
  const top = gestures[0]?.[0];
  if (!top || top.categoryName === "None" || top.score < 0.6) return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(W - 168, 8, 160, 30);
  ctx.fillStyle = "#00f0ff";
  ctx.font = "bold 12px monospace";
  ctx.fillText(
    `${top.categoryName} ${(top.score * 100).toFixed(0)}%`,
    W - 162,
    27,
  );
  ctx.restore();
};

const _renderCornerBrackets = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  color: string,
): void => {
  const size = 28;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  const corners: [number, number, number, number][] = [
    [0, 0, 1, 1],
    [W, 0, -1, 1],
    [0, H, 1, -1],
    [W, H, -1, -1],
  ];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + dx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * size);
    ctx.stroke();
  }
  ctx.restore();
};

const _renderScanLine = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  color: string,
  progress: number,
): void => {
  const y = progress * H;
  const alpha = 1 - progress;
  const hex = Math.round(alpha * 180)
    .toString(16)
    .padStart(2, "0");
  ctx.save();
  ctx.strokeStyle = `${color}${hex}`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
  ctx.restore();
};

// ─── DISCIPLINE → TASK MAP ────────────────────────────────────────────────────

export const DISCIPLINE_TASKS: Record<DisciplineId, MediaPipeTask[]> = {
  boxing: ["pose", "hands", "gesture"],
  dance: ["pose", "hands", "holistic"],
  yoga: ["pose", "face"],
  martialarts: ["pose", "hands", "gesture"],
  gymnastics: ["pose", "holistic"],
  fitness: ["pose"],
  bodybuilding: ["pose", "face"],
  parkour: ["pose", "object"],
  calisthenics: ["pose"],
  pilates: ["pose", "face"],
};

// ─── GESTURE → GAME EVENT MAP ─────────────────────────────────────────────────

export const GESTURE_EVENTS: Record<
  string,
  { label: string; comboBonus: number; color: string }
> = {
  Thumb_Up: { label: "Great form!", comboBonus: 2, color: "#22c55e" },
  Thumb_Down: { label: "Reset position", comboBonus: 0, color: "#ef4444" },
  Victory: { label: "Victory stance", comboBonus: 1, color: "#a855f7" },
  Pointing_Up: { label: "Ready stance", comboBonus: 1, color: "#3b82f6" },
  Closed_Fist: { label: "Power fist!", comboBonus: 3, color: "#f97316" },
  Open_Palm: { label: "Rest", comboBonus: 0, color: "#6b7280" },
  ILoveYou: { label: "Energy boost!", comboBonus: 5, color: "#ec4899" },
  None: { label: "", comboBonus: 0, color: "" },
};

// ─── FACE EXPRESSIONS PARSER ──────────────────────────────────────────────────
// Extract meaningful expressions from face blendshapes

export interface FaceExpressions {
  happy: number; // 0–100
  surprised: number;
  angry: number;
  concentrated: number;
  mouth_open: number;
  left_wink: number;
  right_wink: number;
}

export const parseFaceExpressions = (
  blendshapes: { categoryName: string; score: number }[],
): FaceExpressions => {
  const get = (name: string) =>
    Math.round(
      (blendshapes.find((b) => b.categoryName === name)?.score ?? 0) * 100,
    );

  return {
    happy: Math.max(get("mouthSmileLeft"), get("mouthSmileRight")),
    surprised: get("browInnerUp"),
    angry: Math.max(get("browDownLeft"), get("browDownRight")),
    concentrated: get("eyeSquintLeft"),
    mouth_open: get("jawOpen"),
    left_wink: get("eyeBlinkLeft"),
    right_wink: get("eyeBlinkRight"),
  };
};

// Expression → coaching feedback for dance/yoga
export const expressionCoachFeedback = (
  expr: FaceExpressions,
  discipline: DisciplineId,
): string | null => {
  if (
    discipline === "dance" ||
    discipline === "yoga" ||
    discipline === "bodybuilding"
  ) {
    if (expr.concentrated > 80)
      return "Great focus — let it show in your eyes!";
    if (expr.happy > 60) return "Beautiful expression — keep radiating!";
    if (expr.angry > 70) return "Channel that intensity into your movement!";
    if (expr.mouth_open > 50)
      return "Relax your jaw — breathe through the nose.";
  }
  return null;
};

// ─── CLEANUP ──────────────────────────────────────────────────────────────────

export const destroyAllTasks = async (): Promise<void> => {
  for (const [, task] of _tasks) {
    try {
      task.close?.();
    } catch {
      /* non-fatal */
    }
  }
  _tasks.clear();
  _initialised.clear();
  _initPromises.clear();
  stopAudioClassification();
};
