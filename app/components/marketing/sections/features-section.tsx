'use client';

import { motion } from 'framer-motion';
import {
  Database,
  QrCode,
  ShieldCheck,
  Route,
  Gauge,
  Boxes,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { SectionHeader } from '../section-header';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

const FEATURES = [
  {
    icon: Database,
    title: 'Unified Asset Registers',
    desc: 'Separate, highly-customizable registers for Mobile Machinery & Equipment (MME), hand tools & accessories, and fixed assets & camp resources.',
    points: [
      'Serial, manufacturer & status tracking for MME',
      'Cost, PO, supplier & wear condition for tools',
      'Custom fields & subcategories — engine hours, voltage, anything',
    ],
  },
  {
    icon: QrCode,
    title: 'QR Label Studio',
    desc: 'Generate, print and manage QR codes for every asset in your organization — batch generation with your own branding.',
    points: [
      'Batch QR generation from the register',
      'Branded labels with company logo & asset code',
      'Print-ready standard label layouts',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Authorization',
    desc: 'Sensitive operational data is served by security profile the moment a tag is scanned — operators, logistics, auditors and admins each get their own view.',
    points: [
      'Field read-only views with safety manuals',
      'Custody & location actions for warehouse staff',
      'Full certificate & compliance access for auditors',
    ],
  },
  {
    icon: Route,
    title: 'End-to-End Custody Tracking',
    desc: 'Know precisely who has what, and where — multi-tier locations with a complete historical custody log.',
    points: [
      'Warehouse rack / bin / pallet / shed coordinates',
      'Site WBS codes, containers & rack positions',
      'Badge numbers, from–to history & supervisor approvals',
    ],
  },
  {
    icon: Gauge,
    title: 'Smart Calibration Tracking',
    desc: 'Keep measuring instruments and tools permanently inside their calibration windows — compliance that maintains itself.',
    points: [
      'Upcoming calibrations auto-sorted, soonest first',
      '“Idle calibration” pause for assets in storage',
      'Certificate vault: PDFs, PO details & lab logs',
    ],
  },
  {
    icon: Boxes,
    title: 'Material Flows & PPE',
    desc: 'High-turnover consumables stay accounted for with real-time feeds for issuance and returns.',
    points: [
      'PPE issuance by employee, quantity & size',
      'WBS-indexed project return materials with UOM & condition',
      'Live transaction feed prevents double booking',
    ],
  },
  {
    icon: BarChart3,
    title: 'Real-Time Operations Dashboard',
    desc: 'A single pane of glass for operations and logistics — live counts, distributions and expiry timelines.',
    points: [
      'Stat grids: totals, warehouse stock, site allocations',
      'Donut & status charts by category and condition',
      '30 / 60 / 90-day calibration expiry panel',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Agent & Audit-Ready Reports',
    desc: 'Ask questions in plain language, export anything, and walk into every audit already prepared.',
    points: [
      'Built-in AI agent for natural-language queries',
      'Excel / CSV export on every register & report',
      'Digitized certificates, POs & custodian logs on demand',
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          label="Feature deep-dive"
          headline="Everything an asset operation needs — nothing it doesn’t"
          subheadline="Eight tightly-integrated capabilities, engineered from real field workflows on construction & EPC projects."
          align="left"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 4) * 0.08 }}
              className="service-card group flex flex-col border border-line"
            >
              <div className="icon-chip">
                <f.icon size={24} />
              </div>
              <h3 className="font-display text-lg font-bold leading-snug text-epc-primary">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-body">{f.desc}</p>
              <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                {f.points.map((pt) => (
                  <li key={pt} className="check-item">
                    <span className="check-badge">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5.5L4 8L8.5 2.5"
                          stroke="#E8A020"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[13px]">{pt}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
