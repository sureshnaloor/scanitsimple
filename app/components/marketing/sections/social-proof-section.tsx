'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
import { testimonials, clientLogos } from '../marketing-data';

export function SocialProofSection() {
  return (
    <section className="bg-primary-navy py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Trusted Worldwide"
          headline="Trusted by Industry Leaders"
          className="mb-12"
        />

        {/* Marquee client logos */}
        <div className="mb-16 marquee">
          <div className="marquee-content gap-12 items-center">
            {[...clientLogos, ...clientLogos, ...clientLogos, ...clientLogos].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-lg font-semibold text-text-muted opacity-60 transition-opacity hover:opacity-100 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <StaggerItem key={t.author}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card variant="glass" className="h-full p-6">
                  <p className="mb-6 text-body-ds italic">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-text-primary">{t.author}</p>
                    <p className="text-sm text-text-muted">
                      {t.title}, {t.company}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
