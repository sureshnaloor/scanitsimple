'use client';

import Link from 'next/link';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Zap, Shield, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/app/components/effects/count-up';
import { MagneticButton } from '@/app/components/effects/magnetic-button';
import { heroStats } from '../marketing-data';

const statIcons = [BarChart3, Zap, Shield, Building2];

/* ─── Animated Character Reveal ─── */
function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span className={className} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split('').map((char, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 50, rotateX: -90 },
                visible: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: { duration: 0.5, delay: (wi * 8 + i) * 0.03, ease: [0.215, 0.61, 0.355, 1] },
                },
              }}
              className="inline-block"
              style={{ transformOrigin: 'bottom' }}
            >
              {char}
            </motion.span>
          ))}
          {wi < text.split(' ').length - 1 && <span>{'\u00A0'}</span>}
        </span>
      ))}
    </motion.span>
  );
}

/* ─── Floating 3D Dashboard Mockup (CSS-only) ─── */
function DashboardMockup() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(-6deg) rotateY(14deg)');

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`rotateX(${-y * 20 - 6}deg) rotateY(${x * 20 + 14}deg)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('rotateX(-6deg) rotateY(14deg)');
  }, []);

  return (
    <div
      ref={cardRef}
      className="float-3d relative mx-auto w-full max-w-[520px] cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow behind */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-60 blur-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(0,180,216,0.3), rgba(255,107,53,0.2))' }}
      />

      {/* Card */}
      <motion.div
        className="float-3d-inner relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/90 shadow-2xl"
        style={{ transform }}
        initial={{ opacity: 0, y: 60, rotateX: -20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/70" />
            <div className="size-3 rounded-full bg-amber-500/70" />
            <div className="size-3 rounded-full bg-emerald-500/70" />
          </div>
          <div className="ml-4 h-2 w-24 rounded-full bg-white/10" />
        </div>

        {/* Dashboard content */}
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Assets', val: '12.4K', color: 'from-teal-500/20 to-cyan-500/5' },
              { label: 'Custody', val: '98%', color: 'from-orange-500/20 to-amber-500/5' },
              { label: 'Uptime', val: '99.9%', color: 'from-emerald-500/20 to-green-500/5' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg bg-gradient-to-br ${s.color} p-3 border border-white/5`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-lg font-bold text-white">{s.val}</p>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-2.5 w-20 rounded-full bg-white/10" />
              <div className="h-2.5 w-12 rounded-full bg-white/5" />
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: i > 8 ? 'linear-gradient(to top, #FF6B35, #FF6B35aa)' : 'linear-gradient(to top, #00B4D8, #00B4D8aa)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: 1 + i * 0.06, ease: 'easeOut' }}
                />
              ))}
            </div>
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {['Asset #MME-4821 assigned to John', 'Calibration due on PR-992', 'PPE Helmet issued to Site-A'].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-md bg-white/[0.03] px-3 py-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.15 }}
              >
                <div className="size-2 rounded-full bg-teal-400" />
                <div className="h-2 flex-1 rounded-full bg-white/10" style={{ width: `${60 + i * 15}%` }} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Glass edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.div>
    </div>
  );
}

/* ─── Main Hero Section ─── */
export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  /* Mouse spotlight tracking */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty('--mouse-x', `${e.clientX}px`);
      el.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-hero-gradient"
    >
      {/* ── Background Layers ── */}

      {/* Massive gradient orbs */}
      <div className="glow-orb glow-orb-teal -top-[20%] -left-[10%]" />
      <div className="glow-orb glow-orb-orange top-[30%] -right-[10%]" />
      <div className="glow-orb glow-orb-purple top-[60%] left-[20%]" />

      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Mouse spotlight */}
      <div className="spotlight-bg" />

      {/* Bottom gradient fade to next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-primary-dark)] to-transparent" />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* LEFT: Text */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-4 py-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-teal opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-teal" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-teal">
                Asset Intelligence Platform
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-text-primary sm:text-6xl md:text-7xl lg:text-[5.2rem]">
              <AnimatedHeadline text="Track Everything." className="block" />
              <span className="block mt-1">
                <AnimatedHeadline
                  text="Command Anything."
                  className="gradient-text"
                />
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-text-secondary lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Real-time asset tracking, custody management, and compliance monitoring 
              — all from one powerful dashboard. Built for operations that never sleep.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <MagneticButton>
                <Button
                  size="lg"
                  asChild
                  className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-6 text-base font-bold text-white shadow-[0_0_30px_rgba(0,180,216,0.35)] transition-all hover:shadow-[0_0_50px_rgba(0,180,216,0.5)] hover:brightness-110"
                >
                  <Link href="/auth/register" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </MagneticButton>

              <MagneticButton>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="rounded-full border-primary-light bg-primary-navy/60 px-8 py-6 text-base font-semibold text-text-primary backdrop-blur-sm transition-all hover:border-accent-teal/50 hover:bg-primary-slate"
                >
                  <Link href="/contact">Talk to Sales</Link>
                </Button>
              </MagneticButton>
            </motion.div>

            {/* Trust microcopy */}
            <motion.p
              className="mt-6 text-sm text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              No credit card required · Free 14-day trial · Setup in minutes
            </motion.p>
          </div>

          {/* RIGHT: 3D Mockup */}
          <div className="relative flex items-center justify-center">
            <DashboardMockup />
          </div>
        </div>

        {/* ── Bottom Stats Strip ── */}
        <motion.div
          className="hero-stat-strip absolute bottom-0 left-0 right-0 border-t border-primary-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-6 py-5 sm:gap-12 md:gap-16">
            {heroStats.map((stat, i) => {
              const Icon = statIcons[i];
              const isSpecial = stat.label === 'Support';
              return (
                <motion.div
                  key={stat.label}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg border border-primary-light bg-primary-slate">
                    <Icon className="size-4 text-accent-teal" />
                  </div>
                  <div>
                    <div className="text-lg font-bold tabular-nums text-text-primary">
                      {isSpecial ? stat.display : <CountUp end={stat.value} suffix={stat.suffix || ''} decimals={stat.value % 1 !== 0 ? 1 : 0} delay={1.5 + i * 0.15} />}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Scroll</span>
          <ChevronDown className="scroll-indicator size-4 text-text-muted" />
        </motion.div>
      </div>
    </section>
  );
}
