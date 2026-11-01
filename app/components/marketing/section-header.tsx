'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  label: string;
  headline: string;
  subheadline?: string;
  align?: 'center' | 'left';
  dark?: boolean;
  className?: string;
}

export function SectionHeader({
  label,
  headline,
  subheadline,
  align = 'left',
  dark = false,
  className,
}: SectionHeaderProps) {
  const isCenter = align === 'center';
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        isCenter ? 'mx-auto text-center max-w-3xl' : 'text-left max-w-3xl',
        'mb-14',
        className
      )}
    >
      <div
        className={cn(
          isCenter ? 'eyebrow-center' : 'eyebrow',
          'mb-5',
          dark && '!text-gold'
        )}
      >
        {label}
      </div>
      <h2
        className={cn(
          !isCenter && 'bordered-heading',
          'font-display text-3xl font-bold leading-snug sm:text-4xl',
          dark ? 'text-white' : 'text-epc-primary'
        )}
      >
        {headline}
      </h2>
      {isCenter && <div className="mx-auto mt-5 h-1 w-16 bg-gold" />}
      {subheadline && (
        <p
          className={cn(
            'mt-5 text-lg leading-relaxed',
            dark ? 'text-white/75' : 'text-body',
            isCenter && 'mx-auto max-w-2xl'
          )}
        >
          {subheadline}
        </p>
      )}
    </motion.div>
  );
}
