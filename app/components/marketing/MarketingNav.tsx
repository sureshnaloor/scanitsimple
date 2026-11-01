'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  Sparkles,
  ArrowRight,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { navLinks } from './marketing-data';

export function MarketingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState('/');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* EPCORA Stack Executive TopBar */}
      <div className="hidden border-b border-white/10 bg-ink text-white/80 md:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 text-xs lg:px-10">
          <div className="flex items-center gap-6">
            <span className="font-medium tracking-wide text-white/75">
              Welcome to <strong className="font-semibold text-gold">EPCORA Stack</strong> — Digital Transformation for Construction &amp; EPC
            </span>
            <span className="h-3 w-px bg-white/15" />
            <a
              href="mailto:contact@epcora.com"
              className="flex items-center gap-1.5 font-medium text-white/80 transition-colors hover:text-gold"
            >
              <Mail size={12} className="text-gold" /> contact@epcora.com
            </a>
            <Link
              href="/contact"
              className="flex items-center gap-1.5 font-semibold text-gold transition-colors hover:text-white"
            >
              <Sparkles size={12} /> Enterprise Asset Intelligence
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
            </Link>
          </div>
          <div className="flex items-center gap-3.5">
            {[Linkedin, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#top"
                aria-label="social link"
                className="text-white/60 transition-colors hover:text-gold"
              >
                <Icon size={13} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky White EPCORA Header */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-all duration-300',
          scrolled
            ? 'border-line py-3 shadow-[0_12px_36px_-10px_rgba(5,5,45,0.16)]'
            : 'border-ink/10 py-4 shadow-sm'
        )}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10">
          {/* LEFT: Brand Lockup */}
          <Link
            href="/"
            onClick={() => setActiveHash('/')}
            className="group flex shrink-0 items-center gap-3.5 pr-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/epcora-mark.svg"
              alt="EPCORA logo"
              className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-display text-[22px] font-black leading-none tracking-[-0.02em] text-ink">
                SmartTag<span className="text-epc-primary">Scan</span>
                <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
              </span>
              <span className="mt-1 flex items-center gap-1.5 font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-epc-primary/80">
                <span className="h-0.5 w-3 bg-golddeep" />
                by EPCORA Stack
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation Links with Generous Spacing & Crisp Contrast */}
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
            {navLinks.map((link) => {
              const isDashboard = link.href === '/dashboard';
              const isActive =
                pathname === link.href &&
                (link.href !== '/' || activeHash === '/');

              if (isDashboard) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-mist px-3.5 py-2 font-display text-[13.5px] font-extrabold uppercase tracking-[0.08em] text-epc-primary ring-1 ring-epc-primary/15 transition-all duration-200 hover:bg-epc-primary hover:text-white hover:shadow-sm"
                  >
                    <LayoutDashboard size={14} className="text-golddeep group-hover:text-gold" />
                    {link.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setActiveHash(link.href)}
                  className={cn(
                    'group relative whitespace-nowrap rounded-md px-3.5 py-2 font-display text-[14px] font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:bg-mist/80 hover:text-epc-primary',
                    isActive ? 'text-epc-primary font-extrabold' : 'text-navy/85'
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute bottom-1 left-3.5 right-3.5 h-[2.5px] origin-left bg-gradient-to-r from-golddeep via-gold to-epc-secondary transition-transform duration-300',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Separated CTA Buttons */}
          <div className="hidden shrink-0 items-center gap-3.5 border-l border-line pl-6 lg:flex">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gold px-6 py-3 font-display text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink shadow-[0_6px_20px_-4px_rgba(232,160,32,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-golddeep"
              >
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => signIn()}
                  className="inline-flex items-center gap-2 whitespace-nowrap border-2 border-epc-primary bg-white px-5 py-2.5 font-display text-[13px] font-extrabold uppercase tracking-[0.1em] text-epc-primary transition-all duration-300 hover:bg-epc-primary hover:text-white hover:shadow-sm"
                >
                  <LogIn size={14} /> Sign In
                </button>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 whitespace-nowrap border-2 border-gold bg-gold px-6 py-2.5 font-display text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink shadow-[0_6px_20px_-4px_rgba(232,160,32,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-golddeep hover:bg-golddeep"
                >
                  Get Started Free <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-ink transition-colors hover:bg-mist hover:text-epc-primary lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="border-t border-line bg-white px-6 py-5 shadow-cardhover lg:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveHash(link.href);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'rounded-md px-3 py-2.5 font-display text-sm font-bold uppercase tracking-[0.1em] transition-colors hover:bg-mist hover:text-epc-primary',
                    pathname === link.href && activeHash === link.href
                      ? 'bg-mist text-epc-primary border-l-4 border-gold'
                      : 'text-navy'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
                {!session && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signIn();
                    }}
                    className="btn-outline justify-center px-6 py-3 text-xs"
                  >
                    Sign In
                  </button>
                )}
                <Link
                  href={session ? '/dashboard' : '/auth/register'}
                  onClick={() => setMobileOpen(false)}
                  className="btn-gold justify-center px-6 py-3 text-xs"
                >
                  {session ? 'Go to Dashboard' : 'Get Started Free'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
