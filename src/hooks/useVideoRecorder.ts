// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Video Recorder Hook
// Captures camera + MediaPipe overlay onto a compositor canvas with watermark.
// Uses MediaRecorder API → returns WebM blob URL for download.
// ═══════════════════════════════════════════════════════════════════════════════

import { createLogger } from "@lib/logger";
import { useCallback, useRef, useState } from "react";

const log = createLogger("VideoRecorder");

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  recordingUrl: string | null;
  startRecording: (
    videoEl: HTMLVideoElement,
    overlayCanvas?: HTMLCanvasElement | null,
    watermark?: string,
  ) => void;
  stopRecording: () => void;
  downloadRecording: (filename?: string) => void;
  clearRecording: () => void;
}

export function useVideoRecorder(): UseVideoRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(
    (
      videoEl: HTMLVideoElement,
      overlayCanvas?: HTMLCanvasElement | null,
      watermark = "AURA ARENA",
    ) => {
      if (isRecording) return;

      // Compositor canvas — matches the video dimensions
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        log.error("Canvas 2D context unavailable");
        return;
      }

      // ── Draw loop: video + overlay + watermark ──
      const draw = () => {
        if (!videoEl.paused && !videoEl.ended) {
          // Mirror the video (front camera is naturally mirrored in display)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Overlay (MediaPipe skeleton canvas) — also mirrored
          if (overlayCanvas) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
              overlayCanvas,
              -canvas.width,
              0,
              canvas.width,
              canvas.height,
            );
            ctx.restore();
          }

          // ── Watermark ──
          const pad = 12;
          const lineH = 18;

          // Bottom-right: brand
          ctx.font = "bold 14px system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.textAlign = "right";
          ctx.fillText(
            `⚡ ${watermark}`,
            canvas.width - pad,
            canvas.height - pad,
          );

          // Bottom-left: timestamp
          const now = new Date();
          const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
          ctx.font = "11px monospace";
          ctx.fillStyle = "rgba(0,240,255,0.5)";
          ctx.textAlign = "left";
          ctx.fillText(ts, pad, canvas.height - pad);

          // Top-right: REC indicator
          ctx.fillStyle = "rgba(239,68,68,0.85)";
          ctx.beginPath();
          ctx.arc(canvas.width - pad - 4, pad + 6, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "bold 11px monospace";
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.textAlign = "right";
          ctx.fillText("REC", canvas.width - pad - lineH, pad + lineH / 2 + 4);
        }

        rafRef.current = requestAnimationFrame(draw);
      };

      draw();

      // Try best codecs in order
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      try {
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          cancelAnimationFrame(rafRef.current);
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setRecordingUrl(url);
          log.info("Recording saved", { size: blob.size });
        };

        recorderRef.current = recorder;
        recorder.start(500); // collect data every 500 ms
        setIsRecording(true);
        log.info("Recording started");
      } catch (err) {
        cancelAnimationFrame(rafRef.current);
        log.error("MediaRecorder failed to start", err);
      }
    },
    [isRecording],
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    rec.stop();
    setIsRecording(false);
    log.info("Recording stopped");
  }, []);

  const downloadRecording = useCallback(
    (filename?: string) => {
      if (!recordingUrl) return;
      const name = filename ?? `aura-arena-${Date.now()}.webm`;
      const a = document.createElement("a");
      a.href = recordingUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [recordingUrl],
  );

  const clearRecording = useCallback(() => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    chunksRef.current = [];
  }, [recordingUrl]);

  return {
    isRecording,
    recordingUrl,
    startRecording,
    stopRecording,
    downloadRecording,
    clearRecording,
  };
}
