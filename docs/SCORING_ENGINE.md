# AURA ARENA — Scoring Engine

## Overview

The scoring engine converts raw MediaPipe pose landmarks into a multi-dimensional performance score. It runs inside a `requestAnimationFrame` loop, processes one frame at a time, and accumulates frame-level scores into a final session score.

---

## Architecture

```
Camera frame
  ↓
MediaPipe PoseLandmarker
  ↓
PoseLandmark[] (33 points, x/y/z/visibility)
  ↓
calcFrameScore(landmarks, disciplineId, prevLandmarks)
  ↓
FrameScore { accuracy, stability, timing, expressiveness, power, balance }
  ↓
[frame buffer → 60 frames rolling window]
  ↓
calcSessionScore(frameBuffer, disciplineId)
  ↓
SessionScore { score, accuracy, stability, timing, expressiveness, power, balance, combo }
```

---

## Frame-Level Scoring

### Key Landmarks Used

```ts
// Body pose
const LEFT_SHOULDER  = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP       = 23;
const RIGHT_HIP      = 24;
const LEFT_KNEE      = 25;
const RIGHT_KNEE     = 26;
const LEFT_ANKLE     = 27;
const RIGHT_ANKLE    = 28;
const LEFT_WRIST     = 15;
const RIGHT_WRIST    = 16;
const NOSE           = 0;
```

### Accuracy
Measures how precisely joint angles match reference form.

```ts
const accuracy = calcJointAngleSimilarity(currentPose, referencePose, discipline);
```

Uses **cosine similarity** between joint angle vectors:
- Extract angles at key joints (shoulder-elbow-wrist, hip-knee-ankle, etc.)
- Compare against a reference pose vector for the current drill
- Score: 0–100

### Stability
Measures tremor and core stability.

```ts
const stability = calcStability(landmarks, prevLandmarks);
```

- Computes frame-to-frame displacement for stable joints (torso center, hip midpoint)
- Low displacement = high stability
- Normalized to 0–100 with discipline-specific tolerance thresholds

### Timing
Measures rhythm and cadence against the expected drill tempo.

```ts
const timing = calcTiming(movementVelocity, drillTempo, frameTimestamp);
```

- Calculates peak velocity moments
- Compares against expected BPM/tempo for the drill
- Boxing: sharp velocity spikes on beat = high timing
- Dance: sustained movement arcs matching music = high timing

### Expressiveness
Measures range of motion and movement quality.

```ts
const expressiveness = calcExpressiveness(landmarks, discipline);
```

- Computes total body path traveled per frame
- Large, sweeping movements score high
- Discipline-aware: yoga rewards slow controlled extension; dance rewards full range

### Power
Measures velocity magnitude for high-force movements.

```ts
const power = calcPower(wristVelocity, footVelocity, discipline);
```

- Relevant for boxing (punch velocity), martial arts (kick velocity)
- Uses Euclidean distance of wrist/ankle between frames
- Normalized to expected maximum velocity for the discipline

### Balance
Measures center-of-mass stability.

```ts
const balance = calcBalance(landmarks, discipline);
```

- Computes estimated center of mass from hip/shoulder/knee positions
- Distance from ideal CoM position = balance score
- Yoga and gymnastics weight this heavily

---

## Discipline Score Weights

```ts
const DISCIPLINE_WEIGHTS: Record<DisciplineId, ScoringWeights> = {
  boxing:       { accuracy: 0.25, stability: 0.20, timing: 0.25, expressiveness: 0.05, power: 0.30, balance: 0.00 },
  dance:        { accuracy: 0.20, stability: 0.10, timing: 0.25, expressiveness: 0.30, power: 0.05, balance: 0.10 },
  martialarts:  { accuracy: 0.30, stability: 0.15, timing: 0.25, expressiveness: 0.05, power: 0.25, balance: 0.00 },
  yoga:         { accuracy: 0.25, stability: 0.20, timing: 0.05, expressiveness: 0.10, power: 0.00, balance: 0.40 },
  gymnastics:   { accuracy: 0.30, stability: 0.15, timing: 0.15, expressiveness: 0.15, power: 0.10, balance: 0.15 },
  fitness:      { accuracy: 0.20, stability: 0.20, timing: 0.25, expressiveness: 0.05, power: 0.25, balance: 0.05 },
  bodybuilding: { accuracy: 0.25, stability: 0.25, timing: 0.10, expressiveness: 0.20, power: 0.15, balance: 0.05 },
  calisthenics: { accuracy: 0.25, stability: 0.20, timing: 0.20, expressiveness: 0.05, power: 0.20, balance: 0.10 },
  parkour:      { accuracy: 0.20, stability: 0.15, timing: 0.25, expressiveness: 0.10, power: 0.20, balance: 0.10 },
  pilates:      { accuracy: 0.25, stability: 0.30, timing: 0.10, expressiveness: 0.10, power: 0.00, balance: 0.25 },
};
```

**Final frame score**:
```ts
const frameScore =
  w.accuracy       * accuracy +
  w.stability      * stability +
  w.timing         * timing +
  w.expressiveness * expressiveness +
  w.power          * power +
  w.balance        * balance;
```

---

## Session Score Aggregation

Frames are accumulated in a rolling 60-frame (1 second) buffer. The session score is computed as:

```ts
// Weighted average: recent frames matter more
const sessionScore = frameBuffer.reduce((acc, frame, i) => {
  const weight = 0.7 + (i / frameBuffer.length) * 0.3; // recent = 1.0, oldest = 0.7
  return acc + frame.score * weight;
}, 0) / totalWeight;
```

---

## Combo System

A "combo" is defined as consecutive frames scoring above the **combo threshold** (configurable per discipline, default 82).

```ts
if (frameScore >= COMBO_THRESHOLD) {
  comboCount++;
} else {
  comboCount = 0;
}
```

**Combo multipliers**:
| Combo | Multiplier | Audio | Visual |
|---|---|---|---|
| 3× | 1.05× | `combo-3x` sound | "Combo 🔥" flash |
| 7× | 1.15× | `combo-7x` sound | "On Fire 🔥🔥" flash |
| 15× | 1.30× | `combo-15x` sound | "UNSTOPPABLE" full-screen |

The multiplier applies to XP and points earned, not to the score itself.

---

## XP & Points Calculation

```ts
export const calcXPEarned = (score: number, difficulty: 1|2|3|4|5) => {
  const base = 50;
  const scoreMultiplier = score / 100;
  const difficultyMultiplier = [1, 1.2, 1.5, 1.8, 2.2][difficulty - 1];
  return Math.round(base * scoreMultiplier * difficultyMultiplier);
};

export const calcPointsEarned = (score: number, difficulty: 1|2|3|4|5) => {
  const base = 100;
  const scoreMultiplier = score / 100;
  const difficultyMultiplier = [1, 1.25, 1.6, 2.0, 2.5][difficulty - 1];
  return Math.round(base * scoreMultiplier * difficultyMultiplier);
};
```

**Example**: Score 87, Difficulty 3
- XP: `50 × 0.87 × 1.5 = 65 XP`
- Points: `100 × 0.87 × 1.6 = 139 points`

---

## Personal Best Detection

```ts
export const isPersonalBest = (
  newScore: number,
  sessionHistory: SessionData[],
  discipline: DisciplineId,
  drillId: string
): boolean => {
  const previous = sessionHistory
    .filter(s => s.discipline === discipline && s.drillId === drillId)
    .map(s => s.score);
  return previous.length === 0 || newScore > Math.max(...previous);
};
```

---

## Offline Operation

When the device is offline, the scoring engine operates identically. Scores are:
1. Computed in-browser — no network required
2. Saved to IndexedDB via `offlineQueue.saveOfflineSession()`
3. Synced to Supabase when connection is restored

The offline flow uses exactly the same `calcSessionScore` function — no degraded accuracy when offline.

---

## Future: Real MediaPipe Integration

Current state: The scoring engine uses simulated landmark data for development. To connect real MediaPipe:

```ts
// In PoseEngine.tsx, replace simulated landmarks with:
const result = poseLandmarker.detectForVideo(videoElement, timestamp);
const landmarks = result.landmarks[0]; // First person detected

// Feed real landmarks to score engine
const frameScore = calcFrameScore(landmarks, disciplineId, prevLandmarks);
```

The `FrameScore` interface is already type-compatible with MediaPipe's `NormalizedLandmark[]`. No other changes needed.
