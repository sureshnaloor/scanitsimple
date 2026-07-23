'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/app/contexts/NavigationContext';
import { subLinksMap } from '@/lib/navigation-config';
import { useSidebarStyles } from './sidebar-styles';
import SidebarNavContent from './SidebarNavContent';

export default function MobileNavDrawer() {
  const { activeSection, mobileDrawerOpen, setMobileDrawerOpen } = useNavigation();
  const styles = useSidebarStyles();

  const subLinks = activeSection ? subLinksMap[activeSection] || [] : [];
  const hasSublinks = subLinks.length > 0;

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen, setMobileDrawerOpen]);

  if (!hasSublinks || !activeSection) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] md:hidden transition-opacity duration-300',
          styles.drawerOverlay,
          mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden={!mobileDrawerOpen}
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex w-[min(300px,85vw)] flex-col md:hidden transition-transform duration-300 ease-out',
          styles.drawerBg,
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!mobileDrawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Section navigation"
      >
        <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
          <span className={cn('text-xs font-bold uppercase tracking-widest', styles.sectionTitle)}>
            Menu
          </span>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className={cn(
              'rounded-lg p-2 transition-colors',
              styles.linkText,
              styles.linkHover
            )}
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNavContent
            activeSection={activeSection}
            styles={styles}
            onLinkClick={() => setMobileDrawerOpen(false)}
          />
        </div>
      </aside>
    </>
  );
}
