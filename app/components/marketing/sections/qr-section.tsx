'use client';

import Link from 'next/link';
import { Zap, Palette, GitBranch } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { SectionHeader } from '../section-header';
import { QrDemo } from '../qr-demo';
import { FadeUp } from '../fade-up';
import { MagneticButton } from '@/app/components/effects/magnetic-button';
import { Button } from '@/components/ui/button';

const icons = { Zap, Palette, GitBranch };

const features = [
  { icon: 'Zap', text: 'Batch QR generation' },
  { icon: 'Palette', text: 'Custom branded codes' },
  { icon: 'GitBranch', text: 'Seamless workflow integration' },
];

export function QrSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [-15, 15]);

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="relative overflow-hidden bg-primary-navy py-24"
    >
      {/* decorative accent glows */}
      <div
        className="pointer-events-none absolute -left-32 top-1/4 size-[420px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-accent-teal-glow) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 size-[380px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-accent-orange-glow) 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              {features.map(({ icon, text }, i) => {
                const Icon = icons[icon as keyof typeof icons];
                return (
                  <motion.li
                    key={text}
                    className="flex items-center gap-3 text-body-ds"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                  >
                    <motion.div
                      className="flex size-10 items-center justify-center rounded-full bg-accent-teal/15"
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,180,216,0.25)' }}
                    >
                      <Icon className="size-5 text-accent-teal" />
                    </motion.div>
                    {text}
                  </motion.li>
                );
              })}
            </ul>
            <MagneticButton>
              <Button variant="cta-secondary" asChild>
                <Link href="/dashboard">Try QR Generator</Link>
              </Button>
            </MagneticButton>
          </FadeUp>

          <FadeUp delay={0.2}>
            <motion.div
              style={{ rotateY, perspective: 800 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <QrDemo />
                <div className="scan-line pointer-events-none" />
              </div>
            </motion.div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
