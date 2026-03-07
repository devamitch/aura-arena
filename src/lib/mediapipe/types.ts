import type { Landmark } from '@/types';

export interface VisionFrameResult {
  timestamp:          number;
  poseLandmarks:      Landmark[][];
  poseWorldLandmarks: Landmark[][];
  handLandmarks:      Landmark[][];
  handedness:         string[];
  faceLandmarks:      Landmark[][];
  faceBlendshapes:    { categoryName: string; score: number }[][];
  gestures:           { categoryName: string; score: number }[][];
  objectDetections:   { label: string; score: number; x: number; y: number; w: number; h: number }[];
}

export const EMPTY_VISION_RESULT: VisionFrameResult = {
  timestamp: 0, poseLandmarks: [], poseWorldLandmarks: [],
  handLandmarks: [], handedness: [], faceLandmarks: [],
  faceBlendshapes: [], gestures: [], objectDetections: [],
};

export interface FaceExpressions {
  happy: number; surprised: number; angry: number;
  concentrated: number; mouth_open: number; left_wink: number; right_wink: number;
}

export const parseFaceExpressions = (bs: { categoryName: string; score: number }[]): FaceExpressions => {
  const get = (n: string) => Math.round((bs.find(b => b.categoryName === n)?.score ?? 0) * 100);
  return {
    happy:        Math.max(get('mouthSmileLeft'), get('mouthSmileRight')),
    surprised:    get('browInnerUp'),
    angry:        Math.max(get('browDownLeft'), get('browDownRight')),
    concentrated: get('eyeSquintLeft'),
    mouth_open:   get('jawOpen'),
    left_wink:    get('eyeBlinkLeft'),
    right_wink:   get('eyeBlinkRight'),
  };
};
