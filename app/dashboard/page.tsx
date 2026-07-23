'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ArrowRight } from 'lucide-react';
import { AssetStatusChart } from '@/app/components/dashboard/asset-status-chart';
import { AssetTypeDistribution } from '@/app/components/dashboard/asset-type-distribution';
import { MaintenanceSchedule } from '@/app/components/dashboard/maintenance-schedule';
import { DashboardShell } from '@/app/components/dashboard/DashboardShell';
import { DashboardHero } from '@/app/components/dashboard/dashboard-hero';
import { DashboardStatGrid } from '@/app/components/dashboard/dashboard-stat-grid';
import { DashboardRecentActivity } from '@/app/components/dashboard/dashboard-recent-activity';
import { QuickActions } from '@/app/components/dashboard/quick-actions';
import { SectionHeader } from '@/app/components/marketing/section-header';
import { Button } from '@/components/ui/button';
import type { DashboardOverviewResponse } from '@/types/dashboard';

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch('/api/dashboard/overview');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load overview');
      }
      setOverview(json as DashboardOverviewResponse);
    } catch (e) {
      setOverview(null);
      setOverviewError(e instanceof Error ? e.message : 'Failed to load overview');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const isLight = resolvedTheme === 'light';
  const chartTheme = isLight ? 'light' : 'dark';
  const chartGrid = isLight ? '#e2e8f0' : 'rgba(148,163,184,0.22)';
  const chartAxis = isLight ? '#64748b' : '#94a3b8';

  const calibrationScheduleItems = useMemo(() => {
    if (!overview?.upcomingCalibrations?.length) return [];
    return overview.upcomingCalibrations.map((c, i) => ({
      id: `${c.assetnumber}-${i}`,
      asset: (c.assetdescription && c.assetdescription.trim()) || `Asset ${c.assetnumber}`,
      subtitle: c.calibratedby
        ? `Certificate valid to · Last calibrated by ${c.calibratedby}`
        : 'Upcoming certificate expiry',
      dateLabel: c.calibrationtodate
        ? new Date(c.calibrationtodate).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : '—',
      status: 'scheduled' as const,
    }));
  }, [overview]);

  const fmtDateTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : '—';

  return (
    <DashboardShell title="Dashboard">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        <DashboardHero onRefresh={loadOverview} loading={overviewLoading} />

        {overviewError && (
          <div className="glass-card flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-error">
            {overviewError}
            <Button variant="cta-secondary" size="sm" onClick={loadOverview}>
              Retry
            </Button>
          </div>
        )}

        <section className="space-y-4">
          <SectionHeader
            label="Asset Overview"
            headline="Live asset metrics"
            subheadline="Real-time counts from equipment, tools, and fixed assets with custody coverage."
            align="left"
            className="!mx-0 !max-w-none !text-left mb-0"
          />
          <DashboardStatGrid overview={overview} loading={overviewLoading} />
        </section>

        <QuickActions />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-h4">Asset Status</h3>
                <p className="text-body-sm-ds">Counts by status across both registers</p>
              </div>
            </div>
            <AssetStatusChart
              data={overview?.assetStatus ?? []}
              gridStroke={chartGrid}
              axisStroke={chartAxis}
            />
          </div>
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-h4">Assets by Category</h3>
              <p className="text-body-sm-ds">Merged distribution from MME and fixed assets</p>
            </div>
            <AssetTypeDistribution
              segments={overview?.assetTypeDistribution ?? []}
              theme={chartTheme}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DashboardRecentActivity overview={overview} loading={overviewLoading} />
          </div>
          <div className="glass-card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-h4">Upcoming Maintenance</h3>
                <p className="text-body-sm-ds">Calibration expiries — soonest first</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports/expired-calibrations" className="gap-1">
                  Schedule <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
            <MaintenanceSchedule
              items={calibrationScheduleItems}
              titleClass="text-sm font-medium text-text-primary"
              mutedClass="text-xs text-text-muted"
              borderClass="border-primary-light/50"
              rowBgClass="border-primary-light/50 bg-primary-slate/50"
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            label="Operations Feed"
            headline="Latest transactions"
            subheadline="Recent PPE issues and project return materials."
            align="left"
            className="!mx-0 !max-w-none !text-left mb-0"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="text-h4 mb-4">Latest PPE Issues</h3>
              <div className="space-y-2">
                {overviewLoading ? (
                  <p className="text-sm text-text-muted">Loading…</p>
                ) : overview?.recentPpe?.length ? (
                  overview.recentPpe.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-lg border border-primary-light/50 bg-primary-slate/50 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium text-text-primary">{r.ppeName}</p>
                        <span className="text-xs text-text-muted">{fmtDateTime(r.dateOfIssue)}</span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {r.userEmpName} · Qty {r.quantityIssued}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted">No PPE issue records found.</p>
                )}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-h4 mb-4">Project Return Materials</h3>
              <div className="space-y-2">
                {overviewLoading ? (
                  <p className="text-sm text-text-muted">Loading…</p>
                ) : overview?.recentProjectReturns?.length ? (
                  overview.recentProjectReturns.map((m) => (
                    <div
                      key={m.materialid}
                      className="rounded-lg border border-primary-light/50 bg-primary-slate/50 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium text-text-primary">{m.materialDescription}</p>
                        <span className="text-xs text-text-muted">{fmtDateTime(m.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {m.materialCode} · Qty {m.quantity} {m.uom}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted">No return material rows found.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
