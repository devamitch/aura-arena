// Aura Arena — Typed Event Bus (pub/sub, no deps)
type Handler<T = unknown> = (data: T) => void;
const _map = new Map<string, Set<Handler>>();

export const on = <T = unknown>(event: string, handler: Handler<T>): (() => void) => {
  if (!_map.has(event)) _map.set(event, new Set());
  _map.get(event)!.add(handler as Handler);
  return () => off(event, handler);
};

export const off = <T = unknown>(event: string, handler: Handler<T>): void => {
  _map.get(event)?.delete(handler as Handler);
};

export const emit = <T = unknown>(event: string, data: T): void => {
  _map.get(event)?.forEach(h => h(data));
};

export const once = <T = unknown>(event: string, handler: Handler<T>): void => {
  const wrapped: Handler<T> = (data) => { handler(data); off(event, wrapped); };
  on(event, wrapped);
};

// Typed event definitions for Aura Arena
export type AuraEvents = {
  'pose:result':     { poseLandmarks: unknown[][]; poseWorldLandmarks: unknown[][]; timestamp: number };
  'hands:result':    { handLandmarks: unknown[][]; handedness: string[]; timestamp: number };
  'face:result':     { faceLandmarks: unknown[][]; faceBlendshapes: unknown[][]; timestamp: number };
  'frame:scored':    { frameScore: unknown; updatedRhythmState: unknown; newCombo: number; newLastComboTime: number };
  'form:result':     { poseCorrectness: unknown };
  'session:summary': { summary: unknown };
  'audio:beat':      { bpm: number; energy: number; timestamp: number };
  'audio:bpm':       { bpm: number; energy: number };
  'worker:error':    { worker: string; message: string };
  'worker:ready':    { worker: string };
};

export const bus = {
  on:   <K extends keyof AuraEvents>(event: K, handler: Handler<AuraEvents[K]>) => on(event, handler),
  off:  <K extends keyof AuraEvents>(event: K, handler: Handler<AuraEvents[K]>) => off(event, handler),
  emit: <K extends keyof AuraEvents>(event: K, data: AuraEvents[K]) => emit(event, data),
  once: <K extends keyof AuraEvents>(event: K, handler: Handler<AuraEvents[K]>) => once(event, handler),
};
