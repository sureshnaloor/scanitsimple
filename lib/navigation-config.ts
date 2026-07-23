import {
  HomeIcon,
  DocumentChartBarIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon as DocChartIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  UserIcon,
  QrCodeIcon,
  TagIcon,
  MapPinIcon,
  CalendarIcon,
  FunnelIcon,
  BuildingLibraryIcon,
  ComputerDesktopIcon,
  WrenchIcon,
  MagnifyingGlassCircleIcon,
  ClipboardIcon,
  TrashIcon,
  ArrowPathIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type NavigationSection =
  | 'dashboard'
  | 'reports'
  | 'mme'
  | 'assets'
  | 'tools'
  | 'materials'
  | 'search'
  | 'employee'
  | 'ppe'
  | 'admin';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type SidebarSubLink = {
  name: string;
  href: string;
  isGroupLabel?: boolean;
  icon?: IconComponent;
  iconColor?: string;
  iconGlow?: string;
  iconBg?: string;
};

export type MainNavItem = {
  name: string;
  href: string;
  section: NavigationSection;
  icon: IconComponent;
  requiresAuth?: boolean;
};

/** Luminous icon palettes — each sub-link gets a unique bright color */
const palettes = [
  { color: 'text-cyan-400', glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]', bg: 'bg-cyan-400/15' },
  { color: 'text-violet-400', glow: 'drop-shadow-[0_0_8px_rgba(167,139,250,0.85)]', bg: 'bg-violet-400/15' },
  { color: 'text-amber-400', glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]', bg: 'bg-amber-400/15' },
  { color: 'text-rose-400', glow: 'drop-shadow-[0_0_8px_rgba(251,113,133,0.85)]', bg: 'bg-rose-400/15' },
  { color: 'text-emerald-400', glow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]', bg: 'bg-emerald-400/15' },
  { color: 'text-sky-400', glow: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]', bg: 'bg-sky-400/15' },
  { color: 'text-fuchsia-400', glow: 'drop-shadow-[0_0_8px_rgba(232,121,249,0.85)]', bg: 'bg-fuchsia-400/15' },
  { color: 'text-lime-400', glow: 'drop-shadow-[0_0_8px_rgba(163,230,53,0.85)]', bg: 'bg-lime-400/15' },
  { color: 'text-orange-400', glow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.85)]', bg: 'bg-orange-400/15' },
  { color: 'text-indigo-400', glow: 'drop-shadow-[0_0_8px_rgba(129,140,248,0.85)]', bg: 'bg-indigo-400/15' },
  { color: 'text-teal-400', glow: 'drop-shadow-[0_0_8px_rgba(45,212,191,0.85)]', bg: 'bg-teal-400/15' },
  { color: 'text-pink-400', glow: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.85)]', bg: 'bg-pink-400/15' },
] as const;

function withIconPalette(
  links: Omit<SidebarSubLink, 'iconColor' | 'iconGlow' | 'iconBg'>[],
  startIndex = 0
): SidebarSubLink[] {
  let colorIndex = startIndex;
  return links.map((link) => {
    if (link.isGroupLabel) return link;
    const palette = palettes[colorIndex % palettes.length];
    colorIndex += 1;
    return {
      ...link,
      iconColor: palette.color,
      iconGlow: palette.glow,
      iconBg: palette.bg,
    };
  });
}

export const SIDEBAR_WIDTH = 220;

export const mainNavItems: MainNavItem[] = [
  { name: 'Dashboard', href: '/dashboard', section: 'dashboard', icon: HomeIcon },
  { name: 'Reports', href: '/reports/active-calibrations', section: 'reports', icon: DocumentChartBarIcon },
  { name: 'MME', href: '/mme', section: 'mme', icon: BeakerIcon },
  { name: 'Assets', href: '/fixedasset', section: 'assets', icon: BuildingOfficeIcon },
  { name: 'Tools', href: '/tools', section: 'tools', icon: WrenchScrewdriverIcon },
  { name: 'Materials', href: '/projectissued-materials', section: 'materials', icon: CubeIcon },
  { name: 'Search', href: '/search', section: 'search', icon: MagnifyingGlassIcon },
  { name: 'Employee', href: '/employee-management', section: 'employee', icon: UserGroupIcon },
  { name: 'PPE', href: '/ppe-dashboard', section: 'ppe', icon: ShieldCheckIcon },
  { name: 'Admin', href: '/admin/projects', section: 'admin', icon: Cog6ToothIcon, requiresAuth: true },
];

export const subLinksMap: Record<NavigationSection, SidebarSubLink[]> = {
  dashboard: [],
  reports: withIconPalette([
    { name: 'Active Calibrations', href: '/reports/active-calibrations', icon: ChartBarIcon },
    { name: 'Expired Calibrations', href: '/reports/expired-calibrations', icon: ExclamationTriangleIcon },
    { name: 'Project Equipment', href: '/reports/project-equipment', icon: BuildingLibraryIcon },
    { name: 'User Equipment', href: '/reports/user-equipment', icon: UserIcon },
    { name: 'Warehouse Equipment', href: '/reports/warehouse-equipment', icon: ArchiveBoxIcon },
  ]),
  mme: withIconPalette([
    { name: 'MME Overview', href: '/mme', icon: BeakerIcon },
    { name: 'Unidentified MME & LVA', href: '/mme/unidentified', icon: QrCodeIcon },
    { name: 'Without Custodian', href: '/mme/without-custodian', icon: UserIcon },
    { name: 'MME Un-calibrated', href: '/mme/uncalibrated', icon: ExclamationTriangleIcon },
    { name: 'Search by Serial Number', href: '/mme-search-by-serial-number', icon: MagnifyingGlassCircleIcon },
    { name: 'Search by Manufacturer', href: '/mme-search-by-manufacturer', icon: BuildingOfficeIcon },
    { name: 'Search by Model', href: '/mme-search-by-model', icon: TagIcon },
    { name: 'Search by Category', href: '/mme-search-by-category', icon: FunnelIcon },
    { name: 'Search by Subcategory', href: '/mme-search-by-subcategory', icon: ListBulletIcon },
    { name: 'Search by Year of Acquisition', href: '/mme-search-by-year-of-acquisition', icon: CalendarIcon },
    { name: 'Search by Location', href: '/mme/search-by-location', icon: MapPinIcon },
    { name: 'MME Master Data', href: '#', isGroupLabel: true },
    { name: 'Category', href: '/mme/category', icon: TagIcon },
    { name: 'Subcategory', href: '/mme/subcategory', icon: ListBulletIcon },
    { name: 'Manufacturer', href: '/mme/manufacturer', icon: BuildingOfficeIcon },
  ]),
  assets: withIconPalette([
    { name: 'Assets Overview', href: '/fixedasset', icon: BuildingOfficeIcon },
    { name: 'Unidentified Assets', href: '/assets/unidentified', icon: QrCodeIcon },
    { name: 'Without Custodian', href: '/fixedasset/without-custodian', icon: UserIcon },
    { name: 'Search by Manufacturer', href: '/assets-search-by-manufacturer', icon: BuildingOfficeIcon },
    { name: 'Search by Model', href: '/assets-search-by-model', icon: TagIcon },
    { name: 'Search by Category', href: '/assets-search-by-category', icon: FunnelIcon },
    { name: 'Search by Subcategory', href: '/assets-search-by-subcategory', icon: ListBulletIcon },
    { name: 'Search by Year of Acquisition', href: '/assets-search-by-year-of-acquisition', icon: CalendarIcon },
    { name: 'Search by Location', href: '/fixedasset/search-by-location', icon: MapPinIcon },
    { name: 'Transport Assets', href: '/fixedasset/transport-assets', icon: TruckIcon },
    { name: 'Facility Assets', href: '/fixedasset/facility-assets', icon: BuildingLibraryIcon },
    { name: 'Portable Assets', href: '/fixedasset/portable-assets', icon: WrenchIcon },
    { name: 'Software Assets', href: '/fixedasset/software-assets', icon: ComputerDesktopIcon },
    { name: 'Fixed Asset Master Data', href: '#', isGroupLabel: true },
    { name: 'Category', href: '/fixedasset/category', icon: TagIcon },
    { name: 'Subcategory', href: '/fixedasset/subcategory', icon: ListBulletIcon },
    { name: 'Manufacturer', href: '/fixedasset/manufacturer', icon: BuildingOfficeIcon },
  ]),
  tools: withIconPalette([
    { name: 'Tools Management', href: '/tools', icon: WrenchScrewdriverIcon },
    { name: 'Tools Reports', href: '/tools/reports', icon: ClipboardDocumentIcon },
  ]),
  materials: withIconPalette([
    { name: 'Project Issued Materials', href: '/projectissued-materials', icon: CubeIcon },
    { name: 'Project Return Materials', href: '/projectreturn-materials', icon: ArrowPathIcon },
    { name: 'Disposed Materials', href: '/disposed-materials', icon: TrashIcon },
    { name: 'Return Reports', href: '#', isGroupLabel: true },
    { name: 'List All Returned', href: '/projectreturn-materials/list-all-returned-materials', icon: ClipboardIcon },
    { name: 'Returned by Project', href: '/projectreturn-materials/by-project', icon: BuildingLibraryIcon },
    { name: 'Issued to WBS', href: '/projectreturn-materials/issues-by-wbs', icon: ListBulletIcon },
    { name: 'Reco for Disposal', href: '/projectreturn-materials/list-all-reco-for-disposal-materials', icon: ExclamationTriangleIcon },
    { name: 'Under Disposal', href: '/projectreturn-materials/under-disposal-materials', icon: TrashIcon },
  ]),
  search: withIconPalette([
    { name: 'Global Search', href: '/search', icon: MagnifyingGlassIcon },
  ]),
  employee: withIconPalette([
    { name: 'Employee Management', href: '/employee-management', icon: UserGroupIcon },
    { name: 'Assets in User Custody', href: '#', icon: BuildingOfficeIcon },
    { name: 'MME in User Custody', href: '#', icon: BeakerIcon },
    { name: 'Tools in User Custody', href: '#', icon: WrenchScrewdriverIcon },
    { name: 'PPE Issued to User', href: '#', icon: ShieldCheckIcon },
  ]),
  ppe: withIconPalette([
    { name: 'PPE Dashboard', href: '/ppe-dashboard', icon: ShieldCheckIcon },
    { name: 'PPE Master', href: '/ppe-master', icon: ClipboardDocumentListIcon },
    { name: 'Issue Records', href: '/ppe-issue-records', icon: ClipboardDocumentCheckIcon },
    { name: 'Bulk Issues', href: '/ppe-bulk-issues', icon: DocChartIcon },
    { name: 'Receipts', href: '/ppe-receipts', icon: TruckIcon },
    { name: 'Stock Management', href: '/ppe-stock', icon: ArchiveBoxIcon },
    { name: 'Due for Reissue', href: '/ppe-due-for-reissue', icon: ExclamationTriangleIcon },
    { name: 'Issues (Date Range)', href: '/ppe-issues', icon: ClipboardDocumentIcon },
    { name: 'Issues by Employee', href: '/ppe-issues-employee', icon: UserIcon },
  ]),
  admin: withIconPalette([
    { name: 'Projects', href: '/admin/projects', icon: CubeIcon },
    { name: 'Locations', href: '/admin/locations', icon: BuildingOfficeIcon },
  ]),
};

export const sectionLabels: Record<NavigationSection, string> = {
  dashboard: 'Dashboard',
  reports: 'Reports',
  mme: 'MME',
  assets: 'Assets',
  tools: 'Tools',
  materials: 'Materials',
  search: 'Search',
  employee: 'Employee',
  ppe: 'PPE',
  admin: 'Admin',
};

export function getSectionFromPathname(pathname: string | null): NavigationSection | null {
  if (!pathname) return null;

  if (pathname === '/dashboard') return 'dashboard';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/mme') || pathname.startsWith('/mme-')) return 'mme';
  if (
    pathname.startsWith('/fixedasset') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/assets-search')
  ) {
    return 'assets';
  }
  if (pathname.startsWith('/tools')) return 'tools';
  if (
    pathname.startsWith('/projectissued-materials') ||
    pathname.startsWith('/projectreturn-materials') ||
    pathname.startsWith('/disposed-materials')
  ) {
    return 'materials';
  }
  if (pathname.startsWith('/search')) return 'search';
  if (pathname.startsWith('/employee-management')) return 'employee';
  if (pathname.startsWith('/ppe-') || pathname === '/ppe-dashboard') return 'ppe';
  if (pathname.startsWith('/admin')) return 'admin';

  return null;
}

export function isPathActive(pathname: string, href: string): boolean {
  if (href === '#') return false;
  return pathname === href;
}
