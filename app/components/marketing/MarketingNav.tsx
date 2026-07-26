'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { navLinks } from './marketing-data';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import SmartTagsLogo from '@/app/components/SmartTagsLogo';
import { ScrollProgress } from '@/app/components/effects/scroll-progress';

export function MarketingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <ScrollProgress />
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-primary-light bg-primary-navy/90 backdrop-blur-xl"
        animate={{ y: hidden ? -72 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <SmartTagsLogo variant="primary" height={47} priority className="shrink-0" imageClassName="max-w-[182px] sm:max-w-[208px]" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative px-4 py-2 text-[15px] font-medium transition-colors duration-200',
                  pathname === link.href
                    ? 'text-accent-teal'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {link.label}
                <span
                  className={cn(
                    'absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 bg-accent-teal transition-all duration-300',
                    pathname === link.href ? 'w-full' : 'w-0 group-hover:w-3/4'
                  )}
                />
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
      </motion.header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="absolute right-0 top-0 flex h-full w-[min(320px,85vw)] flex-col bg-primary-dark p-6 shadow-ds-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
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
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
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
                </motion.div>
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
          </motion.div>
        </div>
      )}
    </>
  );
}
