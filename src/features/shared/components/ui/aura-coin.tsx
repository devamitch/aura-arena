import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AuraCoinProps {
  className?: string;
  size?: number;
}

export function AuraCoin({ className, size = 64 }: AuraCoinProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    const render = () => {
      time += 0.03;

      ctx.clearRect(0, 0, size, size);

      // Draw metallic gold outer ring
      const goldGrad = ctx.createLinearGradient(0, 0, size, size);
      goldGrad.addColorStop(0, "#fcd34d"); // yellow-300
      goldGrad.addColorStop(0.5, "#d97706"); // amber-600
      goldGrad.addColorStop(1, "#fef3c7"); // yellow-100

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad;
      ctx.fill();

      // Draw inner groove
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = size * 0.05;
      ctx.stroke();

      // Shiny sweep animation
      ctx.globalCompositeOperation = "screen";
      const sweepX = Math.cos(time) * size;
      const sweepY = Math.sin(time) * size;

      const shineGrad = ctx.createLinearGradient(
        centerX - sweepX,
        centerY - sweepY,
        centerX + sweepX,
        centerY + sweepY,
      );
      shineGrad.addColorStop(0, "transparent");
      shineGrad.addColorStop(0.45, "transparent");
      shineGrad.addColorStop(0.5, "rgba(255,255,255,0.7)");
      shineGrad.addColorStop(0.55, "transparent");
      shineGrad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      // Embossed "A" logo
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#92400e"; // dark amber
      ctx.font = `bold ${size * 0.5}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A", centerX, centerY + size * 0.04);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={cn(
        "pointer-events-none object-contain drop-shadow-lg",
        className,
      )}
      aria-label="Aura Coin Animation"
    />
  );
}
