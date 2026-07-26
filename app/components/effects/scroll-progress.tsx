'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScrollProgressProps {
  className?: string;
  color?: string;
}

export function ScrollProgress({ className, color = 'var(--color-accent-teal)' }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn('fixed left-0 right-0 top-0 z-[100] h-[3px] origin-left', className)}
      style={{
        scaleX,
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`,
      }}
    />
  );
}
