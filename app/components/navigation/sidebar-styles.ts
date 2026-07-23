'use client';

import { useAppTheme } from '@/app/contexts/ThemeContext';

export type SidebarStyleSet = {
  sidebarBg: string;
  sidebarBorder: string;
  sectionTitle: string;
  sectionDivider: string;
  linkText: string;
  linkHover: string;
  linkActive: string;
  groupLabel: string;
  emptyText: string;
  footerBg: string;
  footerLabel: string;
  footerValue: string;
  footerValueSecondary: string;
  drawerBg: string;
  drawerOverlay: string;
};

export function useSidebarStyles(): SidebarStyleSet {
  const { theme } = useAppTheme();

  switch (theme) {
    case 'glassmorphic':
      return {
        sidebarBg: 'bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332] backdrop-blur-xl',
        sidebarBorder: 'border-r border-white/10',
        sectionTitle: 'text-white/90',
        sectionDivider: 'border-white/15',
        linkText: 'text-white/75 hover:text-white',
        linkHover: 'hover:bg-white/8',
        linkActive:
          'bg-white/12 text-white border-l-[3px] border-l-teal-400 shadow-[inset_0_0_20px_rgba(45,212,191,0.08)]',
        groupLabel: 'text-teal-400/80',
        emptyText: 'text-white/50',
        footerBg: 'bg-white/5 backdrop-blur-md border-t border-white/10',
        footerLabel: 'text-white/70',
        footerValue: 'text-white',
        footerValueSecondary: 'text-white/50',
        drawerBg: 'bg-[#1a2332]/98 backdrop-blur-xl border-r border-white/10',
        drawerOverlay: 'bg-black/60 backdrop-blur-sm',
      };
    case 'light':
      return {
        sidebarBg: 'bg-gradient-to-br from-gray-50 via-blue-50/80 to-gray-100',
        sidebarBorder: 'border-r border-blue-200/80',
        sectionTitle: 'text-gray-800',
        sectionDivider: 'border-blue-200',
        linkText: 'text-gray-600 hover:text-gray-900',
        linkHover: 'hover:bg-blue-50/80',
        linkActive: 'bg-blue-100/90 text-blue-800 border-l-[3px] border-l-blue-500 font-semibold',
        groupLabel: 'text-blue-600',
        emptyText: 'text-gray-400',
        footerBg: 'bg-blue-50/60 border-t border-blue-200/80',
        footerLabel: 'text-gray-500',
        footerValue: 'text-gray-800',
        footerValueSecondary: 'text-gray-400',
        drawerBg: 'bg-white border-r border-blue-200 shadow-2xl',
        drawerOverlay: 'bg-black/40',
      };
    default:
      return {
        sidebarBg: 'bg-primary-navy',
        sidebarBorder: 'border-r border-primary-light/60',
        sectionTitle: 'text-text-primary',
        sectionDivider: 'border-primary-light/40',
        linkText: 'text-text-secondary hover:text-text-primary',
        linkHover: 'hover:bg-primary-slate/80',
        linkActive:
          'bg-accent-teal/12 text-accent-teal border-l-[3px] border-l-accent-teal shadow-[inset_0_0_24px_rgba(45,212,191,0.06)]',
        groupLabel: 'text-accent-teal/70',
        emptyText: 'text-text-muted',
        footerBg: 'bg-primary-slate/40 border-t border-primary-light/40',
        footerLabel: 'text-text-muted',
        footerValue: 'text-text-primary',
        footerValueSecondary: 'text-text-muted',
        drawerBg: 'bg-primary-navy border-r border-primary-light/60 shadow-2xl',
        drawerOverlay: 'bg-black/60 backdrop-blur-sm',
      };
  }
}
