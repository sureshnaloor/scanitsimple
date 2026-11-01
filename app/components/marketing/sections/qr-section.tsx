'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../section-header';
import { QrDemo } from '../qr-demo';

const features = [
  'Batch QR generation directly from the asset register',
  'Custom branded labels with company logo & asset code',
  'Instant smartphone scan — zero app installs required',
  'Role-aware record routing for operators, logistics & auditors',
];

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function QrSection() {
  return (
    <section id="demo" className="scroll-mt-24 relative overflow-hidden bg-white py-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div {...reveal}>
            <SectionHeader
              label="Instant Access · Try It Live"
              headline="Scan Any Asset. Get Everything."
              subheadline="Every asset gets a unique QR code that provides instant access to its complete information profile. Simply scan with any smartphone to view location, custodian, calibration history, and more."
              align="left"
              className="mb-8"
            />
            <ul className="mb-9 space-y-3.5">
              {features.map((text) => (
                <li key={text} className="check-item">
                  <span className="check-badge">
                    <Check size={11} strokeWidth={3.5} className="text-golddeep" />
                  </span>
                  <span className="text-sm text-navy">{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="btn-primary">
              Open QR Studio in Dashboard <ArrowRight size={17} />
            </Link>
          </motion.div>

          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }}>
            <div className="relative mx-auto max-w-md">
              <div className="absolute -left-5 -top-5 hidden h-28 w-28 border-8 border-gold/70 sm:block" />
              <div className="absolute -bottom-5 -right-5 hidden h-24 w-24 border-8 border-epc-primary/80 sm:block" />
              <QrDemo className="relative z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
