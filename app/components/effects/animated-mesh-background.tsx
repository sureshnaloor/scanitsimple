'use client';

import { cn } from '@/lib/utils';

interface AnimatedMeshBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function AnimatedMeshBackground({ className, intensity = 'medium' }: AnimatedMeshBackgroundProps) {
  const intensityMap = {
    subtle: 'opacity-30',
    medium: 'opacity-50',
    strong: 'opacity-80',
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Animated mesh blobs */}
      <div className={cn('mesh-blob mesh-blob-1', intensityMap[intensity])} />
      <div className={cn('mesh-blob mesh-blob-2', intensityMap[intensity])} />
      <div className={cn('mesh-blob mesh-blob-3', intensityMap[intensity])} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
    </div>
  );
}
