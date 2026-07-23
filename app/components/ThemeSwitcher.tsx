'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeSwitcher({ className, showLabel = false }: ColorModeToggleProps) {
  const { resolvedTheme, setTheme } = useNextTheme();
  const { setTheme: setAppTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    setAppTheme(next === 'light' ? 'light' : 'default');
  };

  if (!mounted) {
    return <div className={cn('size-10 rounded-full', className)} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex items-center justify-center rounded-full border border-primary-light p-2 text-sm font-medium transition-all duration-200',
        showLabel && 'gap-2 px-3',
        'text-text-secondary hover:border-accent-teal hover:bg-accent-teal/10 hover:text-accent-teal',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {showLabel && (
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
