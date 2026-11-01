'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from '../section-header';
import { CategoryArt } from '../category-art';
import { categories } from '../marketing-data';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function CategoriesSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          label="Comprehensive Coverage"
          headline="Manage Every Asset Category"
          subheadline="From IT equipment to heavy machinery, track every asset type with specialized registers and custom fields."
          align="left"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }}
              className="service-card group flex h-full flex-col !p-0 overflow-hidden border border-line"
            >
              {/* SVG artwork panel */}
              <div className="relative flex h-[200px] items-center justify-center overflow-hidden border-b border-line bg-mist">
                <CategoryArt
                  name={cat.art}
                  className="h-[160px] w-auto transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
                {/* count chip */}
                <span className="absolute right-4 top-4 bg-gold/25 px-3 py-1 font-display text-xs font-bold uppercase tracking-wider text-ink">
                  {cat.count}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-xl font-bold text-epc-primary">{cat.title}</h3>
                <div className="mb-5 mt-2 flex items-center gap-2">
                  <span className="h-0.5 w-8 bg-gold" />
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-epc-secondary">
                    {cat.subtypes.length} Subtypes
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {cat.subtypes.map((tag) => (
                    <span
                      key={tag}
                      className="border border-line bg-mist px-3 py-1 text-xs font-medium text-navy transition-colors group-hover:border-epc-secondary/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
