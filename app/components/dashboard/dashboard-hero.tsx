'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { FadeUp } from '@/app/components/marketing/fade-up';
import { Button } from '@/components/ui/button';

interface DashboardHeroProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export function DashboardHero({ onRefresh, loading }: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-hero-gradient grid-pattern border border-primary-light">
      <div className="relative z-10 px-6 py-10 md:px-10 md:py-12">
        <FadeUp>
          <span className="mb-4 inline-block rounded-full border border-accent-teal px-4 py-1.5 text-caption uppercase tracking-[0.05em] text-accent-teal">
            Asset Intelligence Dashboard
          </span>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-h2 mb-2">Every Asset. Total Control.</h1>
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
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
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
