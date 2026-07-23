'use client';

import Link from 'next/link';
import { Zap, Palette, GitBranch } from 'lucide-react';
import { SectionHeader } from '../section-header';
import { QrDemo } from '../qr-demo';
import { FadeUp } from '../fade-up';
import { Button } from '@/components/ui/button';

const icons = { Zap, Palette, GitBranch };

const features = [
  { icon: 'Zap', text: 'Batch QR generation' },
  { icon: 'Palette', text: 'Custom branded codes' },
  { icon: 'GitBranch', text: 'Seamless workflow integration' },
];

export function QrSection() {
  return (
    <section id="demo" className="bg-gradient-to-b from-primary-dark to-primary-navy py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <FadeUp>
            <SectionHeader
              label="Instant Access"
              headline="Scan Any Asset. Get Everything."
              subheadline="Every asset gets a unique QR code that provides instant access to its complete information profile. Simply scan with any smartphone to view location, custodian, maintenance history, and more."
              align="left"
              className="mb-8 !text-left !mx-0"
            />
            <ul className="mb-8 space-y-4">
              {features.map(({ icon, text }) => {
                const Icon = icons[icon as keyof typeof icons];
                return (
                  <li key={text} className="flex items-center gap-3 text-body-ds">
                    <div className="flex size-10 items-center justify-center rounded-full bg-accent-teal/15">
                      <Icon className="size-5 text-accent-teal" />
                    </div>
                    {text}
                  </li>
                );
              })}
            </ul>
            <Button variant="cta-secondary" asChild>
              <Link href="/dashboard">Try QR Generator</Link>
            </Button>
          </FadeUp>
          <FadeUp delay={0.2}>
            <QrDemo />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
