'use client';

import { useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number;
  perspective?: number;
  scale?: number;
  disabled?: boolean;
}

export function TiltCard({
  children,
  className,
  tiltAmount = 12,
  perspective = 800,
  scale = 1.02,
  disabled = false,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = (clientX: number, clientY: number) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -tiltAmount;
    const rotateY = ((x - centerX) / centerX) * tiltAmount;
    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{ perspective: `${perspective}px`, transformStyle: 'preserve-3d' }}
      animate={{ transform }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      {children}
      {isHovered && !disabled && (
        <div
          className="pointer-events-none absolute inset-0 rounded-inherit"
          style={{
            background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,180,216,0.08) 0%, transparent 60%)',
          }}
        />
      )}
    </motion.div>
  );
}
