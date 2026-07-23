'use client';

import Image from 'next/image';
import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
import { categories } from '../marketing-data';
import { Badge } from '@/components/ui/badge';

export function CategoriesSection() {
  return (
    <section className="bg-primary-dark py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Comprehensive Coverage"
          headline="Manage Every Asset Category"
          subheadline="From IT equipment to heavy machinery, track every asset type with specialized tools."
          className="mb-16"
        />
        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <StaggerItem key={cat.title}>
              <div className="group overflow-hidden rounded-xl border border-primary-light bg-category-gradient shadow-ds-md transition-all duration-300 hover:-translate-y-1 hover:shadow-ds-lg hover:shadow-glow-teal">
                <div className="relative h-[200px] overflow-hidden bg-primary-slate">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-400 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/80 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-h4 mb-1">{cat.title}</h3>
                  <p className="mb-4 text-sm font-medium text-accent-teal">{cat.count}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.subtypes.map((tag) => (
                      <Badge key={tag} variant="default" className="normal-case tracking-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
