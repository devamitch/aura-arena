import { cn } from '@lib/utils';
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('rounded-xl shimmer', className)} style={{ minHeight: 16 }} />
);
