'use client';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toaster';
import { NavigationProvider } from '@/app/contexts/NavigationContext';
import { ThemeProvider as AppThemeProvider } from '@/app/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="smarttags-color-mode"
    >
      <AppThemeProvider>
        <NavigationProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NavigationProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
} 