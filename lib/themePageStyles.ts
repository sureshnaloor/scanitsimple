'use client';

import { useAppTheme } from '@/app/contexts/ThemeContext';
import { fap } from '@/lib/fixedAssetPageDesign';

export function useThemeSurfaces() {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  return {
    isLight,
    card: isLight
      ? fap.card
      : 'rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-lg',
    cardPadding: isLight ? fap.cardPadding : 'p-6 md:p-8',
    listItem: isLight
      ? fap.listItem
      : 'flex items-center justify-between rounded-md border border-white/20 bg-white/10 p-3 backdrop-blur-md',
    input: isLight
      ? fap.input
      : 'w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30',
    searchInput: isLight
      ? fap.searchInput
      : 'w-full max-w-sm rounded-xl border border-white/20 bg-[#1E293B] py-3 pl-11 pr-4 text-white placeholder:text-white/60 [color-scheme:dark] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30',
    searchField: isLight
      ? fap.searchField
      : 'flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/20 bg-[#1E293B] px-3 py-2.5 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/30',
    searchFieldInput: isLight
      ? fap.searchFieldInput
      : 'min-w-0 flex-1 border-0 bg-transparent text-sm text-white placeholder:text-white/60 outline-none',
    select: isLight
      ? fap.select
      : 'w-full rounded-lg border border-white/20 bg-[#1E293B] px-3 py-2.5 text-sm text-white [color-scheme:dark] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30',
    pageTitle: isLight
      ? `text-2xl font-bold ${fap.textPrimary}`
      : 'text-2xl font-bold text-white',
    heroTitle: isLight
      ? fap.title
      : 'text-2xl font-bold tracking-tight text-white md:text-3xl',
    heroSubtitle: isLight ? fap.subtitle : 'text-base text-white/80',
    sectionTitle: isLight
      ? `mb-3 text-lg font-semibold ${fap.textPrimary}`
      : 'mb-3 text-lg font-semibold text-white',
    textPrimary: isLight ? fap.textPrimary : 'text-white',
    textSecondary: isLight ? fap.textSecondary : 'text-white/80',
    textMuted: isLight ? fap.textMuted : 'text-white/70',
    errorBox: isLight
      ? fap.errorBox
      : 'rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200',
    tableWrap: isLight
      ? fap.tableWrap
      : 'overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-lg',
    tableSummaryBorder: isLight
      ? 'border-slate-200 dark:border-[#2A3B4C]/50'
      : 'border-white/20',
    btnPrimary: fap.btnPrimary,
    btnSecondary: isLight
      ? fap.btnSecondary
      : 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20',
    link: isLight ? fap.link : 'font-mono text-sm font-medium text-teal-400 hover:text-teal-300 hover:underline',
    spinner: fap.spinner,
    label: isLight ? fap.fieldLabel : 'mb-1 block text-sm font-medium text-white/80',
  };
}
