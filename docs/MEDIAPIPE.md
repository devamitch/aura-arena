# AURA ARENA — MediaPipe Integration

## Overview

AURA ARENA uses MediaPipe Tasks APIs for all on-device computer vision. The tasks run in the browser via WebAssembly + WebGL, enabling real-time inference without any server round-trips.

---

## Task Categories

### Vision Tasks (11 tasks via `@mediapipe/tasks-vision`)

| Task | Model | Use in AURA ARENA |
|---|---|---|
| Pose Landmarker | `pose_landmarker_full` | Primary: 33-point body skeleton for scoring |
| Hand Landmarker | `hand_landmarker` | Wrist/finger precision for boxing, dance |
| Face Landmarker | `face_landmarker` | 468-point mesh for expression analysis |
| Gesture Recognizer | `gesture_recognizer` | Gesture classification (fist, open palm, etc.) |
| Object Detector | `efficientdet_lite0` | Equipment detection (gloves, mat) |
| Image Classifier | `efficientnet_lite0` | Scene classification |
| Image Segmenter | `deeplab_v3` | Background removal for clean overlay |
| Face Detector | `blaze_face_short_range` | Fast face presence detection |
| Image Embedder | `mobilenet_v3_small` | Visual similarity for form comparison |
| Interactive Segmenter | `magic_eraser` | Body isolation |
| Holistic Landmarker | Combined pose+hands+face | Full-body analysis in Detection Lab |

### Text Tasks (via `@mediapipe/tasks-text`)

| Task | Use |
|---|---|
| Text Classifier | Coaching text sentiment |
| Text Embedder | Similar coaching lookup |
| Language Detector | Multi-language coaching support |

### Audio Tasks (via `@mediapipe/tasks-audio`)

| Task | Use |
|---|---|
| Audio Classifier | Ambient sound classification, music BPM detection for dance timing |

### GenAI Tasks (via `@mediapipe/tasks-genai`)

| Model | Use |
|---|---|
| Gemma 2B (on-device) | Offline coaching when no network, real-time expression → feedback |

---

## Detection Loop Architecture

The detection loop runs exclusively inside `requestAnimationFrame` — never `setInterval`:

```ts
const detectFrame = () => {
  if (!poseLandmarker || !videoRef.current) return;

  const result = poseLandmarker.detectForVideo(
    videoRef.current,
    performance.now()
  );

  if (result.landmarks[0]) {
    const landmarks = result.landmarks[0];
    const frameScore = calcFrameScore(landmarks, discipline, prevLandmarks);
    store.updateMetrics({ ...frameScore });
    prevLandmarks = landmarks;
  }

  rafId = requestAnimationFrame(detectFrame);
};

rafId = requestAnimationFrame(detectFrame);

// Cleanup
return () => cancelAnimationFrame(rafId);
```

**Target performance**: < 16ms per frame (60 fps). MediaPipe Lite models typically achieve 10-12ms on modern mobile hardware.

---

## Model Loading Strategy

Models are loaded lazily — only when first needed:

```ts
// allTasks.ts
let poseLandmarker: PoseLandmarker | null = null;

export const getPoseLandmarker = async (): Promise<PoseLandmarker> => {
  if (poseLandmarker) return poseLandmarker;

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/...',
      delegate: 'GPU', // Falls back to CPU if WebGL unavailable
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return poseLandmarker;
};
```

**Loading states** tracked in `detectionSlice`:
```ts
loadedTasks: Set<string>  // 'pose', 'hands', 'face', 'gesture', etc.
taskLoadError: string | null
```

---

## On-Device LLM (Gemma)

For premium users or offline scenarios:

```ts
// onDeviceLLM.ts
export const detectDeviceCapabilities = async () => {
  const gpu = await navigator.gpu?.requestAdapter();
  return {
    webgpuSupported: !!gpu,
    gpuVendor: (await gpu?.requestAdapterInfo())?.vendor ?? 'unknown',
  };
};

export const onDeviceLLM = {
  async generate(prompt: string): Promise<string> {
    // Uses MediaPipe LlmInference with Gemma 2B
    // Falls back to cloud Gemini if WebGPU unavailable
  }
};
```

**Device requirements for on-device Gemma**:
- WebGPU support (Chrome 113+, Edge 113+)
- 4GB+ GPU memory recommended
- ~3 second first-load time (model download ~1.3GB — cached after first use)

---

## Canvas Overlay Rendering

The skeleton overlay renders on a `<canvas>` element positioned absolutely over the `<video>`:

```tsx
<div className="relative">
  <video ref={videoRef} className="opacity-0" />  {/* Hidden source */}
  <canvas ref={canvasRef} className="absolute inset-0" />  {/* Visible overlay */}
</div>
```

Drawing order:
1. Draw video frame to canvas (`ctx.drawImage(videoRef.current, ...)`)
2. Apply mirror transform if enabled
3. Draw body connections (lines between landmark pairs)
4. Draw landmark circles at each joint
5. Draw HUD overlay (score, FPS, corner brackets)
6. Apply discipline color filter (glow on matched joints)

**Mirror handling**:
```ts
if (mirrorCamera) {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}
```

---

## Discipline-Specific Detection Focus

Different disciplines emphasize different body regions:

```ts
const DISCIPLINE_FOCUS: Record<DisciplineId, {
  primaryLandmarks: number[];
  drawConnections: [number, number][];
  color: string;
}> = {
  boxing: {
    primaryLandmarks: [15, 16, 11, 12, 13, 14], // Wrists, shoulders, elbows
    drawConnections: [[11,13],[13,15],[12,14],[14,16],[11,12]],
    color: '#ff5722',
  },
  dance: {
    primaryLandmarks: [11,12,23,24,25,26,27,28,15,16], // Full body
    drawConnections: [[11,23],[12,24],[11,12],[23,24],[23,25],[25,27],[24,26],[26,28]],
    color: '#d946ef',
  },
  yoga: {
    primaryLandmarks: [11,12,23,24,25,26,27,28,29,30,31,32], // Full body + feet
    drawConnections: [[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[28,30]],
    color: '#10b981',
  },
  // ... etc
};
```

---

## Performance Optimization

### GPU Delegate
Always use `delegate: 'GPU'` — this runs inference on the device's GPU via WebGL/WebGPU, typically 3-5× faster than CPU.

### Model Selection
- For detection (not needed every frame): `SHORT_RANGE` models are 2× faster
- For scoring (every frame): `FULL` models for better accuracy

### Frame Skip Strategy
For low-end devices (< 30fps), skip every other frame for inference while still rendering:
```ts
let frameCount = 0;
const detectFrame = () => {
  frameCount++;
  if (frameCount % 2 === 0) { // Skip inference every other frame
    return requestAnimationFrame(detectFrame);
  }
  // Run inference...
};
```
