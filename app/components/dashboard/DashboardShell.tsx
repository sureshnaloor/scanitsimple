'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bell, ChevronRight } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';

interface DashboardShellProps {
  title?: string;
  breadcrumb?: string[];
  children: React.ReactNode;
}

export function DashboardShell({
  title = 'Dashboard',
  breadcrumb = ['Home', 'Dashboard'],
  children,
}: DashboardShellProps) {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U';

  return (
    <div className="flex min-h-screen flex-col ds-page-bg">
      <div className="sticky top-0 z-40 flex h-[64px] shrink-0 items-center justify-between border-b border-primary-light bg-primary-navy/95 px-4 backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0">
            <nav className="mb-0.5 flex items-center gap-1 text-xs text-text-muted">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" />}
                <span className={i === breadcrumb.length - 1 ? 'text-accent-teal' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
            </nav>
            <h1 className="text-base font-semibold text-text-primary md:text-lg">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <SearchInput
            placeholder="Search assets..."
            containerClassName="hidden w-52 lg:block xl:w-64"
            className="h-9"
          />
          <ThemeSwitcher showLabel={false} className="px-2.5 py-2" />
          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-md bg-primary-slate text-text-secondary transition-colors hover:bg-primary-light hover:text-accent-teal"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent-orange" />
          </button>
          <Link
            href="/auth/change-password"
            className="flex size-10 items-center justify-center rounded-full bg-accent-teal/15 text-sm font-semibold text-accent-teal"
            title={session?.user?.name ?? 'User'}
          >
            {initials}
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
