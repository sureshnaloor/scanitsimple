/** SmartTags Design System tokens — see public/SmartTags_Design_System_Document.pdf */

export const colors = {
  primaryDark: '#0B1120',
  primaryNavy: '#111827',
  primarySlate: '#1E293B',
  primaryLight: '#2A3B4C',
  accentTeal: '#00B4D8',
  accentTealDark: '#0077B6',
  accentTealGlow: 'rgba(0, 180, 216, 0.15)',
  accentOrange: '#FF6B35',
  accentOrangeDark: '#E85D04',
  accentOrangeGlow: 'rgba(255, 107, 53, 0.15)',
  textPrimary: '#F8F9FA',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#00B4D8',
} as const;

export const gradients = {
  hero: 'linear-gradient(135deg, #0B1120 0%, #111827 50%, #1E293B 100%)',
  accent: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
  cta: 'linear-gradient(135deg, #FF6B35 0%, #E85D04 100%)',
  cardGlow: 'radial-gradient(circle at center, rgba(0,180,216,0.08) 0%, transparent 70%)',
  categoryCard: 'linear-gradient(180deg, #111827 0%, #1E293B 100%)',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.3)',
  glowTeal: '0 0 20px rgba(0,180,216,0.3), 0 0 40px rgba(0,180,216,0.1)',
  glowOrange: '0 0 20px rgba(255,107,53,0.3), 0 0 40px rgba(255,107,53,0.1)',
} as const;

export const glass = {
  background: 'rgba(17, 24, 39, 0.7)',
  border: '1px solid rgba(42, 59, 76, 0.5)',
  backdropFilter: 'blur(12px)',
} as const;

export const nav = {
  background: 'rgba(11, 17, 32, 0.85)',
  borderBottom: '1px solid rgba(42, 59, 76, 0.3)',
  height: '72px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
  '5xl': '128px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const easing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const chartColors = [
  colors.accentTeal,
  colors.accentOrange,
  colors.success,
  colors.warning,
  colors.info,
  colors.accentTealDark,
] as const;

/** Marketing routes that use MarketingLayout */
export const MARKETING_ROUTES = [
  '/',
  '/features',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/landing',
] as const;

export function isMarketingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return MARKETING_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route))
  );
}
