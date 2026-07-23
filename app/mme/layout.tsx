'use client';

import { useEffect, type ReactNode } from 'react';
import { useNavigation } from '@/app/contexts/NavigationContext';

export default function MMELayout({ children }: { children: ReactNode }) {
  const { setActiveSection } = useNavigation();

  useEffect(() => {
    setActiveSection('mme');
  }, [setActiveSection]);

  return <>{children}</>;
}
