'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAppTheme } from '@/app/contexts/ThemeContext';

const tabs = [
  {
    href: '/fixedasset/transport-assets',
    label: 'Assets',
    match: (p: string) =>
      p === '/fixedasset/transport-assets' ||
      (p.startsWith('/fixedasset/transport-assets/') && !p.includes('/masters/')),
  },
  {
    href: '/fixedasset/transport-assets/masters/preventive',
    label: 'Preventive types',
    match: (p: string) => p.startsWith('/fixedasset/transport-assets/masters/preventive'),
  },
  {
    href: '/fixedasset/transport-assets/masters/breakdown',
    label: 'Breakdown types',
    match: (p: string) => p.startsWith('/fixedasset/transport-assets/masters/breakdown'),
  },
];

export default function TransportAssetsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const tabBar = isLight
    ? 'border-b border-slate-200 bg-white px-4 py-3 flex flex-wrap gap-2'
    : 'border-b border-slate-200 dark:border-[#2A3B4C]/50 bg-white dark:bg-[#111827] px-4 py-3 flex flex-wrap gap-2';

  return (
    <div>
      <div className={tabBar}>
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    : 'bg-slate-50 dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] hover:bg-slate-100 dark:bg-[#2A3B4C] hover:text-[#0F172A] dark:text-[#F8F9FA]'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
