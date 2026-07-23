'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  getSectionFromPathname,
  subLinksMap,
  type NavigationSection,
} from '@/lib/navigation-config';

interface NavigationContextType {
  activeSection: NavigationSection | null;
  setActiveSection: (section: NavigationSection | null) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeSection = useMemo(
    () => getSectionFromPathname(pathname),
    [pathname]
  );

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const setActiveSection = (_section: NavigationSection | null) => {};

  return (
    <NavigationContext.Provider
      value={{ activeSection, setActiveSection, mobileDrawerOpen, setMobileDrawerOpen }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

export function useHasMobileSublinks(): boolean {
  const { activeSection } = useNavigation();
  if (!activeSection) return false;
  return (subLinksMap[activeSection] || []).length > 0;
}

export type { NavigationSection };
