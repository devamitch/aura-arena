// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Pose Web Worker
// Runs MediaPipe PoseLandmarker + HandLandmarker entirely off the main thread.
// Also scores each frame (scoreEngine) and checks exercise form (poseCorrectness
// via TF.js CPU backend) so React rendering stays smooth.
//
// Message protocol (JSON-serialisable throughout):
//   main → worker  { type:'INIT',  discipline, subDiscipline, bpm }
//   main → worker  { type:'PROCESS_FRAME', bitmap, timestamp, elapsedMs,
//                    discipline, subDiscipline, prevLandmarks, frameWindow,
//                    rhythmState, combo, lastComboTime }
//   main → worker  { type:'DESTROY' }
//   worker → main  { type:'READY' }
//   worker → main  { type:'FRAME_RESULT', poseLandmarks, handLandmarks,
//                    gestures, frameScore, poseCorrectness, newCombo,
//                    updatedRhythmState, newLastComboTime }
//   worker → main  { type:'ERROR', message }
// ═══════════════════════════════════════════════════════════════════════════════

import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';
import {
  checkExerciseForm,
  ensureTF,
  type PoseCorrectness,
} from '@lib/poseCorrectness';
import {
  createRhythmState,
  scoreFrame,
  type RhythmState,
  type ScoreFrameInput,
} from '@lib/scoreEngine';
import type { FrameScore, Landmark } from '@types';

// ─── CDN URLs ─────────────────────────────────────────────────────────────────

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// ─── Worker-local state ───────────────────────────────────────────────────────

let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let initialized = false;
let rhythmState: RhythmState | null = null;

// ─── Message types ────────────────────────────────────────────────────────────

type InitMsg = {
  type: 'INIT';
  discipline: string;
  subDiscipline?: string;
  bpm: number;
};

type FrameMsg = {
  type: 'PROCESS_FRAME';
  bitmap: ImageBitmap;
  timestamp: number;
  elapsedMs: number;
  discipline: string;
  subDiscipline?: string;
  prevLandmarks: Landmark[];
  frameWindow: Landmark[][];
  rhythmState: RhythmState;
  combo: number;
  lastComboTime: number;
};

type InMsg = InitMsg | FrameMsg | { type: 'DESTROY' };

export type WorkerFrameResult = {
  type: 'FRAME_RESULT';
  poseLandmarks: Landmark[][];
  handLandmarks: Landmark[][];
  gestures: unknown[][];
  frameScore: FrameScore;
  poseCorrectness: PoseCorrectness;
  newCombo: number;
  updatedRhythmState: RhythmState;
  newLastComboTime: number;
};

// ─── Initialise ───────────────────────────────────────────────────────────────

const HAND_DISCIPLINES = new Set([
  'boxing', 'martialarts', 'dance', 'gymnastics',
]);

async function init(msg: InitMsg): Promise<void> {
  if (initialized) return;

  // TF.js CPU backend (for poseCorrectness angle tensors)
  await ensureTF();

  // MediaPipe vision WASM
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'CPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });

  if (HAND_DISCIPLINES.has(msg.discipline)) {
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'CPU' },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  rhythmState = createRhythmState(msg.bpm);
  initialized = true;

  (self as unknown as Worker).postMessage({ type: 'READY' });
}

// ─── Process one frame ────────────────────────────────────────────────────────

async function processFrame(msg: FrameMsg): Promise<void> {
  if (!poseLandmarker) return;

  // ── 1. MediaPipe inference ────────────────────────────────────────────────
  let rawPose: ReturnType<PoseLandmarker['detectForVideo']>;
  try {
    rawPose = poseLandmarker.detectForVideo(msg.bitmap, msg.timestamp);
  } catch {
    msg.bitmap.close();
    return;
  }

  const poseLandmarks = (rawPose.landmarks ?? []) as Landmark[][];
  let handLandmarks: Landmark[][] = [];
  let gestures: unknown[][] = [];

  if (handLandmarker) {
    try {
      const rawHand = handLandmarker.detectForVideo(msg.bitmap, msg.timestamp);
      handLandmarks = (rawHand.landmarks ?? []) as Landmark[][];
      // HandLandmarker doesn't expose gestures — use GestureRecognizer for that
      gestures = [];
    } catch {
      // Hand detection is optional — ignore failures
    }
  }

  // Release the transferred bitmap (zero-copy → must close manually)
  msg.bitmap.close();

  // ── 2. Score the frame (pure CPU, no DOM) ────────────────────────────────
  const landmarks = poseLandmarks[0] ?? [];

  const input: ScoreFrameInput = {
    landmarks,
    previousLandmarks: msg.prevLandmarks,
    frameWindow:       msg.frameWindow,
    discipline:        msg.discipline as import('@types').DisciplineId,
    subDiscipline:     msg.subDiscipline as import('@types').SubDisciplineId | undefined,
    elapsedMs:         msg.elapsedMs,
    rhythmState:       msg.rhythmState ?? rhythmState ?? createRhythmState(80),
    currentCombo:      msg.combo,
    lastComboTime:     msg.lastComboTime,
    gestures:          gestures as any,
    drill:             undefined,
  };

  const {
    frameScore,
    updatedRhythmState,
    newCombo,
    newLastComboTime,
  } = scoreFrame(input);

  // Update local rhythm state for next frame
  rhythmState = updatedRhythmState;

  // ── 3. TF.js pose correctness ────────────────────────────────────────────
  const poseCorrectness = checkExerciseForm(
    landmarks,
    msg.discipline,
    msg.subDiscipline,
  );

  // ── 4. Send results to main thread (plain JSON — no transferables) ────────
  const result: WorkerFrameResult = {
    type: 'FRAME_RESULT',
    poseLandmarks,
    handLandmarks,
    gestures,
    frameScore,
    poseCorrectness,
    newCombo,
    updatedRhythmState,
    newLastComboTime,
  };

  (self as unknown as Worker).postMessage(result);
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<InMsg>) => {
  const msg = e.data;

  if (msg.type === 'INIT') {
    try {
      await init(msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      (self as unknown as Worker).postMessage({ type: 'ERROR', message });
    }
    return;
  }

  if (msg.type === 'PROCESS_FRAME') {
    await processFrame(msg);
    return;
  }

  if (msg.type === 'DESTROY') {
    poseLandmarker?.close();
    handLandmarker?.close();
    poseLandmarker = null;
    handLandmarker = null;
    initialized    = false;
  }
});
