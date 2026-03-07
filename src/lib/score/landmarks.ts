// ─── MediaPipe landmark indices ───────────────────────────────────────────────
export const LM = {
  NOSE: 0, LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8, MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20, LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24, LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28, LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
} as const;

export const JOINT_GROUPS = {
  upper_body: [11, 12, 13, 14, 15, 16],
  lower_body: [23, 24, 25, 26, 27, 28],
  torso:      [11, 12, 23, 24],
  arms:       [11, 13, 15, 12, 14, 16],
  legs:       [23, 25, 27, 24, 26, 28],
  face:       [0, 2, 5, 9, 10],
  hands:      [15, 16, 19, 20],
  feet:       [27, 28, 31, 32],
  spine:      [0, 11, 12, 23, 24],
} as const;
