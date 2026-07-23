'use client';

import { Card } from '@/components/ui/card';
import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
import { testimonials, clientLogos } from '../marketing-data';

export function SocialProofSection() {
  return (
    <section className="bg-primary-dark py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Trusted Worldwide"
          headline="Trusted by Industry Leaders"
          className="mb-12"
        />
        <div className="mb-16 flex flex-wrap items-center justify-center gap-8">
          {clientLogos.map((name) => (
            <span
              key={name}
              className="text-lg font-semibold text-text-muted opacity-60 transition-opacity hover:opacity-100"
            >
              {name}
            </span>
          ))}
        </div>
        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.author}>
              <Card variant="glass" className="h-full p-6">
                <p className="mb-6 text-body-ds italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-text-primary">{t.author}</p>
                  <p className="text-sm text-text-muted">
                    {t.title}, {t.company}
                  </p>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
