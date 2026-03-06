import { motion } from "framer-motion";

interface RadarGridProps {
  color?: string;
  size?: number;
  className?: string;
}

export const DynamicRadarGrid = ({
  color = "#00f0ff",
  size = 64,
  className = "",
}: RadarGridProps) => {
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 z-0"
      >
        {/* Background Grid */}
        <path
          d="M0 50H100M50 0V100"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.1"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        <circle cx="50" cy="50" r="10" fill={color} fillOpacity="0.8" />

        {/* Pulse Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          stroke={color}
          strokeWidth="2"
          fill="none"
          initial={{ r: 10, opacity: 1 }}
          animate={{ r: 48, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          stroke={color}
          strokeWidth="1"
          fill="none"
          initial={{ r: 10, opacity: 1 }}
          animate={{ r: 48, opacity: 0 }}
          transition={{
            duration: 2,
            delay: 1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* Radar Sweep Line */}
        <motion.path
          d="M50 50L50 2"
          stroke={`url(#radarGradient)`}
          strokeWidth="2"
          style={{ originX: "50px", originY: "50px" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Glowing Dots (Found Athletes) */}
        <motion.circle
          cx="70"
          cy="30"
          r="2"
          fill="#fff"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{
            duration: 4,
            times: [0, 0.1, 1],
            repeat: Infinity,
            delay: 0.5,
          }}
        />
        <motion.circle
          cx="20"
          cy="60"
          r="3"
          fill="#fff"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{
            duration: 4,
            times: [0, 0.1, 1],
            repeat: Infinity,
            delay: 2.5,
          }}
        />

        <defs>
          <linearGradient id="radarGradient" x1="50" y1="50" x2="50" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
