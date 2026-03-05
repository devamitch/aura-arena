// ═══════════════════════════════════════════════════════════════════════════════
// DEPRECATED: engine.ts — all logic now lives in allTasks.ts (functional)
// This file re-exports for backward compat with any lingering imports.
// ═══════════════════════════════════════════════════════════════════════════════
export {
  initVisionTask, initVisionTasks, processVideoFrame, renderFrameToCanvas,
  isTaskReady, anyTaskReady, destroyAllTasks,
  DISCIPLINE_TASKS, GESTURE_EVENTS,
  parseFaceExpressions, expressionCoachFeedback,
  type VisionFrameResult,
} from './allTasks';

export type { MediaPipeTask as VisionTask } from '@types';
