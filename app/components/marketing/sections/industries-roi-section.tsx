'use client';

import { motion } from 'framer-motion';
import {
  Upload,
  Users,
  Printer,
  ScanLine,
  HardHat,
  Flame,
  Gauge,
  HeartPulse,
  Building2,
  Server,
} from 'lucide-react';
import { SectionHeader } from '../section-header';
import { QRMatrix } from './hero-section';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

const INDUSTRIES = [
  {
    icon: HardHat,
    name: 'Construction & EPC',
    tag: 'Heavy Civil & Infrastructure',
    desc: 'Concrete mixers, surveying gear and power tools tracked across remote project WBS structures.',
  },
  {
    icon: Flame,
    name: 'Oil, Gas & Energy',
    tag: 'Upstream & Refineries',
    desc: 'Certified safety valves, pressure gauges and high-value rigs on strictly scheduled calibrations.',
  },
  {
    icon: Gauge,
    name: 'Calibration Laboratories',
    tag: 'Precision Metrology',
    desc: 'Direct validation of instrument logs, certificates and calibration company records.',
  },
  {
    icon: HeartPulse,
    name: 'Healthcare & Medical',
    tag: 'Clinical Compliance',
    desc: 'Medical devices and diagnostic equipment with traceable service and compliance histories.',
  },
  {
    icon: Building2,
    name: 'Hospitality & Facilities',
    tag: 'Camp & Real Estate',
    desc: 'Furniture, fixtures and camp resources mapped to rooms, floors and occupants.',
  },
  {
    icon: Server,
    name: 'IT & Server Assets',
    tag: 'Enterprise Infrastructure',
    desc: 'Electronics, servers and network gear with custody chains for every handover.',
  },
];

const ROI = [
  {
    value: '99%',
    label: 'Loss Reduction',
    note: 'Employee-level custody accountability ends lost & hoarded tools.',
  },
  {
    value: 'Zero',
    label: 'Calibration Lapses',
    note: 'Automated schedules and alerts keep compliance permanent.',
  },
  {
    value: '25%',
    label: 'Capex Savings',
    note: 'Sharing assets across projects kills duplicate purchasing & rentals.',
  },
  {
    value: '100%',
    label: 'Audit Readiness',
    note: 'Certificates, POs and custodian logs — digitized and instant.',
  },
];

const ONBOARD = [
  {
    icon: Upload,
    step: 'Step 1',
    title: 'Import Data',
    desc: 'Clean CSV / Excel templates and a bulk upload engine migrate thousands of legacy asset numbers in hours.',
  },
  {
    icon: Users,
    step: 'Step 2',
    title: 'Define Roles',
    desc: 'Assign admins, set user clearances and map warehouse, site and camp locations to your org structure.',
  },
  {
    icon: Printer,
    step: 'Step 3',
    title: 'Print & Tag',
    desc: 'Standard label layouts with your logo, asset code and scannable QR — printed on durable field-grade stock.',
  },
  {
    icon: ScanLine,
    step: 'Step 4',
    title: 'Scan & Go',
    desc: 'Train the warehouse team in a morning. Every scan lands on live feeds from day one.',
  },
];

export function IndustriesRoiSection() {
  return (
    <>
      {/* Industries */}
      <section id="industries" className="bg-mist py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            label="Built to scale across industries"
            headline="One platform, every asset-heavy operation"
            subheadline="SmartTagScan adapts its registers, fields and workflows to the asset category — not the other way around."
            align="left"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((ind, i) => (
              <motion.div
                key={ind.name}
                {...reveal}
                transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }}
                className="group relative overflow-hidden bg-navy p-8 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-cardhover"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 70px)',
                  }}
                />
                <div className="relative z-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gold ring-1 ring-white/15 transition-all duration-500 group-hover:bg-gold group-hover:text-ink group-hover:ring-gold">
                      <ind.icon size={26} />
                    </div>
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
                      {ind.tag}
                    </span>
                  </div>
                  <div className="mb-3 h-0.5 w-10 bg-gold transition-all duration-500 group-hover:w-16" />
                  <h3 className="font-display text-xl font-bold text-white">{ind.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/75">{ind.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Band */}
      <section className="bg-denim relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 90px)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHeader
            dark
            align="center"
            label="The ROI of SmartTagScan"
            headline="Accountability you can measure"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROI.map((r, i) => (
              <motion.div
                key={r.label}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="border border-white/10 bg-white/5 p-7 text-center transition-colors hover:border-gold/50"
              >
                <div className="font-display text-5xl font-extrabold text-gold">{r.value}</div>
                <div className="mt-2 font-display text-sm font-bold uppercase tracking-wider text-white">
                  {r.label}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">{r.note}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            {...reveal}
            className="mx-auto mt-12 max-w-2xl text-center font-display text-xl font-semibold text-white"
          >
            “No more lost spreadsheets. No more expired compliance. No more unaccounted project
            equipment.”
          </motion.p>
        </div>
      </section>

      {/* Onboarding & Deployment */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div {...reveal}>
              <div className="eyebrow mb-5">Onboarding &amp; deployment</div>
              <h2 className="bordered-heading text-3xl sm:text-4xl">
                Go live in days, not months
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-body">
                A clean import pipeline, pre-designed QR label standards and zero client installs
                mean your teams are scanning before the week is out.
              </p>

              {/* Branded Field Label Visual Card */}
              <div className="relative mt-8">
                <div className="absolute -left-5 -top-5 h-28 w-28 border-8 border-gold/70" />
                <div className="relative border border-line bg-navy p-7 text-white shadow-cardhover">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                        Field-Grade Asset Label
                      </div>
                      <div className="mt-1 font-display text-lg font-extrabold text-white">
                        EPCORA · SmartTagScan
                      </div>
                    </div>
                    <span className="bg-gold px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-ink">
                      ISO / IP68 Rated
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-6">
                    <div className="rounded bg-white p-2.5">
                      <QRMatrix className="h-24 w-24" module={4} fg="#05052D" />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="font-mono text-sm font-bold text-gold">ID: MME-2041</div>
                      <div className="font-semibold text-white">CAT 320 Hydraulic Excavator</div>
                      <div className="text-white/65">Plant &amp; Machinery · Site Alpha</div>
                      <div className="pt-1 font-mono text-[10px] uppercase tracking-widest text-epc-secondary">
                        Scan with any camera
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-5">
              {ONBOARD.map((s, i) => (
                <motion.div
                  key={s.step}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: i * 0.08 }}
                  className="service-card group flex items-start gap-5 border border-line !p-6"
                >
                  <div className="icon-chip mb-0 shrink-0">
                    <s.icon size={22} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-golddeep">
                      {s.step}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold text-epc-primary">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-body">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
