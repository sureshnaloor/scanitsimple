'use client';

import { Box, Users, Wrench, AlertTriangle, LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOverviewResponse } from '@/types/dashboard';

interface DashboardStatGridProps {
  overview: DashboardOverviewResponse | null;
  loading: boolean;
}

const statConfig: {
  key: string;
  label: string;
  icon: LucideIcon;
  getValue: (o: DashboardOverviewResponse) => string;
  getSub: (o: DashboardOverviewResponse) => string;
}[] = [
  {
    key: 'total',
    label: 'Total Assets',
    icon: Box,
    getValue: (o) => o.summary.totalAssets.toLocaleString(),
    getSub: (o) =>
      `${o.summary.assetsAddedThisMonth} added this month · ${o.summary.mmeCount} MME / ${o.summary.fixedAssetCount} fixed`,
  },
  {
    key: 'custody',
    label: 'In Custody',
    icon: Users,
    getValue: (o) => o.summary.assetsInCustody.toLocaleString(),
    getSub: (o) => `${o.summary.custodyPercent}% of registered assets have active custody`,
  },
  {
    key: 'due',
    label: 'Calibrations Due',
    icon: Wrench,
    getValue: (o) => String(o.summary.calibrationsDueSoon),
    getSub: () => 'Certificates expiring within 30 days',
  },
  {
    key: 'expired',
    label: 'Expired Calibrations',
    icon: AlertTriangle,
    getValue: (o) => String(o.summary.expiredCalibrations),
    getSub: () => 'Assets with past certificate end dates',
  },
];

export function DashboardStatGrid({ overview, loading }: DashboardStatGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, getValue, getSub }) => (
        <div
          key={key}
          className="glass-card group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-teal/30 hover:shadow-glow-teal"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-caption uppercase tracking-wider text-text-muted">{label}</span>
            <div className="flex size-10 items-center justify-center rounded-full bg-accent-teal/15">
              <Icon className="size-5 text-accent-teal" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="mb-2 h-10 w-24" />
          ) : (
            <div className="text-3xl font-extrabold tabular-nums tracking-tight text-accent-teal md:text-4xl">
              {overview ? getValue(overview) : '—'}
            </div>
          )}
          <p className="mt-2 text-body-sm-ds">
            {loading ? 'Loading…' : overview ? getSub(overview) : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
