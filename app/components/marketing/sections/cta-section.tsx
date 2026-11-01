'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function CtaSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-gold">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, #05052D 0 2px, transparent 2px 90px)',
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
        <motion.div {...reveal}>
          <div className="eyebrow-center mb-5 !text-epc-primary">
            Every Asset. One Scan. Total Control.
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Ready to scan your way <br className="hidden sm:block" /> to total control?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
            See your own asset register running on SmartTagScan — start your free trial or book a
            live walkthrough with our engineering team.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="btn-primary">
              Get Started Free <ArrowRight size={17} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 border-2 border-ink px-8 py-4 font-display text-sm font-semibold uppercase tracking-wider text-ink transition-all duration-300 hover:bg-ink hover:text-gold"
            >
              Book a Live Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
