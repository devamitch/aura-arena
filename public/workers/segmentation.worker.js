// Aura Arena — Static Segmentation Worker
// Type-safe via JSDoc.
// Uses MediaPipe ImageSegmenter to produce a person/background mask.

import {
  FilesetResolver,
  ImageSegmenter,
} from "/mediapipe-wasm/vision_bundle.mjs";

const WASM_LOCAL = `${self.location.origin}/mediapipe-wasm`;
const MODEL = `${self.location.origin}/mediapipe-models/selfie_segmenter.tflite`; // using local model

/** @type {import('@mediapipe/tasks-vision').ImageSegmenter | null} */
let segmenter = null;
let initialized = false;

const post = (
  /** @type {any} */ data,
  /** @type {Transferable[]} */ transfer = [],
) => self.postMessage(data, transfer);

async function init() {
  if (initialized) return;

  const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);

  segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "CPU" }, // CPU for broader compatibility on static workers
    runningMode: "VIDEO",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });

  initialized = true;
  post({ type: "READY" });
}

/**
 * @param {ImageBitmap} bitmap
 * @param {number} timestamp
 */
function processFrame(bitmap, timestamp) {
  if (!segmenter) {
    bitmap.close();
    return;
  }

  try {
    const result = segmenter.segmentForVideo(bitmap, timestamp);
    const mask = result.categoryMask;

    if (mask) {
      // Transfer the raw mask data (Uint8Array) to main thread
      const maskData = new Uint8Array(mask.getAsUint8Array());
      const width = mask.width;
      const height = mask.height;

      post(
        {
          type: "SEGMENTATION_RESULT",
          maskData,
          width,
          height,
          timestamp,
        },
        [maskData.buffer], // Transfer ownership for zero-copy
      );
      // mask.close() is not a function in the standard API for categoryMask, but the underlying C++ object is garbage collected.
    }
  } catch (error) {
    console.error("MediaPipe Segmentation Error:", error);
  } finally {
    bitmap.close(); // Important: must close the ImageBitmap to prevent memory leaks in the worker
  }
}

self.addEventListener("message", async (/** @type {MessageEvent} */ e) => {
  const msg = e.data;

  if (msg.type === "INIT") {
    try {
      await init();
    } catch (err) {
      post({
        type: "ERROR",
        message: String(err),
      });
    }
  } else if (msg.type === "SEGMENT_FRAME" && msg.bitmap) {
    processFrame(msg.bitmap, msg.timestamp || 0);
  } else if (msg.type === "DESTROY") {
    segmenter?.close();
    segmenter = null;
    initialized = false;
  }
});
