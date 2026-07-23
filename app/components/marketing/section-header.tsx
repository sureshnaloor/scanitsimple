'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  label: string;
  headline: string;
  subheadline?: string;
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeader({
  label,
  headline,
  subheadline,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className={cn(
        align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left max-w-2xl',
        className
      )}
    >
      <span className="inline-block mb-4 px-4 py-1.5 text-caption uppercase tracking-[0.05em] text-accent-teal border border-accent-teal rounded-full">
        {label}
      </span>
      <h2 className="text-h2 mb-4">{headline}</h2>
      {subheadline && (
        <p className="text-body-ds max-w-[65ch] mx-auto">{subheadline}</p>
      )}
    </motion.div>
  );
}
