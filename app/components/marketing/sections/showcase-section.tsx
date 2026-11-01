'use client';

import { motion } from 'framer-motion';
import {
  BadgeCheck,
  MapPin,
  CalendarCheck,
  ArrowRightLeft,
  TriangleAlert,
  FileText,
  GaugeCircle,
  Warehouse,
  HardHat,
  CornerDownRight,
} from 'lucide-react';
import { SectionHeader } from '../section-header';
import { QRMatrix } from './hero-section';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

/* ---- Mock 1: scan result card ---- */
function ScanResultMock() {
  return (
    <div className="border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-epc-secondary">
            Scanned Asset Profile
          </div>
          <h4 className="mt-2 font-display text-xl font-bold text-epc-primary">
            MME-2041 · CAT 320 Excavator
          </h4>
          <p className="mt-1 text-xs text-body">
            Heavy Machinery · Purchased PO-88412 · Serial CAT320D2-9917
          </p>
        </div>
        <QRMatrix className="h-16 w-16 shrink-0 rounded border border-line" module={4} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
          Active
        </span>
        <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-epc-primary">
          Calibration valid · 84 days
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
          Service due in 12 days
        </span>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm text-body">
        <div className="flex items-center gap-2.5">
          <BadgeCheck size={15} className="shrink-0 text-epc-secondary" />
          Custodian: <span className="font-semibold text-navy">Emp #1024 · S. Reyes</span> — since 04 Oct 2026
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin size={15} className="shrink-0 text-epc-secondary" />
          Location: <span className="font-semibold text-navy">Site Alpha · WBS-4.1 · Container 4 · Rack 2</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarCheck size={15} className="shrink-0 text-epc-secondary" />
          Next calibration: <span className="font-semibold text-navy">09 Jan 2027 · Gulf Cal Lab</span>
        </div>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-epc-primary px-4 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-epc-secondary"
        >
          <ArrowRightLeft size={13} /> Transfer Custody
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 border-2 border-epc-primary px-4 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-epc-primary transition-colors hover:bg-epc-primary hover:text-white"
        >
          <TriangleAlert size={13} /> Report Damage
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 border-2 border-line px-4 py-3 font-display text-[11px] font-bold uppercase tracking-wider text-body transition-colors hover:border-gold hover:text-golddeep"
        >
          <FileText size={13} /> Certificates
        </button>
      </div>
      <p className="mt-4 text-[11px] text-body/70">
        What you see depends on your role — operators get status &amp; safety info, auditors get the full compliance file.
      </p>
    </div>
  );
}

/* ---- Mock 2: operations dashboard ---- */
const DONUT = [
  { label: 'MME', pct: 38, color: '#074E84' },
  { label: 'Tools', pct: 34, color: '#2380C6' },
  { label: 'PPE', pct: 16, color: '#FCBC45' },
  { label: 'Fixed', pct: 12, color: '#0E9F8A' },
];
const BARS = [
  { label: 'Active', pct: 70, color: '#074E84' },
  { label: 'In-Maintenance', pct: 10, color: '#E8A020' },
  { label: 'Calibrating', pct: 8, color: '#2380C6' },
  { label: 'Idle / Storage', pct: 12, color: '#505E6B' },
];
const EXPIRIES = [
  { id: 'PG-118', name: 'Pressure Gauge', due: '6 days', tone: 'bg-red-100 text-red-700' },
  { id: 'TW-077', name: 'Torque Wrench ½”', due: '12 days', tone: 'bg-amber-100 text-amber-700' },
  { id: 'LC-302', name: 'Crane Load Cell', due: '21 days', tone: 'bg-mist text-epc-primary' },
];

function DashboardMock() {
  const donutGradient = (() => {
    let acc = 0;
    const parts = DONUT.map((d) => {
      const from = acc;
      acc += d.pct;
      return `${d.color} ${from}% ${acc}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  })();

  return (
    <div className="border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-epc-secondary">
            Operations Dashboard
          </div>
          <h4 className="mt-2 font-display text-xl font-bold text-epc-primary">
            Command Center — Live Feed
          </h4>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total Assets', '1,284'],
          ['On Site', '612'],
          ['In Warehouse', '540'],
          ['In Maintenance', '132'],
        ].map(([l, v]) => (
          <div key={l} className="border border-line bg-mist/60 px-4 py-3.5">
            <div className="font-display text-2xl font-extrabold text-epc-primary">{v}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-body">
              {l}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Donut */}
        <div className="flex items-center gap-5">
          <div
            className="relative h-36 w-36 shrink-0 rounded-full"
            style={{ backgroundImage: donutGradient }}
          >
            <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-white">
              <span className="font-display text-lg font-extrabold text-epc-primary">1,284</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-body">
                assets
              </span>
            </div>
          </div>
          <ul className="space-y-1.5">
            {DONUT.map((d) => (
              <li key={d.label} className="flex items-center gap-2 text-xs text-body">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                {d.label} <span className="font-semibold text-navy">{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bars */}
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-body">
            Asset Status
          </div>
          <div className="space-y-2.5">
            {BARS.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[11px] text-body">{b.label}</span>
                <div className="h-3.5 flex-1 bg-mist">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                    className="h-full"
                    style={{ backgroundColor: b.color }}
                  />
                </div>
                <span className="w-9 text-right text-[11px] font-semibold text-navy">
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>

          {/* Upcoming expiries */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-body">
              <GaugeCircle size={12} className="text-golddeep" /> Upcoming Calibrations — next 30 days
            </div>
            <ul className="space-y-2">
              {EXPIRIES.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-body">
                    <span className="font-semibold text-navy">{e.id}</span> · {e.name}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${e.tone}`}>
                    {e.due}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Mock 3: custody timeline ---- */
const TRAIL = [
  {
    icon: Warehouse,
    where: 'Central Warehouse · Rack A-02 · Bin 14',
    what: 'Checked out by Emp #1024 · S. Reyes',
    meta: '04 Oct 2026, 07:42 · Supervisor approved',
    a: '#074E84',
  },
  {
    icon: HardHat,
    where: 'Project Site Alpha · WBS-4.1 · Container 4',
    what: 'Transfer scan — custody accepted on site',
    meta: '04 Oct 2026, 09:15 · Condition: Good',
    a: '#2380C6',
  },
  {
    icon: CornerDownRight,
    where: 'Returned to Central Warehouse',
    what: 'Return logged with quantity & UOM check',
    meta: '18 Oct 2026, 16:03 · Condition: Good',
    a: '#0E9F8A',
  },
];

function CustodyMock() {
  return (
    <div className="border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-epc-secondary">
        Custody Chain
      </div>
      <h4 className="mt-2 font-display text-xl font-bold text-epc-primary">
        Every handover, on the record
      </h4>
      <p className="mt-1 text-xs text-body">
        Historical custody log for MME-2041 — employee-verified at every step.
      </p>

      <div className="mt-6 space-y-0">
        {TRAIL.map((t, i) => (
          <div key={t.where} className="relative flex gap-4 pb-6 last:pb-0">
            {i < TRAIL.length - 1 && (
              <span className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 bg-line" />
            )}
            <span
              className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: t.a }}
            >
              <t.icon size={18} />
            </span>
            <div className="pt-1">
              <div className="font-display text-sm font-bold text-epc-primary">{t.where}</div>
              <div className="mt-0.5 text-[13px] text-body">{t.what}</div>
              <div className="mt-0.5 text-[11px] text-body/60">{t.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-[11px] text-body/70">
        <BadgeCheck size={13} className="text-emerald-600" />
        Legally &amp; operationally accountable — the last custodian is always known.
      </div>
    </div>
  );
}

export function ShowcaseSection() {
  return (
    <section id="showcase" className="scroll-mt-24 bg-mist py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          label="See it in action"
          headline="Scan. See. Decide."
          subheadline="A walkthrough of the screens your teams will use every day — from the field scan to the operations command center."
          align="left"
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div {...reveal}>
            <ScanResultMock />
            <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-body/70">
              01 — The scan result every smartphone gets
            </p>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <CustodyMock />
            <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-body/70">
              02 — The custody trail behind every asset
            </p>
          </motion.div>
        </div>

        <motion.div {...reveal} className="mt-8">
          <DashboardMock />
          <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-body/70">
            03 — The live dashboard behind every decision
          </p>
        </motion.div>
      </div>
    </section>
  );
}
