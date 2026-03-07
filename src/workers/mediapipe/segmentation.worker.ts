// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Segmentation Worker
// Uses MediaPipe ImageSegmenter to produce a person/background mask.
// The main thread composites: blurred BG + sharp person.
// ═══════════════════════════════════════════════════════════════════════════════

import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

let segmenter: ImageSegmenter | null = null;
let initialized = false;

async function init() {
  if (initialized) return;

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });

  initialized = true;
  (self as unknown as Worker).postMessage({ type: "READY" });
}

function processFrame(bitmap: ImageBitmap, timestamp: number) {
  if (!segmenter) return;

  try {
    const result = segmenter.segmentForVideo(bitmap, timestamp);
    const mask = result.categoryMask;

    if (mask) {
      // Transfer the raw mask data (Uint8Array) to main thread
      const maskData = new Uint8Array(mask.getAsUint8Array());
      const width = mask.width;
      const height = mask.height;

      (self as unknown as Worker).postMessage(
        {
          type: "SEGMENTATION_RESULT",
          maskData,
          width,
          height,
          timestamp,
        },
        [maskData.buffer], // Transfer ownership for zero-copy
      );
      mask.close();
    }

    result.close();
  } catch {
    // Non-fatal: skip frame
  } finally {
    bitmap.close();
  }
}

self.addEventListener("message", async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "INIT") {
    try {
      await init();
    } catch (err) {
      (self as unknown as Worker).postMessage({
        type: "ERROR",
        message: String(err),
      });
    }
  } else if (msg.type === "SEGMENT_FRAME") {
    processFrame(msg.bitmap, msg.timestamp);
  } else if (msg.type === "DESTROY") {
    segmenter?.close();
    segmenter = null;
    initialized = false;
  }
});
