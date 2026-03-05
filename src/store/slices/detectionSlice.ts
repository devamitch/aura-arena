// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Detection Slice
// Camera permission, MediaPipe model state, on-device LLM, mirror/flip
// ═══════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import type { MediaPipeTask } from '@types';

export type CameraPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';
export type ModelLoadState   = 'idle' | 'loading' | 'ready' | 'error';

export interface DetectionSlice {
  // State
  cameraPermission:  CameraPermission;
  cameraError:       string | null;
  mirrorCamera:      boolean;
  loadedTasks:       Set<MediaPipeTask>;
  taskLoadErrors:    Partial<Record<MediaPipeTask, string>>;
  onDeviceLLMState:  ModelLoadState;
  onDeviceLLMProgress: number;
  lastGesture:       string | null;
  faceExpression:    string | null;
  audioLabel:        string | null;
  scanProgress:      number; // 0..1 scan line animation

  // UI states
  skeletonVisible:   boolean;
  handsVisible:      boolean;
  faceVisible:       boolean;
  objectsVisible:    boolean;

  // Actions
  setCameraPermission:(p: CameraPermission, error?: string) => void;
  toggleMirror:      () => void;
  setTaskLoaded:     (t: MediaPipeTask) => void;
  setTaskError:      (t: MediaPipeTask, msg: string) => void;
  setOnDeviceLLMState:(s: ModelLoadState, progress?: number) => void;
  setLastGesture:    (g: string | null) => void;
  setFaceExpression: (e: string | null) => void;
  setAudioLabel:     (l: string | null) => void;
  setScanProgress:   (p: number) => void;
  toggleSkeleton:    () => void;
  toggleHands:       () => void;
  toggleFace:        () => void;
  toggleObjects:     () => void;
  resetDetection:    () => void;
}

export const createDetectionSlice: StateCreator<
  DetectionSlice,
  [['zustand/immer', never]],
  [],
  DetectionSlice
> = (set) => ({
  cameraPermission:    'idle',
  cameraError:         null,
  mirrorCamera:        true,
  loadedTasks:         new Set(),
  taskLoadErrors:      {},
  onDeviceLLMState:    'idle',
  onDeviceLLMProgress: 0,
  lastGesture:         null,
  faceExpression:      null,
  audioLabel:          null,
  scanProgress:        0,
  skeletonVisible:     true,
  handsVisible:        true,
  faceVisible:         false,
  objectsVisible:      false,

  setCameraPermission: (p, err) => set((s) => {
    s.cameraPermission = p;
    s.cameraError = err ?? null;
  }),

  toggleMirror: () => set((s) => { s.mirrorCamera = !s.mirrorCamera; }),

  setTaskLoaded: (t) => set((s) => {
    s.loadedTasks.add(t);
    delete s.taskLoadErrors[t];
  }),

  setTaskError: (t, msg) => set((s) => {
    s.taskLoadErrors[t] = msg;
  }),

  setOnDeviceLLMState: (st, progress) => set((s) => {
    s.onDeviceLLMState   = st;
    if (progress !== undefined) s.onDeviceLLMProgress = progress;
  }),

  setLastGesture:    (g) => set((s) => { s.lastGesture = g; }),
  setFaceExpression: (e) => set((s) => { s.faceExpression = e; }),
  setAudioLabel:     (l) => set((s) => { s.audioLabel = l; }),
  setScanProgress:   (p) => set((s) => { s.scanProgress = p; }),

  toggleSkeleton: () => set((s) => { s.skeletonVisible = !s.skeletonVisible; }),
  toggleHands:    () => set((s) => { s.handsVisible    = !s.handsVisible; }),
  toggleFace:     () => set((s) => { s.faceVisible     = !s.faceVisible; }),
  toggleObjects:  () => set((s) => { s.objectsVisible  = !s.objectsVisible; }),

  resetDetection: () => set((s) => {
    s.cameraPermission  = 'idle';
    s.cameraError       = null;
    s.lastGesture       = null;
    s.faceExpression    = null;
    s.audioLabel        = null;
    s.scanProgress      = 0;
    s.loadedTasks       = new Set();
  }),
});
