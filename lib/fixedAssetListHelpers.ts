export const sortBtn = 'flex items-center gap-1 text-[#475569] transition hover:text-[#0891B2] dark:text-[#94A3B8] dark:hover:text-[#00B4D8]';
export const th = 'text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]';

type StatusRow = { assetstatus?: string };

export function computeAssetStats(data: StatusRow[]) {
  const activeCount = data.filter((r) => (r.assetstatus || '').toLowerCase().includes('active')).length;
  const maintenanceCount = data.filter((r) => {
    const s = (r.assetstatus || '').toLowerCase();
    return s.includes('maintenance') || s.includes('repair');
  }).length;
  const disposedCount = data.filter((r) => (r.assetstatus || '').toLowerCase().includes('dispose')).length;

  return [
    { label: 'Total assets', value: data.length, accent: 'teal' as const },
    {
      label: 'Active',
      value: activeCount,
      hint: data.length ? `${Math.round((activeCount / data.length) * 100)}% of total` : undefined,
      accent: 'success' as const,
    },
    { label: 'In maintenance', value: maintenanceCount, accent: 'warning' as const },
    { label: 'Disposed', value: disposedCount, accent: 'error' as const },
  ];
}
