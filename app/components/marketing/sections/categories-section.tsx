'use client';

import { SectionHeader } from '../section-header';
import { StaggerContainer, StaggerItem } from '../fade-up';
import { TiltCard } from '@/app/components/effects/tilt-card';
import { CategoryArt } from '../category-art';
import { categories } from '../marketing-data';
import { Badge } from '@/components/ui/badge';

export function CategoriesSection() {
  return (
    <section className="relative overflow-hidden bg-primary-dark py-24">
      {/* subtle grid texture */}
      <div className="grid-pattern absolute inset-0 opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Comprehensive Coverage"
          headline="Manage Every Asset Category"
          subheadline="From IT equipment to heavy machinery, track every asset type with specialized tools."
          className="mb-16"
        />
        <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <StaggerItem key={cat.title}>
              <TiltCard tiltAmount={8} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary-light bg-category-gradient shadow-ds-md transition-all duration-300 hover:-translate-y-1 hover:shadow-ds-lg">
                  {/* accent top edge that lights up on hover */}
                  <div
                    className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: `linear-gradient(90deg, ${cat.accent}, transparent)` }}
                  />

                  {/* SVG artwork panel */}
                  <div
                    className="relative flex h-[200px] items-center justify-center overflow-hidden border-b border-primary-light bg-primary-slate"
                    style={{ backgroundImage: `radial-gradient(130% 130% at 50% 0%, ${cat.glow} 0%, transparent 62%)` }}
                  >
                    <CategoryArt
                      name={cat.art}
                      className="h-[165px] w-auto transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                    />
                    {/* count chip */}
                    <span
                      className="absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-bold tabular-nums"
                      style={{ borderColor: `${cat.accent}55`, backgroundColor: `${cat.accent}14`, color: cat.accent }}
                    >
                      {cat.count}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-h4 mb-1">{cat.title}</h3>
                    <div className="mb-5 mt-1 flex items-center gap-2">
                      <span className="h-px w-8" style={{ background: cat.accent }} />
                      <p className="text-caption uppercase tracking-[0.12em] text-text-muted">
                        {cat.subtypes.length} subtypes
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      {cat.subtypes.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="normal-case tracking-normal transition-all duration-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
