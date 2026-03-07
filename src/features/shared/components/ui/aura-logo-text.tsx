import { cn } from "@/lib/utils";

interface AuraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}

export function AuraLogoText({
  className,
  size = "md",
  glow = true,
}: AuraLogoProps) {
  const sizeMap = {
    sm: "text-lg tracking-tight",
    md: "text-2xl tracking-tighter",
    lg: "text-4xl tracking-tighter",
    xl: "text-6xl tracking-tighter",
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <span
        className={cn(
          "font-black relative z-10 bg-clip-text text-transparent italic !leading-none",
          sizeMap[size],
        )}
        style={{
          backgroundImage:
            "linear-gradient(180deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          transform: "skewX(-10deg)",
        }}
      >
        AURA
      </span>
      <span
        className={cn(
          "font-black relative z-10 bg-clip-text text-transparent italic !leading-none ml-[0.1em]",
          sizeMap[size],
        )}
        style={{
          backgroundImage: "linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          transform: "skewX(-10deg)",
        }}
      >
        ARENA
      </span>

      {/* Extreme Premium Glow effect built purely with CSS */}
      {glow && (
        <>
          <span
            className={cn(
              "absolute inset-0 z-0 font-black flex italic !leading-none",
              sizeMap[size],
            )}
            style={{
              color: "transparent",
              textShadow:
                "0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)",
              letterSpacing: "-0.04em",
              transform: "skewX(-10deg)",
            }}
          >
            AURA<span className="ml-[0.1em]">ARENA</span>
          </span>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[120%] h-[50%] bg-[#00f0ff] opacity-20 blur-[20px] rounded-[100%]" />
          </div>
        </>
      )}
    </div>
  );
}
