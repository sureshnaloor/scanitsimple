'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  rows?: number;
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-6', className)}>
      <div className="skeleton-shimmer mb-4 h-4 w-1/3 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer mb-3 h-3 w-full rounded" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}
