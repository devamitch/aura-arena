import { type UseCameraReturn } from "@hooks/useCamera";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import type { FrameScore } from "@types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface CameraViewProps {
  camera: UseCameraReturn;
  score?: FrameScore;
  accentColor: string;
  showScore?: boolean;
}

export function CameraView({
  camera,
  score,
  accentColor,
  showScore = true,
}: CameraViewProps) {
  const {
    videoRef,
    canvasRef,
    permission,
    streaming,
    mirrored,
    engineReady,
    scanProgress,
    errorMessage,
    coachMessage,
    outOfFrame,
    requestCamera,
    toggleMirror,
  } = camera;

  return (
    <Card className="relative w-full aspect-[4/3] bg-black overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 rounded-3xl group">
      {/* Video stream (hidden, used as source) */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
      />

      {/* Permission States */}
      <AnimatePresence>
        {permission !== "granted" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-8 text-center"
          >
            {permission === "idle" || permission === "requesting" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">
                  Initialize Camera
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xs">
                  AURA requires camera access for AI-powered movement tracking.
                </p>
                <Button
                  onClick={requestCamera}
                  disabled={permission === "requesting"}
                  className="rounded-full px-8 py-6 h-auto text-lg hover:scale-105 transition-transform"
                >
                  {permission === "requesting"
                    ? "Requesting..."
                    : "Grant Access"}
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">
                  Access Denied
                </h3>
                <p className="text-destructive/80 mb-8 max-w-xs">
                  {errorMessage ||
                    "Please enable camera permissions in your browser settings to continue."}
                </p>
                <Button
                  variant="outline"
                  onClick={requestCamera}
                  className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Try Again
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Loading Overlay */}
      <AnimatePresence>
        {permission === "granted" && !engineReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-4 rounded-full border-4 border-ac2/20 border-b-ac2 animate-reverse-spin" />
            </div>
            <p className="text-sm font-mono tracking-widest text-primary animate-pulse">
              SYNCING MEDIA_PIPE...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Overlays */}
      {streaming && (
        <>
          {/* Top Indicators */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div className="flex flex-col gap-2">
              <Badge
                variant="outline"
                className="bg-black/60 backdrop-blur-xl border-white/10 flex gap-2 py-1.5 px-4 rounded-full shadow-2xl"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/90">
                  Live Neural Feed
                </span>
              </Badge>
              {engineReady && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 backdrop-blur-xl border-primary/20 flex gap-2 py-1.5 px-4 rounded-full shadow-2xl"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary">
                    AURA Engine Active
                  </span>
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMirror}
                className="bg-black/40 backdrop-blur-md hover:bg-primary/20 border border-white/5"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bottom HUD (Scanline info) */}
          {scanProgress < 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-center">
              <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-primary animate-pulse drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                Initializing Biometrics... {Math.round(scanProgress * 100)}%
              </p>
            </div>
          )}

          {/* Large Center Score (Optional) */}
          {showScore && score && score.overall > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[120px] font-display font-black leading-none opacity-10 blur-[2px]"
                style={{ color: accentColor }}
              >
                {score.overall}
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* AI Coach Real-time Feedback */}
      <AnimatePresence>
        {streaming && engineReady && coachMessage && !outOfFrame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <Badge className="bg-primary/20 backdrop-blur-xl border-primary/40 text-primary px-4 py-2 rounded-2xl shadow-lg shadow-primary/20 animate-pulse whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 mr-2 inline" />
              <span className="font-display font-bold text-sm">
                {coachMessage}
              </span>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Out of Frame Warning */}
      <AnimatePresence>
        {streaming && engineReady && outOfFrame && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-6 py-4 rounded-3xl bg-red-500/20 backdrop-blur-xl border border-red-500/40 flex flex-col items-center gap-2 pointer-events-none"
          >
            <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
            <p className="font-display font-bold text-white text-sm">
              ADJUST POSITION
            </p>
            <p className="font-mono text-[10px] text-red-200 uppercase tracking-widest text-center">
              Please ensure your full body
              <br />
              is visible in the frame
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Brackets (SVG Overlay for precision) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 5,15 L 5,5 L 15,5"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            className="opacity-40"
          />
          <path
            d="M 85,5 L 95,5 L 95,15"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            className="opacity-40"
          />
          <path
            d="M 5,85 L 5,95 L 15,95"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            className="opacity-40"
          />
          <path
            d="M 85,95 L 95,95 L 95,85"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            className="opacity-40"
          />
        </svg>
      </div>
    </Card>
  );
}
