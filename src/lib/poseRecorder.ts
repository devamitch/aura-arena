// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Pose Sequence Recorder
// Accumulates keypoint arrays per frame during a session.
// Output: a PoseSequence that TF.js and poseAnalyzer can consume.
// ═══════════════════════════════════════════════════════════════════════════════

export interface PoseFrame {
  /** Milliseconds from session start */
  timestamp: number;
  /** 33 keypoints from MediaPipe (or 17 from MoveNet): [x, y, z, visibility] */
  keypoints: number[][];
  /** Raw score from the scoring engine at this frame */
  frameScore: number;
}

export interface PoseSequence {
  discipline: string;
  subDiscipline?: string;
  durationMs: number;
  fps: number;
  frames: PoseFrame[];
}

class PoseRecorder {
  private frames: PoseFrame[] = [];
  private startTime = 0;
  private recording = false;
  private discipline = "";
  private subDiscipline?: string;

  start(discipline: string, subDiscipline?: string) {
    this.frames = [];
    this.startTime = performance.now();
    this.recording = true;
    this.discipline = discipline;
    this.subDiscipline = subDiscipline;
  }

  addFrame(keypoints: number[][], frameScore: number) {
    if (!this.recording) return;
    this.frames.push({
      timestamp: performance.now() - this.startTime,
      keypoints,
      frameScore,
    });
  }

  stop(): PoseSequence {
    this.recording = false;
    const durationMs =
      this.frames.length > 0
        ? this.frames[this.frames.length - 1].timestamp
        : 0;
    const fps =
      durationMs > 0 ? Math.round((this.frames.length / durationMs) * 1000) : 0;

    return {
      discipline: this.discipline,
      subDiscipline: this.subDiscipline,
      durationMs,
      fps,
      frames: [...this.frames],
    };
  }

  isRecording(): boolean {
    return this.recording;
  }

  /** Get the last N frames (for sliding-window TF.js inference) */
  getWindow(windowSize: number): PoseFrame[] {
    if (this.frames.length <= windowSize) return [...this.frames];
    return this.frames.slice(-windowSize);
  }

  /** Get frame count */
  get frameCount(): number {
    return this.frames.length;
  }
}

export const poseRecorder = new PoseRecorder();
