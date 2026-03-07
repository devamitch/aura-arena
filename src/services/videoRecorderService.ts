// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Video Recorder Service
// Records training sessions with watermark, saves locally + uploads to Supabase.
// Uses MediaRecorder API for in-browser recording.
// ═══════════════════════════════════════════════════════════════════════════════

const WATERMARK_TEXT = "🔥 AURA ARENA";
const WATERMARK_FONT = "bold 18px Inter, system-ui";
const WATERMARK_COLOR = "rgba(255,255,255,0.6)";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RecordingOptions {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  watermark?: boolean;
  maxDuration?: number; // seconds
  mimeType?: string;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
  frames: number;
}

// ─── WATERMARK OVERLAY ────────────────────────────────────────────────────────

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.font = WATERMARK_FONT;
  ctx.fillStyle = WATERMARK_COLOR;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK_TEXT, w - 16, h - 16);

  // Timestamp
  const now = new Date();
  const ts = now.toLocaleTimeString("en-US", { hour12: false });
  ctx.font = "12px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText(ts, 16, h - 16);
  ctx.restore();
}

// ─── RECORDER ─────────────────────────────────────────────────────────────────

export function createRecorder(opts: RecordingOptions) {
  const {
    canvas,
    watermark = true,
    maxDuration = 120,
    mimeType = "video/webm;codecs=vp9",
  } = opts;

  const ctx = canvas.getContext("2d")!;
  const chunks: Blob[] = [];
  let frameCount = 0;
  let startTime = 0;
  let animFrame = 0;
  let stopped = false;

  // Capture canvas + watermark stream
  const canvasStream = canvas.captureStream(30);
  const recorder = new MediaRecorder(canvasStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
    videoBitsPerSecond: 2_500_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Draw loop: composite video + watermark
  function drawLoop() {
    if (stopped) return;
    if (watermark) {
      drawWatermark(ctx, canvas.width, canvas.height);
    }
    frameCount++;
    animFrame = requestAnimationFrame(drawLoop);
  }

  return {
    start() {
      startTime = performance.now();
      stopped = false;
      recorder.start(1000); // 1s chunks
      drawLoop();

      // Auto-stop after max duration
      setTimeout(() => {
        if (!stopped) this.stop();
      }, maxDuration * 1000);
    },

    stop(): Promise<RecordingResult> {
      return new Promise((resolve) => {
        stopped = true;
        cancelAnimationFrame(animFrame);

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const duration = (performance.now() - startTime) / 1000;
          resolve({ blob, url, duration, frames: frameCount });
        };

        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, duration: 0, frames: frameCount });
        }
      });
    },

    isRecording: () => recorder.state === "recording",
  };
}

// ─── DOWNLOAD LOCALLY ─────────────────────────────────────────────────────────

export function downloadRecording(blob: Blob, filename?: string) {
  const name = filename ?? `aura-arena-${Date.now()}.webm`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── UPLOAD TO SUPABASE STORAGE ───────────────────────────────────────────────

import { supabase } from "@lib/supabase/client";

export async function uploadRecording(
  blob: Blob,
  userId: string,
  sessionId: string,
): Promise<string> {
  const path = `recordings/${userId}/${sessionId}.webm`;

  const { error } = await supabase.storage
    .from("session-videos")
    .upload(path, blob, {
      contentType: "video/webm",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("session-videos")
    .getPublicUrl(path);

  return urlData.publicUrl;
}
