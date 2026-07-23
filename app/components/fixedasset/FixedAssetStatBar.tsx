import { fap } from '@/lib/fixedAssetPageDesign';

export type StatItem = {
  label: string;
  value: string | number;
  hint?: string;
  accent: 'teal' | 'success' | 'warning' | 'error';
};

const accentBorder: Record<StatItem['accent'], string> = {
  teal: 'border-l-[#00B4D8]',
  success: 'border-l-[#10B981]',
  warning: 'border-l-[#F59E0B]',
  error: 'border-l-[#EF4444]',
};

type Props = {
  stats: StatItem[];
};

export default function FixedAssetStatBar({ stats }: Props) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${fap.card} border-l-[3px] ${accentBorder[stat.accent]} ${fap.cardPadding}`}
        >
          <p className="text-3xl font-bold text-[#0F172A] dark:text-[#F8F9FA]">{stat.value}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#64748B]">{stat.label}</p>
          {stat.hint ? <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">{stat.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
