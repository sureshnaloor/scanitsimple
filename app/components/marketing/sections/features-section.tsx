'use client';

import {
  MapPin,
  Wrench,
  Users,
  BarChart3,
  ShieldCheck,
  Smartphone,
  LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
import { TiltCard } from '@/app/components/effects/tilt-card';
import { landingFeatures } from '../marketing-data';

const iconMap: Record<string, LucideIcon> = {
  MapPin,
  Wrench,
  Users,
  BarChart3,
  ShieldCheck,
  Smartphone,
};

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-primary-dark py-24">
      <div className="grid-pattern absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Powerful Features"
          headline="Built for Enterprise Scale"
          subheadline="Comprehensive tools designed for modern asset management with intuitive workflows and advanced automation."
          className="mb-16"
        />
        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {landingFeatures.map((feature, i) => {
            const Icon = iconMap[feature.icon];
            return (
              <StaggerItem key={feature.title}>
                <TiltCard tiltAmount={6} className="h-full">
                  <Card variant="feature" className="gradient-border h-full">
                    <motion.div
                      className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent-teal/15"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {Icon && (
                        <motion.div
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        >
                          <Icon className="size-6 text-accent-teal" />
                        </motion.div>
                      )}
                    </motion.div>
                    <h3 className="text-h4 mb-3 text-text-primary">{feature.title}</h3>
                    <p className="text-body-sm-ds">{feature.description}</p>
                  </Card>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
