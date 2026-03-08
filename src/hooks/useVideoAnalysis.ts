// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useVideoAnalysis Hook
// Processes a recorded/uploaded video frame-by-frame through the pose pipeline.
// Produces a complete PoseSequence and SessionReport.
// ═══════════════════════════════════════════════════════════════════════════════

import { analyzeSequence, type SessionReport } from "@/lib/poseAnalyzer";
import { poseRecorder, type PoseSequence } from "@/lib/poseRecorder";
import { useCallback, useRef, useState } from "react";

export type AnalysisStatus = "idle" | "processing" | "complete" | "error";

export interface UseVideoAnalysisReturn {
  status: AnalysisStatus;
  progress: number; // 0-100
  sequence: PoseSequence | null;
  report: SessionReport | null;
  error: string | null;
  processVideo: (file: File, discipline: string) => Promise<void>;
  reset: () => void;
}

export function useVideoAnalysis(): UseVideoAnalysisReturn {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [sequence, setSequence] = useState<PoseSequence | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const cancelRef = useRef(false);

  const processVideo = useCallback(async (file: File, discipline: string) => {
    setStatus("processing");
    setProgress(0);
    setError(null);
    setSequence(null);
    setReport(null);
    cancelRef.current = false;

    try {
      // Create a video element to decode the file
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video"));
      });

      const duration = video.duration;
      const totalFrames = Math.ceil(duration * 30); // 30fps target
      const frameInterval = 1 / 30;

      // Spawn pose-vision worker
      const worker = new Worker(
        new URL("/workers/pose-vision.worker.js", window.location.origin),
        { type: "module" },
      );
      workerRef.current = worker;

      // Wait for worker READY
      await new Promise<void>((resolve) => {
        worker.onmessage = (e) => {
          if (e.data.type === "READY") resolve();
        };
        worker.postMessage({ type: "INIT", discipline });
      });

      // Start recording
      poseRecorder.start(discipline);

      // Process frames by seeking through the video
      let frameIdx = 0;
      const processNextFrame = (): Promise<void> => {
        return new Promise((resolve) => {
          if (cancelRef.current || frameIdx >= totalFrames) {
            resolve();
            return;
          }

          const seekTime = frameIdx * frameInterval;
          if (seekTime > duration) {
            resolve();
            return;
          }

          video.currentTime = seekTime;

          video.onseeked = async () => {
            try {
              const bitmap = await createImageBitmap(video);
              const timestamp = seekTime * 1000;

              // Send to worker and wait for result
              const result = await new Promise<any>((res) => {
                worker.onmessage = (e) => {
                  if (e.data.type === "VISION_RESULT") res(e.data);
                };
                worker.postMessage(
                  { type: "PROCESS_FRAME", bitmap, timestamp },
                  [bitmap],
                );
              });

              // Record the keypoints
              const landmarks = result.poseLandmarks?.[0] ?? [];
              const kpArray = landmarks.map((lm: any) => [
                lm.x ?? 0,
                lm.y ?? 0,
                lm.z ?? 0,
                lm.visibility ?? 0,
              ]);
              poseRecorder.addFrame(kpArray, 0);

              frameIdx++;
              setProgress(Math.round((frameIdx / totalFrames) * 100));
              resolve();
            } catch {
              frameIdx++;
              resolve();
            }
          };
        });
      };

      // Process all frames sequentially
      for (let i = 0; i < totalFrames && !cancelRef.current; i++) {
        await processNextFrame();
      }

      // Stop recording and analyze
      const seq = poseRecorder.stop();
      const sessionReport = analyzeSequence(seq);

      setSequence(seq);
      setReport(sessionReport);
      setStatus("complete");
      setProgress(100);

      // Cleanup
      worker.postMessage({ type: "DESTROY" });
      setTimeout(() => worker.terminate(), 200);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setStatus("idle");
    setProgress(0);
    setSequence(null);
    setReport(null);
    setError(null);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "DESTROY" });
      setTimeout(() => workerRef.current?.terminate(), 200);
      workerRef.current = null;
    }
  }, []);

  return { status, progress, sequence, report, error, processVideo, reset };
}
