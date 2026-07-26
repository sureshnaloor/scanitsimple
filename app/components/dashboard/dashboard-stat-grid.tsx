'use client';

import { Box, Users, Wrench, AlertTriangle, LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CountUp } from '@/app/components/effects/count-up';
import { TiltCard } from '@/app/components/effects/tilt-card';
import type { DashboardOverviewResponse } from '@/types/dashboard';

interface DashboardStatGridProps {
  overview: DashboardOverviewResponse | null;
  loading: boolean;
}

const statConfig: {
  key: string;
  label: string;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
  getValue: (o: DashboardOverviewResponse) => string;
  getSub: (o: DashboardOverviewResponse) => string;
  getNumericValue: (o: DashboardOverviewResponse) => number;
}[] = [
  {
    key: 'total',
    label: 'Total Assets',
    icon: Box,
    trend: 'up',
    getValue: (o) => o.summary.totalAssets.toLocaleString(),
    getSub: (o) =>
      `${o.summary.assetsAddedThisMonth} added this month · ${o.summary.mmeCount} MME / ${o.summary.fixedAssetCount} fixed`,
    getNumericValue: (o) => o.summary.totalAssets,
  },
  {
    key: 'custody',
    label: 'In Custody',
    icon: Users,
    trend: 'up',
    getValue: (o) => o.summary.assetsInCustody.toLocaleString(),
    getSub: (o) => `${o.summary.custodyPercent}% of registered assets have active custody`,
    getNumericValue: (o) => o.summary.assetsInCustody,
  },
  {
    key: 'due',
    label: 'Calibrations Due',
    icon: Wrench,
    trend: 'down',
    getValue: (o) => String(o.summary.calibrationsDueSoon),
    getSub: () => 'Certificates expiring within 30 days',
    getNumericValue: (o) => o.summary.calibrationsDueSoon,
  },
  {
    key: 'expired',
    label: 'Expired Calibrations',
    icon: AlertTriangle,
    trend: 'down',
    getValue: (o) => String(o.summary.expiredCalibrations),
    getSub: () => 'Assets with past certificate end dates',
    getNumericValue: (o) => o.summary.expiredCalibrations,
  },
];

function Sparkline({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  const points = trend === 'up'
    ? '0,20 10,18 20,15 30,16 40,12 50,10 60,8'
    : trend === 'down'
    ? '0,8 10,10 20,12 30,11 40,15 50,17 60,20'
    : '0,14 10,13 20,14 30,13 40,14 50,13 60,14';

  const color = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#64748B';

  return (
    <svg width="60" height="24" viewBox="0 0 60 24" className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardStatGrid({ overview, loading }: DashboardStatGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, trend, getValue, getSub, getNumericValue }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] }}
        >
          <TiltCard tiltAmount={8} className="h-full">
            <div className="glass-card group p-6 transition-all duration-300 hover:border-accent-teal/30 hover:shadow-glow-teal h-full">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-caption uppercase tracking-wider text-text-muted">{label}</span>
                <div className="flex items-center gap-2">
                  {!loading && overview && <Sparkline trend={trend} />}
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-teal/20 to-accent-teal/5">
                    <Icon className="size-5 text-accent-teal" />
                  </div>
                </div>
              </div>
              {loading ? (
                <Skeleton className="mb-2 h-10 w-24" />
              ) : (
                <div className="text-3xl font-extrabold tabular-nums tracking-tight text-accent-teal md:text-4xl">
                  {overview ? (
                    <CountUp
                      end={getNumericValue(overview)}
                      delay={0.2 + i * 0.1}
                    />
                  ) : (
                    '—'
                  )}
                </div>
              )}
              <p className="mt-2 text-body-sm-ds">
                {loading ? 'Loading…' : overview ? getSub(overview) : '—'}
              </p>
              {key === 'total' && !loading && overview && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="live-dot" />
                  <span className="text-xs text-text-muted">Live data</span>
                </div>
              )}
            </div>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  );
}
