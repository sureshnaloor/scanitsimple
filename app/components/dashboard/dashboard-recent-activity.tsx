'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { DashboardOverviewResponse } from '@/types/dashboard';

interface DashboardRecentActivityProps {
  overview: DashboardOverviewResponse | null;
  loading: boolean;
}

function fmtDateTime(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
}

export function DashboardRecentActivity({ overview, loading }: DashboardRecentActivityProps) {
  const items = [
    ...(overview?.recentCustody?.slice(0, 4).map((row, idx) => ({
      id: `custody-${row.assetnumber}-${idx}`,
      title: `${row.employeename || 'Unknown'} assigned ${row.assetnumber}`,
      subtitle: [row.locationType, row.location].filter(Boolean).join(' · ') || 'Custody assignment',
      time: fmtDateTime(row.custodyfrom),
      status: 'active' as const,
      href: `/asset/${row.assetnumber}`,
    })) ?? []),
    ...(overview?.recentPpe?.slice(0, 3).map((r) => ({
      id: `ppe-${r._id}`,
      title: `${r.ppeName} issued to ${r.userEmpName}`,
      subtitle: `Qty ${r.quantityIssued} · ${r.userEmpNumber}`,
      time: fmtDateTime(r.dateOfIssue),
      status: 'pending' as const,
      href: '/ppe-issue-records',
    })) ?? []),
    ...(overview?.upcomingCalibrations?.slice(0, 3).map((c, i) => ({
      id: `cal-${c.assetnumber}-${i}`,
      title: `Calibration due: ${c.assetdescription || c.assetnumber}`,
      subtitle: c.calibratedby ? `Last by ${c.calibratedby}` : 'Certificate expiry approaching',
      time: c.calibrationtodate
        ? new Date(c.calibrationtodate).toLocaleDateString(undefined, { dateStyle: 'medium' })
        : '—',
      status: 'inactive' as const,
      href: `/asset/${c.assetnumber}#calibration`,
    })) ?? []),
  ].slice(0, 8);

  return (
    <div className="glass-card flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-h4">Recent Activity</h3>
          <p className="text-body-sm-ds">Latest custody, PPE, and calibration events</p>
        </div>
        <Link href="/search" className="text-sm text-accent-teal hover:underline">
          View all
        </Link>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {loading ? (
          <p className="text-sm text-text-muted">Loading activity…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">No recent activity found.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start gap-3 rounded-lg border border-primary-light/50 bg-primary-slate/50 p-3 transition-colors hover:border-accent-teal/30 hover:bg-primary-slate"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-teal/15 text-xs font-bold text-accent-teal">
                {item.title.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                  <Badge variant={item.status} className="shrink-0 normal-case">
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-text-muted">{item.subtitle}</p>
                <p className="mt-1 text-caption text-text-muted">{item.time}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
