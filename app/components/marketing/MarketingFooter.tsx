'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Facebook } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const MARK_LAYERS = 8;

function Mark3D() {
  const reduce = useReducedMotion();
  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        animate={reduce ? undefined : { rotateY: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d', rotateX: 6 }}
        className="relative h-24 w-24"
      >
        {Array.from({ length: MARK_LAYERS }).map((_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/images/epcora-mark-dark.svg"
            alt={i === 0 ? 'EPCORA' : ''}
            aria-hidden={i !== 0}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
            style={{
              transform: `translateZ(${-i * 3}px)`,
              filter: i === 0 ? 'none' : 'brightness(0.32) saturate(0.85)',
            }}
          />
        ))}
      </motion.div>
      <div className="mark-floor-shadow" />
    </div>
  );
}

const footerPlatform = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Feature Deep-Dive', href: '/#features' },
  { label: 'Live Showcase', href: '/#showcase' },
  { label: 'Interactive QR Demo', href: '/#demo' },
  { label: 'Pricing & Plans', href: '/#pricing' },
];

const footerProducts = [
  { name: 'SmartTagScan', tag: 'Asset Intelligence', href: '/' },
  { name: 'SmartProject', tag: 'Project Control', href: '/features' },
  { name: 'SmartProcureSimple', tag: 'Procurement', href: '/features' },
  { name: 'SmartExpediteSimple', tag: 'Expediting', href: '/features' },
  { name: 'SmartWave', tag: 'Workforce & Camp', href: '/features' },
  { name: 'SmartClass', tag: 'Material Classification', href: '/features' },
];

const footerCompany = [
  { label: 'Operations Dashboard', href: '/dashboard' },
  { label: 'Features Overview', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact & Demo', href: '/contact' },
];

const footerLegal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Security & Compliance', href: '/privacy' },
];

export function MarketingFooter() {
  return (
    <footer className="bg-ink pb-8 pt-16 text-white/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/epcora-mark-dark.svg"
              alt="EPCORA logo"
              className="h-9 w-auto object-contain"
            />
            <span className="font-display text-xl font-extrabold text-white">
              SmartTag<span className="text-gold">Scan</span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed">
            Every Asset. One Scan. Total Control. Empowering construction &amp; EPC operations with decades of industry expertise and AI-powered asset intelligence.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Linkedin, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#top"
                aria-label="Social link"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 transition-all hover:border-gold hover:text-gold"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            Platform
          </h4>
          <div className="mb-5 h-0.5 w-10 bg-epc-secondary" />
          <ul className="space-y-3 text-sm">
            {footerPlatform.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            EPCORA Suite
          </h4>
          <div className="mb-5 h-0.5 w-10 bg-epc-secondary" />
          <ul className="space-y-3">
            {footerProducts.map((p) => (
              <li key={p.name}>
                <Link href={p.href} className="text-sm transition-colors hover:text-gold">
                  {p.name} <span className="text-xs text-white/40">· {p.tag}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            Quick Links
          </h4>
          <div className="mb-5 h-0.5 w-10 bg-epc-secondary" />
          <ul className="space-y-3 text-sm">
            {footerCompany.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            Legal
          </h4>
          <div className="mb-5 h-0.5 w-10 bg-epc-secondary" />
          <ul className="space-y-3 text-sm">
            {footerLegal.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* EPCORA lockup — the company behind the stack */}
      <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center gap-3 border-t border-white/10 px-6 pb-4 pt-12 text-center">
        <Mark3D />
        <div className="text-3d-gold font-display text-3xl font-extrabold tracking-[0.3em]">
          EPCORA
        </div>
        <div className="font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
          Engineer · Procure · Construct
        </div>
        <div className="agentically">agentically</div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 px-6 pt-6 text-xs text-white/40 sm:flex-row">
        <span>© {new Date().getFullYear()} EPCORA Stack · SmartTagScan. All rights reserved.</span>
        <span>Digital Transformation Solutions for Construction &amp; EPC</span>
      </div>
    </footer>
  );
}
