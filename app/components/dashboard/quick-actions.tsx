'use client';

import Link from 'next/link';
import { Camera, Plus, FileText, Calendar } from 'lucide-react';

const actions = [
  { icon: Camera, label: 'Scan QR', href: '/search' },
  { icon: Plus, label: 'Add Asset', href: '/mme' },
  { icon: FileText, label: 'Generate Report', href: '/reports/active-calibrations' },
  { icon: Calendar, label: 'Schedule Maintenance', href: '/reports/expired-calibrations' },
];

export function QuickActions() {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <span className="mb-2 inline-block text-caption uppercase tracking-[0.05em] text-accent-teal">
          Quick Actions
        </span>
        <h3 className="text-h4">Get things done faster</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center gap-3 rounded-xl border border-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-accent-teal/20 hover:bg-primary-slate"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-accent-teal/15 transition-all group-hover:bg-accent-teal/25 group-hover:shadow-glow-teal">
              <Icon className="size-6 text-accent-teal" />
            </div>
            <span className="text-center text-xs font-semibold text-text-secondary group-hover:text-text-primary">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
