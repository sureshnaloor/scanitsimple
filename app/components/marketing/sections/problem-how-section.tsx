'use client';

import { motion } from 'framer-motion';
import {
  PackageSearch,
  AlertTriangle,
  Shuffle,
  Wrench,
  Tag,
  ScanLine,
  MousePointerClick,
  LayoutDashboard,
  HardHat,
  Forklift,
  ClipboardCheck,
  UserCog,
  ArrowRight,
} from 'lucide-react';
import { SectionHeader } from '../section-header';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

const PAINS = [
  {
    icon: PackageSearch,
    title: 'Hoarding & Underutilization',
    desc: 'Operations managers lack visibility into what exists and where — leading to duplicate tool purchases while equipment sits idle on another site.',
  },
  {
    icon: AlertTriangle,
    title: 'Compliance & Calibration Lapses',
    desc: 'Expired calibration on critical gauges and machinery results in regulatory fines, quality failures and genuine safety hazards.',
  },
  {
    icon: Shuffle,
    title: 'Undocumented Custody Handovers',
    desc: 'Assets move between warehouse staff, camp offices and multiple project sites with no clear traceability — causing lost or stolen equipment.',
  },
  {
    icon: Wrench,
    title: 'The Reactive Maintenance Cycle',
    desc: 'Missing maintenance logs lead to unexpected breakdowns, delayed projects and high emergency repair costs.',
  },
];

const IMPACTS = [
  ['Lost tools & PPE', '$50K+ in annual replacement costs', 'Delays in task execution'],
  ['Calibration expiry', 'Up to $100K in regulatory fines', 'Quality rejection · safety hazards'],
  ['Machine downtime', '$5K–$20K per hour of downtime', 'Missed project milestones'],
  ['Manual audits', '100+ man-hours wasted per month', 'Human error & obsolete paper logs'],
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          label="The field reality"
          headline="Untracked assets are quietly draining your projects"
          subheadline="On a live project, thousands of tools, machines and instruments move every day between warehouses, camps and sites. Paper logs and spreadsheets simply cannot keep up — and the costs compound silently."
          align="left"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p, i) => (
            <motion.div
              key={p.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="service-card group"
            >
              <div className="icon-chip">
                <p.icon size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-epc-primary">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-body">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Impact table */}
        <motion.div {...reveal} className="mt-16 overflow-hidden border border-line shadow-card">
          <div className="bg-epc-primary px-6 py-4">
            <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
              What inefficiency costs your business
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-mist font-display text-xs font-bold uppercase tracking-wider text-epc-primary">
                  <th className="px-6 py-4">Pain Point</th>
                  <th className="px-6 py-4">Financial Impact</th>
                  <th className="px-6 py-4">Operational Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-body">
                {IMPACTS.map(([a, b, c]) => (
                  <tr key={a} className="transition-colors hover:bg-mist/60">
                    <td className="px-6 py-4 font-semibold text-navy">{a}</td>
                    <td className="px-6 py-4">{b}</td>
                    <td className="px-6 py-4">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Tag,
    step: '01',
    title: 'Tag It',
    desc: 'Attach a durable, uniquely coded SmartTagScan QR label to every tool, machine and instrument. Batch-generate branded, print-ready labels from the register.',
  },
  {
    icon: ScanLine,
    step: '02',
    title: 'Scan It',
    desc: 'Any smartphone becomes an enterprise scanner — no client installs, no special hardware. The native camera or browser opens the asset record instantly.',
  },
  {
    icon: MousePointerClick,
    step: '03',
    title: 'Act On It',
    desc: 'Role-based actions right from the scan: transfer custody, upload a calibration certificate, log damage, issue PPE — each action tied to a badge number.',
  },
  {
    icon: LayoutDashboard,
    step: '04',
    title: 'Control Everything',
    desc: 'Every scan feeds a live operations dashboard: asset distribution, status, upcoming expiries and a complete audit trail — in one clean timeline.',
  },
];

const ROLES = [
  {
    icon: HardHat,
    role: 'Field Operators',
    access: 'Read-only status, operating condition, safety checks and manuals.',
    a: '#074E84',
  },
  {
    icon: Forklift,
    role: 'Warehouse & Logistics',
    access: 'Transfer custody, update rack / bin coordinates, log returned materials.',
    a: '#2380C6',
  },
  {
    icon: ClipboardCheck,
    role: 'Auditors & Safety Officers',
    access: 'Full calibration certificates, PO documents and compliance records.',
    a: '#E8A020',
  },
  {
    icon: UserCog,
    role: 'Administrators',
    access: 'Complete CRUD control, user management and authorization approvals.',
    a: '#0E9F8A',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-mist py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          label="How it works"
          headline="From label to live intelligence in four steps"
          subheadline="SmartTagScan bridges the gap between physical assets and a secure, centralized database — connecting every scan to the right person, the right data and the right action."
          align="left"
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="service-card group relative bg-white"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="icon-chip mb-0">
                  <s.icon size={24} />
                </div>
                <span className="font-display text-4xl font-extrabold text-line">{s.step}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-epc-primary">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-body">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  size={18}
                  className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-epc-secondary xl:block"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Role-based access panel */}
        <motion.div {...reveal} className="mt-16 bg-navy p-8 shadow-cardhover sm:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow !text-gold">Role-based authorization</div>
              <h3 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
                One scan. Four different views.
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/70">
              SmartTagScan protects sensitive operational data by serving user-specific detail the
              moment a QR code is scanned — everyone sees exactly what their clearance allows.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div
                key={r.role}
                className="border border-white/10 bg-white/5 p-5 transition-colors hover:border-gold/50"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: r.a }}
                >
                  <r.icon size={20} />
                </div>
                <div className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  {r.role}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{r.access}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
