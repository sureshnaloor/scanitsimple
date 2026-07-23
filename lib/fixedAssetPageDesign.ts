/**
 * SmartTags fixed asset list & detail page design tokens.
 * @see public/SmartTags_FixedAsset_List_Page_Design.md
 * @see public/SmartTags_FixedAsset_Detail_Page_Design.md
 */

export const fap = {
  page: 'min-h-screen bg-[#F1F5F9] dark:bg-[#0B1120]',
  listContainer: 'mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-12',
  detailContainer: 'mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-10',
  title: 'text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8F9FA] md:text-[48px] md:leading-tight',
  subtitle: 'mt-2 text-base text-[#475569] dark:text-[#94A3B8]',
  sectionTitle: 'text-lg font-semibold text-[#0F172A] dark:text-[#F8F9FA]',
  sectionDesc: 'text-sm text-[#64748B] dark:text-[#64748B]',
  card: 'rounded-2xl border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:border-[#2A3B4C]/50 dark:bg-[#111827] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]',
  cardPadding: 'p-6 md:p-8',
  surface: 'rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]',
  surfaceBorder: 'rounded-xl border border-slate-200 bg-[#F8FAFC] dark:border-[#2A3B4C]/50 dark:bg-[#1E293B]',
  input:
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-[rgba(8,145,178,0.2)] dark:border-[#2A3B4C] dark:bg-[#1E293B] dark:text-[#F8F9FA] dark:placeholder:text-[#64748B] dark:focus:border-[#00B4D8] dark:focus:ring-[rgba(0,180,216,0.25)]',
  searchInput:
    'w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-[rgba(8,145,178,0.2)] dark:border-[#2A3B4C] dark:bg-[#1E293B] dark:text-[#F8F9FA] dark:placeholder:text-[#64748B] dark:focus:border-[#00B4D8] dark:focus:ring-[rgba(0,180,216,0.25)]',
  searchField:
    'flex w-full items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 transition focus-within:border-[#0891B2] focus-within:ring-2 focus-within:ring-[rgba(8,145,178,0.2)] dark:border-[#2A3B4C] dark:bg-[#1E293B] dark:focus-within:border-[#00B4D8] dark:focus-within:ring-[rgba(0,180,216,0.25)]',
  searchFieldInput:
    'min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none ring-0 focus:ring-0 dark:text-[#F8F9FA] dark:placeholder:text-[#64748B]',
  select:
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] transition focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-[rgba(8,145,178,0.2)] dark:border-[#2A3B4C] dark:bg-[#1E293B] dark:text-[#F8F9FA] dark:[color-scheme:dark] dark:focus:border-[#00B4D8] dark:focus:ring-[rgba(0,180,216,0.25)]',
  label: 'mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]',
  fieldLabel: 'mb-1 block text-xs text-[#475569] dark:text-[#94A3B8]',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#00B4D8] to-[#0077B6] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-medium text-[#475569] transition hover:border-[#0891B2] hover:text-[#0891B2] disabled:opacity-50 dark:border-[#2A3B4C] dark:text-[#94A3B8] dark:hover:border-[#00B4D8] dark:hover:text-[#00B4D8]',
  btnDanger:
    'inline-flex items-center justify-center gap-1 rounded-lg border border-[rgba(239,68,68,0.4)] px-3 py-1.5 text-xs text-[#EF4444] transition hover:bg-[rgba(239,68,68,0.1)]',
  link: 'font-mono text-sm font-medium text-[#00B4D8] hover:underline',
  breadcrumbLink: 'text-sm text-[#64748B] transition hover:text-[#00B4D8]',
  breadcrumbCurrent: 'text-sm font-semibold text-[#0F172A] dark:text-[#F8F9FA]',
  spinner: 'h-10 w-10 animate-spin rounded-full border-2 border-[#00B4D8] border-t-transparent',
  tableWrap: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-[#2A3B4C]/50 dark:bg-[#111827]',
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm',
  modal: 'max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#2A3B4C]/50 dark:bg-[#111827]',
  errorBox: 'rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-[rgba(239,68,68,0.4)] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#FCA5A5]',
  idBadge:
    'inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,180,216,0.3)] bg-[rgba(0,180,216,0.15)] px-3 py-1 font-mono text-[13px] font-medium text-[#00B4D8]',
  iconBox:
    'flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-[#F8FAFC] bg-gradient-to-br from-[rgba(8,145,178,0.1)] to-transparent dark:bg-[#1E293B] dark:from-[rgba(0,180,216,0.1)]',
  sidebarSticky: 'lg:sticky lg:top-6 lg:self-start',
  textPrimary: 'text-[#0F172A] dark:text-[#F8F9FA]',
  textSecondary: 'text-[#475569] dark:text-[#94A3B8]',
  textMuted: 'text-[#64748B] dark:text-[#94A3B8]',
  masterContainer: 'mx-auto max-w-5xl space-y-6',
  listItem:
    'flex items-center justify-between rounded-md border border-slate-200 bg-[#F8FAFC] p-3 dark:border-[#2A3B4C]/50 dark:bg-[#1E293B]',
  tableHead: 'bg-slate-100 text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]',
  tableRow: 'border-slate-200 text-[#0F172A] dark:border-[#2A3B4C]/50 dark:text-[#F8F9FA]',
} as const;

export function statusBadgeClass(status: string): string {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold';
  if (s.includes('active')) {
    return `${base} border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.15)] text-[#10B981]`;
  }
  if (s.includes('maintenance') || s.includes('repair')) {
    return `${base} border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-[#F59E0B]`;
  }
  if (s.includes('dispose') || s.includes('inactive')) {
    return `${base} border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-[#EF4444]`;
  }
  return `${base} border border-[rgba(100,116,139,0.3)] bg-[rgba(100,116,139,0.15)] text-[#64748B]`;
}

export function formatCurrency(value: number | null | undefined, currency = 'SAR'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}
