'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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

const statusConfig = {
  active: { color: 'bg-green-500', label: 'Active' },
  pending: { color: 'bg-amber-500', label: 'Pending' },
  inactive: { color: 'bg-red-500', label: 'Inactive' },
};

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
        <Link href="/search" className="text-sm text-accent-teal hover:underline transition-colors">
          View all
        </Link>
      </div>
      <div className="relative flex-1">
        {/* Timeline line */}
        <div className="absolute left-[17px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-accent-teal/40 via-accent-teal/20 to-transparent" />

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-text-muted">Loading activity…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-text-muted">No recent activity found.</p>
          ) : (
            items.map((item, i) => {
              const status = statusConfig[item.status];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg border border-primary-light/50 bg-primary-slate/50 p-3 transition-all hover:border-accent-teal/30 hover:bg-primary-slate hover:shadow-sm"
                  >
                    {/* Timeline dot */}
                    <div className="relative mt-1.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-teal/15">
                      <span className="text-xs font-bold text-accent-teal">
                        {item.title.charAt(0)}
                      </span>
                      <div className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-primary-slate ${status.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text-primary group-hover:text-accent-teal transition-colors">
                          {item.title}
                        </p>
                        <Badge variant={item.status} className="shrink-0 normal-case">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{item.subtitle}</p>
                      <p className="mt-1 text-caption text-text-muted">{item.time}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
