import {
  createRhythmState,
  scoreFrame,
  type RhythmState,
  type ScoreFrameInput,
} from "@/lib/score";
import type { DisciplineId, SubDisciplineId } from "@/types";

let rhythmState: RhythmState | null = null;
let initialized = false;

async function init(msg: any) {
  if (initialized) return;
  rhythmState = createRhythmState(msg.bpm || 80);
  initialized = true;
  (self as unknown as Worker).postMessage({ type: "READY" });
}

async function processScore(msg: any) {
  if (!msg.poseLandmarks || msg.poseLandmarks.length === 0) return;

  const input: ScoreFrameInput = {
    landmarks: msg.poseLandmarks[0] ?? [],
    previousLandmarks: msg.prevLandmarks ?? [],
    frameWindow: msg.frameWindow ?? [],
    discipline: msg.discipline as DisciplineId,
    subDiscipline: msg.subDiscipline as SubDisciplineId | undefined,
    elapsedMs: msg.elapsedMs,
    rhythmState: msg.rhythmState ?? rhythmState ?? createRhythmState(80),
    currentCombo: msg.combo ?? 0,
    lastComboTime: msg.lastComboTime ?? 0,
    gestures: msg.gestures ?? [],
  };

  const { frameScore, updatedRhythmState, newCombo, newLastComboTime } =
    scoreFrame(input);
  rhythmState = updatedRhythmState;

  // Send scored results back
  (self as unknown as Worker).postMessage({
    type: "SCORE_RESULT",
    frameScore,
    newCombo,
    updatedRhythmState,
    newLastComboTime,
    timestamp: msg.timestamp,
  });
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
  } else if (msg.type === "PROCESS_SCORE") {
    await processScore(msg);
  } else if (msg.type === "DESTROY") {
    initialized = false;
  }
});
