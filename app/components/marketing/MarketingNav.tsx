'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { navLinks } from './marketing-data';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import SmartTagsLogo from '@/app/components/SmartTagsLogo';

export function MarketingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-primary-light bg-primary-navy/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <SmartTagsLogo variant="primary" height={47} priority className="shrink-0" imageClassName="max-w-[182px] sm:max-w-[208px]" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-[15px] font-medium transition-colors duration-200',
                  pathname === link.href
                    ? 'text-accent-teal underline decoration-2 underline-offset-4'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeSwitcher showLabel={false} className="px-2.5 py-2" />
            {session ? (
              <Button variant="cta" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => signIn()}>
                  Sign In
                </Button>
                <Button variant="cta" asChild>
                  <Link href="/auth/register">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-text-secondary hover:bg-primary-slate hover:text-accent-teal lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(320px,85vw)] flex-col bg-primary-dark p-6 shadow-ds-lg">
            <div className="mb-8 flex items-center justify-between">
              <SmartTagsLogo variant="primary" height={47} className="max-w-[208px]" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-text-secondary hover:text-accent-teal"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-lg px-4 py-3 text-h4 font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-accent-teal/15 text-accent-teal'
                      : 'text-text-secondary hover:bg-primary-slate hover:text-text-primary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <ThemeSwitcher className="w-full justify-center" />
              {!session && (
                <Button variant="cta" className="w-full" onClick={() => signIn()}>
                  Sign In
                </Button>
              )}
              <Button variant="cta-secondary" className="w-full" asChild>
                <Link href={session ? '/dashboard' : '/auth/register'}>
                  {session ? 'Dashboard' : 'Get Started Free'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
