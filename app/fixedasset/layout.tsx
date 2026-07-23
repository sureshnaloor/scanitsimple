'use client';

import { useEffect, type ReactNode } from 'react';
import { useNavigation } from '@/app/contexts/NavigationContext';

export default function FixedAssetLayout({ children }: { children: ReactNode }) {
  const { setActiveSection } = useNavigation();

  useEffect(() => {
    setActiveSection('assets');
  }, [setActiveSection]);

  return <>{children}</>;
}
