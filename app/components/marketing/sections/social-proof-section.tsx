'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { SectionHeader } from '../section-header';
import { testimonials, clientLogos } from '../marketing-data';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function SocialProofSection() {
  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          label="Trusted Worldwide"
          headline="Trusted by Industry Leaders"
          subheadline="Operations teams across construction, oil & gas, logistics and healthcare rely on SmartTagScan every day."
          align="center"
        />

        {/* EPCORA style Ticker client logos */}
        <div className="mb-16 overflow-hidden border-y-4 border-epc-primary/10 bg-mist py-5">
          <div className="marquee-track items-center gap-14">
            {[...clientLogos, ...clientLogos, ...clientLogos, ...clientLogos].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="flex items-center gap-3 whitespace-nowrap font-display text-sm font-bold uppercase tracking-widest text-epc-primary"
              >
                {name}
                <span className="ml-8 text-golddeep">◆</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="service-card group flex h-full flex-col border border-line"
            >
              <div className="icon-chip">
                <Quote size={22} />
              </div>
              <p className="mb-6 flex-1 text-base italic leading-relaxed text-body">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-line pt-4">
                <p className="font-display text-base font-bold text-epc-primary">{t.author}</p>
                <p className="mt-0.5 font-display text-xs font-semibold uppercase tracking-wider text-golddeep">
                  {t.title} · {t.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
