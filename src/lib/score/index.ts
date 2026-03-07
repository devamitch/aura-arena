// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Score Module (barrel re-export)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  scoreBoxingFrame,
  scoreCoreEngagement,
  scoreExtension,
  scoreKataFrame,
  scoreMudraFrame,
  scorePose,
  scoreStaticHold,
  scoreWrestlingStance,
  scoreYogaBalance,
} from "./disciplines";
export {
  scoreFrame,
  type ScoreFrameInput,
  type ScoreFrameOutput,
} from "./frame";
export {
  bilateralSymmetry,
  computeJitter,
  jitterToStability,
  jointAngleDeg,
  lmDist2D,
  lmVisible,
  midpoint,
  poseCosineSimilarity,
  vec3,
  wristGuardScore,
} from "./geometry";
export { JOINT_GROUPS, LM } from "./landmarks";
export { createRhythmState, scoreRhythm, type RhythmState } from "./rhythm";
export { computeSessionSummary, zeroScore } from "./session";
export {
  analyseScoreTrend,
  calcMissionXP,
  calcPvEPoints,
  calcPvEXP,
  calcSessionPoints,
  calcSessionXP,
  calcStreakBonus,
  computeVelocityScore,
  generateIdealPose,
  type ScoreTrend,
} from "./xp";
