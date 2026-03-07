import { useCallback, useRef, useState } from "react";

interface RecordResult {
  blob: Blob;
  url: string;
}

export function useVideoRecorder(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  aiCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  playerName: string,
  accentColor: string,
) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Hidden canvas to join video + AI canvas + Watermark
  const getCompositeCanvas = () => {
    if (!compositeCanvasRef.current) {
      const c = document.createElement("canvas");
      c.width = 1280; // Standard 720p HD capture
      c.height = 720;
      compositeCanvasRef.current = c;
    }
    return compositeCanvasRef.current;
  };

  const drawCompositeFrame = () => {
    const video = videoRef.current;
    const aiCanvas = aiCanvasRef.current;
    const compCanvas = getCompositeCanvas();
    const ctx = compCanvas.getContext("2d");

    if (!video || !ctx) return;

    // Draw Video layer (mirrored handled by context scale if needed, but assuming direct feed)
    ctx.save();
    ctx.translate(compCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, compCanvas.width, compCanvas.height);
    ctx.restore();

    // Draw AI landmarks layer
    if (aiCanvas) {
      ctx.drawImage(aiCanvas, 0, 0, compCanvas.width, compCanvas.height);
    }

    // Draw AURA ARENA Watermark
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(compCanvas.width - 260, compCanvas.height - 70, 240, 50);

    ctx.fillStyle = accentColor;
    ctx.font = "bold 20px monospace";
    ctx.fillText("AURA ARENA", compCanvas.width - 240, compCanvas.height - 48);

    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText(
      playerName.toUpperCase(),
      compCanvas.width - 240,
      compCanvas.height - 28,
    );

    animationFrameRef.current = requestAnimationFrame(drawCompositeFrame);
  };

  const startRecording = useCallback(() => {
    chunksRef.current = [];
    const canvas = getCompositeCanvas();
    const stream = canvas.captureStream(30); // 30 FPS

    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    setIsRecording(true);
    mr.start(1000); // chunk every second
    drawCompositeFrame(); // Start loop
  }, []);

  const stopRecording = useCallback((): Promise<RecordResult> => {
    return new Promise((resolve, reject) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === "inactive") {
        reject(new Error("No active recording"));
        return;
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setIsRecording(false);
        resolve({ blob, url });
      };

      mr.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
}
