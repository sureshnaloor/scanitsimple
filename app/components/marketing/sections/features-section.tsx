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
import { Card } from '@/components/ui/card';
import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
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
    <section className="bg-primary-navy py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Powerful Features"
          headline="Built for Enterprise Scale"
          subheadline="Comprehensive tools designed for modern asset management with intuitive workflows and advanced automation."
          className="mb-16"
        />
        <StaggerContainer className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {landingFeatures.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <StaggerItem key={feature.title}>
                <Card variant="feature" className="h-full">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent-teal/15">
                    {Icon && <Icon className="size-6 text-accent-teal" />}
                  </div>
                  <h3 className="text-h5 mb-3 text-text-primary">{feature.title}</h3>
                  <p className="text-body-sm-ds">{feature.description}</p>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
