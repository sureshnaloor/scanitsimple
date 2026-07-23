'use client';

import Link from 'next/link';
import { FadeUp } from '../fade-up';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="about" className="relative overflow-hidden border-t border-primary-light bg-primary-navy py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,180,216,0.08)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeUp>
          <h2 className="text-h2 mb-4">
            Ready to Transform Your Asset Management?
          </h2>
          <p className="mb-10 text-body-ds">
            Join thousands of organizations already using SmartTags to optimize
            their asset operations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="cta" size="lg" asChild>
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
