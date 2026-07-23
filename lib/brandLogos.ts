export const BRAND_LOGOS = {
  primary: '/images/logos/smarttags_logo_primary.svg',
  animated: '/images/logos/smarttags_logo_animated.svg',
  gif: '/images/logos/smarttags_logo_3d_rotating.gif',
} as const;

export type BrandLogoVariant = keyof typeof BRAND_LOGOS;

/** Logo viewBox is 400×120 */
export const BRAND_LOGO_ASPECT = 400 / 120;

export function brandLogoDimensions(height: number) {
  return {
    height,
    width: Math.round(height * BRAND_LOGO_ASPECT),
  };
}
