import { useEffect, useRef, memo, type CSSProperties } from 'react';
import { useStore } from '@store';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
}

export const AnimatedNumber = memo(function AnimatedNumber({
  value, duration = 600, decimals = 0, className, style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  const reduceMotion = useStore((s) => s.reduceMotion);

  useEffect(() => {
    if (!ref.current) return;
    if (reduceMotion) {
      ref.current.textContent = value.toFixed(decimals);
      from.current = value;
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    const step = (now: number) => {
      if (!ref.current) return;
      const prog = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - prog, 3);
      ref.current.textContent = (start + (value - start) * ease).toFixed(decimals);
      if (prog < 1) requestAnimationFrame(step);
      else from.current = value;
    };
    requestAnimationFrame(step);
  }, [value, duration, decimals, reduceMotion]);

  return <span ref={ref} className={className} style={style}>{value.toFixed(decimals)}</span>;
});
