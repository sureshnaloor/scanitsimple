'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  value: number | string;
  label: string;
  suffix?: string;
  prefix?: string;
  animate?: boolean;
  className?: string;
}

export function StatCard({
  value,
  label,
  suffix = '',
  prefix = '',
  animate = false,
  className,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, ''), 10) || 0;

  useEffect(() => {
    if (!animate || !isInView || typeof value !== 'number') return;
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayValue(Math.min(Math.floor(increment * step), numericValue));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [animate, isInView, numericValue, value]);

  const rendered =
    typeof value === 'number' && animate
      ? `${prefix}${displayValue.toLocaleString()}${suffix}`
      : `${prefix}${value}${suffix}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'border-l-[3px] border-l-accent-teal bg-primary-navy rounded-lg p-6',
        className
      )}
    >
      <div className="text-stat text-accent-teal">{rendered}</div>
      <div className="text-caption uppercase tracking-[0.05em] text-text-muted mt-2">
        {label}
      </div>
    </motion.div>
  );
}
