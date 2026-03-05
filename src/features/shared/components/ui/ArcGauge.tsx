// ArcGauge — premium SVG arc with glow + Syne numerals
import { memo } from 'react';

interface ArcGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ArcGauge = memo(function ArcGauge({
  value, size = 120, strokeWidth = 9, color = '#00e5ff',
  label, sublabel, className = '',
}: ArcGaugeProps) {
  const r   = (size - strokeWidth) / 2;
  const cx  = size / 2;
  const cy  = size / 2;
  const arc = 260; // degrees
  const circ = 2 * Math.PI * r;
  const dash  = (arc / 360) * circ;
  const offset = dash - (Math.min(100, Math.max(0, value)) / 100) * dash;
  const start  = 140; // rotation offset so arc goes bottom-left to bottom-right

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="arc-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--s3)" strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(${start} ${cx} ${cy})`}
        />
        {/* Progress */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(${start} ${cx} ${cy})`}
          filter="url(#arc-glow)"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black tabular-nums leading-none"
          style={{ fontSize: size * 0.25, color }}>
          {Math.round(value)}
        </span>
        {label && (
          <span className="font-mono uppercase tracking-[0.12em] text-[var(--t3)]"
            style={{ fontSize: size * 0.08 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
});
