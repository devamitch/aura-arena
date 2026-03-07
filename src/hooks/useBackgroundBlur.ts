// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useBackgroundBlur Hook
// Manages the segmentation worker and composites blurred BG + sharp person.
// Also draws a full-body guide frame on the output canvas.
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBackgroundBlurOptions {
  /** Source video element */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Output canvas for composited frame */
  outputCanvasRef: React.RefObject<HTMLCanvasElement>;
  /** Blur intensity in pixels */
  blurRadius?: number;
  /** Whether blur is enabled */
  enabled?: boolean;
  /** Accent color for the body frame guide */
  accentColor?: string;
}

export interface UseBackgroundBlurReturn {
  isReady: boolean;
  isProcessing: boolean;
  fullBodyDetected: boolean;
}

export function useBackgroundBlur({
  videoRef,
  outputCanvasRef,
  blurRadius = 15,
  enabled = true,
  accentColor = "#00f0ff",
}: UseBackgroundBlurOptions): UseBackgroundBlurReturn {
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number>(0);
  const maskRef = useRef<{ data: Uint8Array; w: number; h: number } | null>(
    null,
  );

  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullBodyDetected, setFullBodyDetected] = useState(false);

  // ── Spawn segmentation worker ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL("../workers/mediapipe/segmentation.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "READY") {
        setIsReady(true);
      } else if (msg.type === "SEGMENTATION_RESULT") {
        maskRef.current = {
          data: new Uint8Array(msg.maskData),
          w: msg.width,
          h: msg.height,
        };
        setIsProcessing(false);
      }
    };

    worker.postMessage({ type: "INIT" });
    workerRef.current = worker;

    return () => {
      worker.postMessage({ type: "DESTROY" });
      setTimeout(() => worker.terminate(), 200);
      workerRef.current = null;
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // ── Composite loop ─────────────────────────────────────────────────────────
  const compositeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = outputCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(compositeFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(compositeFrame);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0, w, h);

    // Apply mask-based blur if available
    const mask = maskRef.current;
    if (mask && mask.w > 0 && mask.h > 0) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      // Create blurred version
      ctx.save();
      ctx.filter = `blur(${blurRadius}px)`;
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
      const blurredData = ctx.getImageData(0, 0, w, h);
      const blurPixels = blurredData.data;

      // Composite: for each pixel, if mask says "person" → use original, else → use blurred
      const scaleX = mask.w / w;
      const scaleY = mask.h / h;
      let personPixelCount = 0;
      const totalPixels = w * h;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const maskX = Math.floor(x * scaleX);
          const maskY = Math.floor(y * scaleY);
          const maskIdx = maskY * mask.w + maskX;
          const isPerson = mask.data[maskIdx] > 0;

          if (isPerson) {
            personPixelCount++;
          }

          const pixelIdx = (y * w + x) * 4;
          if (isPerson) {
            // Keep original pixels (person)
            blurPixels[pixelIdx] = pixels[pixelIdx];
            blurPixels[pixelIdx + 1] = pixels[pixelIdx + 1];
            blurPixels[pixelIdx + 2] = pixels[pixelIdx + 2];
            blurPixels[pixelIdx + 3] = pixels[pixelIdx + 3];
          }
          // else: keep blurred pixels (background)
        }
      }

      ctx.putImageData(blurredData, 0, 0);

      // Full body detection: person should occupy 15-85% of frame
      const personRatio = personPixelCount / totalPixels;
      setFullBodyDetected(personRatio > 0.15 && personRatio < 0.85);
    }

    // Draw body frame guide
    drawBodyFrameGuide(ctx, w, h, accentColor, fullBodyDetected);

    // Send next frame to segmentation worker (throttled)
    if (workerRef.current && !isProcessing && isReady) {
      createImageBitmap(video)
        .then((bitmap) => {
          setIsProcessing(true);
          workerRef.current?.postMessage(
            { type: "SEGMENT_FRAME", bitmap, timestamp: performance.now() },
            [bitmap],
          );
        })
        .catch(() => {});
    }

    rafRef.current = requestAnimationFrame(compositeFrame);
  }, [
    videoRef,
    outputCanvasRef,
    blurRadius,
    accentColor,
    isReady,
    isProcessing,
    fullBodyDetected,
  ]);

  // Start composite loop when ready
  useEffect(() => {
    if (!enabled) return;
    rafRef.current = requestAnimationFrame(compositeFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, compositeFrame]);

  return { isReady, isProcessing, fullBodyDetected };
}

// ── Body Frame Guide ─────────────────────────────────────────────────────────
// Draws a semi-transparent silhouette outline showing where to stand

function drawBodyFrameGuide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  detected: boolean,
) {
  const frameColor = detected ? color : "#ff4444";
  const alpha = detected ? 0.3 : 0.5;

  ctx.save();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = alpha;
  ctx.setLineDash([8, 6]);

  // Draw human silhouette guide (centered, 60% of frame)
  const cx = w / 2;
  const margin = w * 0.2;
  const top = h * 0.05;
  const bottom = h * 0.95;

  // Head circle
  const headR = w * 0.06;
  ctx.beginPath();
  ctx.arc(cx, top + headR + 10, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Body outline (trapezoid)
  const shoulderW = w * 0.18;
  const hipW = w * 0.12;
  const shoulderY = top + headR * 2 + 20;
  const hipY = h * 0.55;
  const ankleY = bottom;

  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(cx + shoulderW, shoulderY);
  ctx.lineTo(cx + hipW, hipY);
  ctx.lineTo(cx + hipW + 15, ankleY);
  ctx.moveTo(cx - hipW - 15, ankleY);
  ctx.lineTo(cx - hipW, hipY);
  ctx.lineTo(cx - shoulderW, shoulderY);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY);
  ctx.lineTo(margin, h * 0.45);
  ctx.moveTo(cx + shoulderW, shoulderY);
  ctx.lineTo(w - margin, h * 0.45);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Status label
  ctx.font = `bold ${Math.round(w * 0.02)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = frameColor;
  ctx.globalAlpha = 0.7;
  ctx.fillText(
    detected ? "✓ FULL BODY DETECTED" : "⚠ SHOW YOUR FULL BODY",
    cx,
    bottom + 5,
  );

  ctx.restore();
}
