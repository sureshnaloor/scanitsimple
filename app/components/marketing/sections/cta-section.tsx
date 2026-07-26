'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeUp } from '../fade-up';
import { MagneticButton } from '@/app/components/effects/magnetic-button';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="about" className="relative overflow-hidden border-t border-primary-light bg-primary-navy py-24">
      {/* Sonar pulse rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-[500px] h-[300px]">
          <div className="sonar-ring absolute inset-0 rounded-3xl" />
          <div className="sonar-ring absolute inset-0 rounded-3xl" />
          <div className="sonar-ring absolute inset-0 rounded-3xl" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,180,216,0.08)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeUp>
          <motion.h2
            className="text-h2 mb-4 text-glow-hover"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            Ready to Transform Your Asset Management?
          </motion.h2>
          <p className="mb-10 text-body-ds">
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
              <Button variant="ghost" size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </MagneticButton>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
