import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@lib/utils';
import { motion } from 'framer-motion';

// ─── SELECT ───────────────────────────────────────────────────────────────────

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ children, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-xl border border-b1 bg-s1 px-3 py-2 text-sm text-t1',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-void',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-b2 transition-colors',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="w-4 h-4 text-t3" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ children, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 overflow-hidden rounded-xl border border-b1 bg-s1 text-t1 shadow-depth',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ children, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm',
        'focus:bg-s2 focus:text-t1 outline-none transition-colors',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="w-4 h-4 text-accent" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

// ─── SCORE DISPLAY ────────────────────────────────────────────────────────────

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  color?: string;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function ScoreDisplay({ score, size = 'md', color = '#00f0ff', label, animate = true, className }: ScoreDisplayProps) {
  const sizes = {
    sm:   'text-2xl',
    md:   'text-4xl',
    lg:   'text-6xl',
    hero: 'text-8xl',
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <motion.div
        className={cn('font-display font-black tabular-nums', sizes[size])}
        style={{ color, textShadow: `0 0 20px ${color}60` }}
        initial={animate ? { scale: 0.5, opacity: 0 } : false}
        animate={animate ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {score.toFixed(0)}
      </motion.div>
      {label && <p className="text-xs font-mono text-t3 uppercase tracking-widest mt-1">{label}</p>}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon = '🏟️', title, description, cta, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display font-bold text-lg text-t1 mb-2">{title}</h3>
      {description && <p className="text-t2 text-sm max-w-xs mb-5">{description}</p>}
      {cta && (
        <button
          onClick={cta.onClick}
          className="px-6 py-2.5 rounded-xl bg-accent text-void text-sm font-bold hover:opacity-90 transition-opacity"
        >
          {cta.label}
        </button>
      )}
    </motion.div>
  );
}

// ─── ERROR STATE ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex flex-col items-center justify-center py-10 px-6 text-center', className)}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="font-display font-bold text-t1 mb-1">{title}</h3>
      <p className="text-t2 text-sm max-w-xs mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/10 transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}

// ─── LOADING PULSE (inline) ───────────────────────────────────────────────────

export function LoadingPulse({ color = '#00f0ff', size = 24 }: { color?: string; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: size / 3, height: size / 3, background: color }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
