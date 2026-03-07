import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AuraOrbProps {
  className?: string;
  size?: number;
  colorPrimary?: string;
  colorSecondary?: string;
}

export function AuraOrb({
  className,
  size = 64,
  colorPrimary = "#0ea5e9", // cyan/teal
  colorSecondary = "#a855f7", // purple
}: AuraOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Set actual canvas resolution 2x for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    const render = () => {
      time += 0.05;

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, size, size);

      ctx.globalCompositeOperation = "screen";

      // Draw outer glow
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.5,
        centerX,
        centerY,
        radius * 1.5,
      );
      outerGlow.addColorStop(0, `${colorPrimary}88`); // 50% opacity
      outerGlow.addColorStop(0.5, `${colorSecondary}44`);
      outerGlow.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Draw swirling core
      const rings = 5;
      for (let i = 0; i < rings; i++) {
        const angle = time + (i * Math.PI * 2) / rings;
        const xOffsets = Math.cos(angle * 0.8) * radius * 0.3;
        const yOffsets = Math.sin(angle * 1.2) * radius * 0.3;

        const innerGradient = ctx.createRadialGradient(
          centerX + xOffsets,
          centerY + yOffsets,
          0,
          centerX,
          centerY,
          radius,
        );
        innerGradient.addColorStop(0, "#ffffff");
        innerGradient.addColorStop(0.3, colorPrimary);
        innerGradient.addColorStop(0.8, colorSecondary);
        innerGradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(centerX + xOffsets, centerY + yOffsets, radius, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw sharp center highlight
      ctx.globalCompositeOperation = "source-over";
      const highlight = ctx.createRadialGradient(
        centerX - radius * 0.2,
        centerY - radius * 0.2,
        0,
        centerX,
        centerY,
        radius * 0.8,
      );
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      highlight.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = highlight;
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, colorPrimary, colorSecondary]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={cn("pointer-events-none object-contain", className)}
      aria-label="Aura Orb Animation"
    />
  );
}
