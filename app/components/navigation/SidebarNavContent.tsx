'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  subLinksMap,
  sectionLabels,
  isPathActive,
  type NavigationSection,
} from '@/lib/navigation-config';
import type { SidebarStyleSet } from './sidebar-styles';

type Props = {
  activeSection: NavigationSection;
  styles: SidebarStyleSet;
  onLinkClick?: () => void;
  className?: string;
};

export default function SidebarNavContent({
  activeSection,
  styles,
  onLinkClick,
  className,
}: Props) {
  const pathname = usePathname();
  const subLinks = subLinksMap[activeSection] || [];

  if (subLinks.length === 0) return null;

  return (
    <nav className={cn('px-2', className)}>
      <div className={cn('mx-2 mb-3 pb-2 border-b', styles.sectionDivider)}>
        <h2
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.18em]',
            styles.sectionTitle
          )}
        >
          {sectionLabels[activeSection]}
        </h2>
      </div>

      <ul className="space-y-0.5">
        {subLinks.map((link) => {
          if (link.isGroupLabel) {
            return (
              <li key={link.name}>
                <div
                  className={cn(
                    'px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.2em]',
                    styles.groupLabel
                  )}
                >
                  {link.name}
                </div>
              </li>
            );
          }

          const isActive = isPathActive(pathname ?? '', link.href);
          const Icon = link.icon;

          return (
            <li key={link.name}>
              <Link
                href={link.href}
                onClick={onLinkClick}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 border border-transparent',
                  styles.linkText,
                  !isActive && styles.linkHover,
                  isActive && styles.linkActive
                )}
              >
                {Icon && (
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'bg-accent-teal/20' : link.iconBg
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        isActive
                          ? 'text-accent-teal drop-shadow-[0_0_8px_rgba(45,212,191,0.9)]'
                          : link.iconColor,
                        !isActive && link.iconGlow
                      )}
                    />
                  </span>
                )}
                <span className="leading-tight">{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
