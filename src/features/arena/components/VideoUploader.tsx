// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Video Uploader Component
// Drag-and-drop or file picker for analyzing recorded videos.
// Processes frame-by-frame and shows the AnalysisTimeline on completion.
// ═══════════════════════════════════════════════════════════════════════════════

import { useVideoAnalysis } from "@/hooks/useVideoAnalysis";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Film, RotateCcw, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AnalysisTimeline } from "./AnalysisTimeline";

interface VideoUploaderProps {
  discipline: string;
  accentColor: string;
}

export function VideoUploader({ discipline, accentColor }: VideoUploaderProps) {
  const { status, progress, report, error, processVideo, reset } =
    useVideoAnalysis();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) return;
      setFileName(file.name);
      processVideo(file, discipline);
    },
    [discipline, processVideo],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* ── Idle: Upload Zone ── */}
        {status === "idle" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center gap-4"
            style={{
              borderColor: isDragging ? accentColor : "rgba(255,255,255,0.1)",
              background: isDragging
                ? `${accentColor}08`
                : "rgba(255,255,255,0.02)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${accentColor}15` }}
            >
              <Upload className="w-7 h-7" style={{ color: accentColor }} />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-bold text-sm mb-1">
                Drop your video here
              </p>
              <p className="text-white/30 text-xs font-mono">
                MP4, WebM, MOV · Max 2 minutes
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={onFileChange}
              className="hidden"
            />
          </motion.div>
        )}

        {/* ── Processing ── */}
        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full py-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col items-center gap-5"
          >
            <div className="relative w-20 h-20">
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{
                  borderColor: `${accentColor}30`,
                  borderTopColor: accentColor,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-7 h-7" style={{ color: accentColor }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/80 font-bold text-sm mb-1">
                Analyzing {fileName}
              </p>
              <p className="text-white/40 text-xs font-mono">
                Processing frames with MediaPipe + TensorFlow
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-3/4 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accentColor }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-mono text-white/50">{progress}%</span>
          </motion.div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-8 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col items-center gap-4"
          >
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <p className="text-red-300 text-sm font-bold">{error}</p>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ── Results ── */}
        {status === "complete" && report && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <AnalysisTimeline report={report} accentColor={accentColor} />
            <button
              onClick={reset}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze Another Video
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
