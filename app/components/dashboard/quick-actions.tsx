'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, Plus, FileText, Calendar } from 'lucide-react';
import { MagneticButton } from '@/app/components/effects/magnetic-button';

const actions = [
  { icon: Camera, label: 'Scan QR', href: '/search', color: 'from-teal-500/20 to-cyan-500/10' },
  { icon: Plus, label: 'Add Asset', href: '/mme', color: 'from-orange-500/20 to-amber-500/10' },
  { icon: FileText, label: 'Generate Report', href: '/reports/active-calibrations', color: 'from-blue-500/20 to-indigo-500/10' },
  { icon: Calendar, label: 'Schedule Maintenance', href: '/reports/expired-calibrations', color: 'from-green-500/20 to-emerald-500/10' },
];

export function QuickActions() {
  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <span className="mb-2 inline-block text-caption uppercase tracking-[0.05em] text-accent-teal">
          Quick Actions
        </span>
        <h3 className="text-h4">Get things done faster</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map(({ icon: Icon, label, href, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
          >
            <MagneticButton strength={0.2} className="w-full">
              <Link
                href={href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-accent-teal/20 hover:bg-primary-slate w-full"
              >
                <motion.div
                  className={`flex size-14 items-center justify-center rounded-full bg-gradient-to-br ${color} transition-all group-hover:shadow-glow-teal`}
                  whileHover={{ scale: 1.1 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ y: { duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' } }}
                >
                  <Icon className="size-6 text-accent-teal" />
                </motion.div>
                <span className="text-center text-xs font-semibold text-text-secondary group-hover:text-text-primary">
                  {label}
                </span>
              </Link>
            </MagneticButton>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
