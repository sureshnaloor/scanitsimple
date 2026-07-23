'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { fap } from '@/lib/fixedAssetPageDesign';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  sectionId?: string;
};

export default function FixedAssetSection({
  title,
  description,
  children,
  defaultExpanded = true,
  sectionId,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section id={sectionId} className="scroll-mt-24">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 dark:border-[#2A3B4C]/50 dark:bg-[#1E293B] dark:hover:bg-[#2A3B4C]/30"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8F9FA]">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-[#64748B]">{description}</p> : null}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#94A3B8] transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isExpanded ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className={`${fap.surfaceBorder} p-6`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
