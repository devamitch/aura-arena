import type { DisciplineId, MediaPipeTask } from '@/types';
import gestureJson from '@/data/gesture-events.json';

export const DISCIPLINE_TASKS: Record<DisciplineId, MediaPipeTask[]> = {
  boxing:       ['pose', 'hands', 'gesture'],
  dance:        ['pose', 'hands', 'holistic'],
  yoga:         ['pose', 'face'],
  martialarts:  ['pose', 'hands', 'gesture'],
  gymnastics:   ['pose', 'holistic'],
  fitness:      ['pose'],
  bodybuilding: ['pose', 'face'],
  parkour:      ['pose', 'object'],
  calisthenics: ['pose'],
  pilates:      ['pose', 'face'],
};

export type GestureEvent = { label: string; comboBonus: number; color: string; xp: number };
export const GESTURE_EVENTS = gestureJson as Record<string, GestureEvent>;
