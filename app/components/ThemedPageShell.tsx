'use client';

import { useRef, type ReactNode } from 'react';

import { useAppTheme } from '@/app/contexts/ThemeContext';
import { useParticleCanvas } from '@/lib/useParticleCanvas';

type Props = {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
};

export default function ThemedPageShell({
  children,
  className = 'p-4 md:p-6',
  maxWidth = 'max-w-6xl',
}: Props) {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef, !isLight);

  if (isLight) {
    return (
      <div className={`min-h-screen w-full bg-[#F1F5F9] ${className}`}>
        <div className={`mx-auto w-full ${maxWidth}`}>{children}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]">
      <canvas ref={canvasRef} className="absolute inset-0 z-10" aria-hidden />
      <div className={`relative z-20 ${className}`}>
        <div className={`mx-auto w-full ${maxWidth}`}>{children}</div>
      </div>
    </div>
  );
}
