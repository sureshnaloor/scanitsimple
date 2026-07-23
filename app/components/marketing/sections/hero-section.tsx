'use client';

import Link from 'next/link';
import { Play, BarChart3, Zap, Shield, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import SmartTagsLogo from '@/app/components/SmartTagsLogo';
import { FadeUp } from '../fade-up';
import { heroStats } from '../marketing-data';

const statIcons = [BarChart3, Zap, Shield, Building2];

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-hero-gradient grid-pattern">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 xl:gap-16">
          <FadeUp className="flex justify-center lg:justify-end">
            <SmartTagsLogo
              variant="gif"
              link={false}
              fixedHeight={false}
              priority
              className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none"
              imageClassName="mx-auto h-auto w-full max-h-[min(52vh,320px)] max-w-[min(100%,320px)] object-contain drop-shadow-[0_0_32px_rgba(0,180,216,0.2)] lg:mx-0 lg:max-h-[360px] lg:max-w-[360px]"
            />
          </FadeUp>

          <div className="text-center lg:text-left">
            <FadeUp delay={0.05}>
              <span className="mb-6 inline-block rounded-full border border-accent-teal px-4 py-1.5 text-caption uppercase tracking-[0.05em] text-accent-teal">
                Asset Intelligence Platform
              </span>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-hero mb-6">
                Every Asset. One Scan. Total Control.
              </h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="mx-auto mb-10 max-w-[640px] text-body-ds lg:mx-0">
                Streamline your asset tracking with our comprehensive MME and Fixed Assets
                management system. Get real-time insights, automated workflows, and complete
                control over your valuable resources.
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="mb-4 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Button variant="cta" size="lg" asChild>
                  <Link href="/auth/register">Get Started Free</Link>
                </Button>
                <Button variant="cta-secondary" size="lg" asChild>
                  <Link href="/contact" className="flex items-center gap-2">
                    <Play className="size-4" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={0.4}>
          <div className="mt-12 grid w-full grid-cols-2 gap-4 md:grid-cols-4 lg:mt-16">
            {heroStats.map((stat, i) => {
              const Icon = statIcons[i];
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="glass-card p-4 text-center"
                >
                  <Icon className="mx-auto mb-2 size-6 text-accent-teal" />
                  <div className="text-2xl font-extrabold text-text-primary md:text-3xl">
                    {stat.display}
                  </div>
                  <div className="text-caption uppercase tracking-wider text-text-muted">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
