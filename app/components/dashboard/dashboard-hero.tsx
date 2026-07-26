'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeUp } from '@/app/components/marketing/fade-up';
import { AnimatedMeshBackground } from '@/app/components/effects/animated-mesh-background';
import { Button } from '@/components/ui/button';

interface DashboardHeroProps {
  onRefresh?: () => void;
  loading?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHero({ onRefresh, loading }: DashboardHeroProps) {
  const [time, setTime] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setGreeting(getGreeting());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary-light">
      <AnimatedMeshBackground intensity="subtle" />
      <div className="grid-pattern absolute inset-0 opacity-30" />
      <div className="relative z-10 px-6 py-10 md:px-10 md:py-12">
        <FadeUp>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <motion.span
              className="inline-block rounded-full border border-accent-teal px-4 py-1.5 text-caption uppercase tracking-[0.05em] text-accent-teal"
              whileHover={{ scale: 1.05 }}
            >
              Asset Intelligence Dashboard
            </motion.span>
            <span className="font-mono text-sm text-text-muted">{time}</span>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-h2 mb-2">
                {greeting}. Every Asset. Total Control.
              </h1>
              <p className="max-w-2xl text-body-ds">
                Monitor and manage all your assets in one place — live counts, custody coverage,
                calibrations, and recent activity across MME and fixed assets.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="cta-secondary"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="gap-2"
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : { rotate: 0 }}
                  transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                >
                  <RefreshCw className="size-4" />
                </motion.div>
                Refresh Data
              </Button>
              <Button variant="cta" size="sm" asChild>
                <Link href="/search">Scan QR</Link>
              </Button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
