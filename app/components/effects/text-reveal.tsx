'use client';

import { motion } from 'framer-motion';
import { textRevealContainer, textRevealChild } from '@/lib/animation';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  splitBy?: 'word' | 'character';
}

export function TextReveal({
  text,
  className,
  delay = 0,
  as: Tag = 'span',
  splitBy = 'word',
}: TextRevealProps) {
  const items = splitBy === 'word' ? text.split(' ') : text.split('');

  return (
    <Tag className={cn('inline-flex flex-wrap', className)}>
      <motion.span
        className="inline-flex flex-wrap"
        variants={textRevealContainer(0.04)}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-5%' }}
        transition={{ delayChildren: delay }}
      >
        {items.map((item, i) => (
          <motion.span
            key={i}
            variants={textRevealChild}
            className="inline-block"
            style={{ whiteSpace: splitBy === 'word' ? 'pre' : undefined }}
          >
            {item}
            {splitBy === 'word' && i < items.length - 1 ? '\u00A0' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
