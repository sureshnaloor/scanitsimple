'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeUp } from '../fade-up';
import { MagneticButton } from '@/app/components/effects/magnetic-button';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="about" className="bg-primary-dark py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Contained gradient panel */}
        <div className="relative overflow-hidden rounded-3xl border border-primary-light bg-hero-gradient px-6 py-16 text-center shadow-ds-lg sm:px-16 sm:py-20">
          {/* Sonar pulse rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[420px] w-[560px] max-w-full">
              <div className="sonar-ring absolute inset-0 rounded-3xl" />
              <div className="sonar-ring absolute inset-0 rounded-3xl" />
              <div className="sonar-ring absolute inset-0 rounded-3xl" />
            </div>
          </div>

          {/* ambient glows */}
          <div
            className="pointer-events-none absolute -top-24 left-1/4 size-[380px] rounded-full blur-[110px]"
            style={{ background: 'radial-gradient(circle, var(--color-accent-teal-glow) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-1/4 size-[340px] rounded-full blur-[110px]"
            style={{ background: 'radial-gradient(circle, var(--color-accent-orange-glow) 0%, transparent 70%)' }}
          />
          <div className="grid-pattern absolute inset-0 opacity-60" />

          <div className="relative">
            <FadeUp>
              <motion.h2
                className="text-h2 mb-4 text-glow-hover"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                Ready to Transform Your{' '}
                <span className="gradient-text">Asset Management?</span>
              </motion.h2>
              <p className="mx-auto mb-10 max-w-xl text-body-ds">
                Join thousands of organizations already using SmartTags to optimize
                their asset operations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <MagneticButton>
                  <Button variant="cta" size="lg" asChild className="animate-pulse-glow">
                    <Link href="/auth/register">Start Free Trial</Link>
                  </Button>
                </MagneticButton>
                <MagneticButton>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="rounded-full border-primary-light bg-primary-navy/60 px-8 font-semibold text-text-primary backdrop-blur-sm transition-all hover:border-accent-teal/50 hover:bg-primary-slate"
                  >
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </MagneticButton>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
