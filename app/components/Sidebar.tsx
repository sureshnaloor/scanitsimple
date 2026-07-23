'use client';

import { cn } from '@/lib/utils';
import { useNavigation } from '@/app/contexts/NavigationContext';
import { useEffect, useState } from 'react';
import { SIDEBAR_WIDTH, subLinksMap } from '@/lib/navigation-config';
import { useSidebarStyles } from '@/app/components/navigation/sidebar-styles';
import SidebarNavContent from '@/app/components/navigation/SidebarNavContent';

export default function Sidebar() {
  const sidebarStyles = useSidebarStyles();
  const { activeSection } = useNavigation();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {}
      );
    }
  }, []);

  const subLinks = activeSection ? subLinksMap[activeSection] || [] : [];

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col self-stretch h-full shrink-0',
        sidebarStyles.sidebarBorder,
        sidebarStyles.sidebarBg
      )}
      style={{ width: SIDEBAR_WIDTH }}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {activeSection && subLinks.length > 0 ? (
            <SidebarNavContent activeSection={activeSection} styles={sidebarStyles} />
          ) : (
            <div
              className={cn(
                'flex items-center justify-center h-full text-[10px] px-4 text-center',
                sidebarStyles.emptyText
              )}
            >
              <p>Select a section from the header to see sub-links</p>
            </div>
          )}
        </div>

        <div className={cn('px-3 py-3 space-y-2', sidebarStyles.footerBg)}>
          <div className={cn('text-[9px]', sidebarStyles.footerLabel)}>
            <div className="font-semibold uppercase tracking-wider mb-0.5">Time</div>
            <div className={cn('text-[10px] font-mono', sidebarStyles.footerValue)}>
              {currentTime || '—'}
            </div>
          </div>
          <div className={cn('text-[9px]', sidebarStyles.footerLabel)}>
            <div className="font-semibold uppercase tracking-wider mb-0.5">Location</div>
            {location.lat && location.lon ? (
              <div className={cn('text-[10px] font-mono', sidebarStyles.footerValue)}>
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </div>
            ) : (
              <div className={cn('text-[10px] font-mono', sidebarStyles.footerValueSecondary)}>
                —
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
