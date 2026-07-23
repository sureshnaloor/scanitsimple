'use client';

import Link from 'next/link';

import { BRAND_LOGOS, type BrandLogoVariant } from '@/lib/brandLogos';
import { cn } from '@/lib/utils';

type Props = {
  variant?: BrandLogoVariant;
  href?: string;
  className?: string;
  imageClassName?: string;
  height?: number;
  priority?: boolean;
  link?: boolean;
  /** When false, size is controlled only via className / imageClassName (e.g. hero GIF). */
  fixedHeight?: boolean;
};

export default function SmartTagsLogo({
  variant = 'primary',
  href = '/',
  className,
  imageClassName,
  height = 36,
  priority = false,
  link = true,
  fixedHeight = true,
}: Props) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGOS[variant]}
      alt="SmartTags"
      height={fixedHeight ? height : undefined}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('block w-auto max-w-full object-contain object-left', imageClassName)}
      style={fixedHeight ? { height: `${height}px`, width: 'auto' } : undefined}
    />
  );

  if (!link) {
    return <span className={cn('inline-flex shrink-0 items-center', className)}>{image}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center transition-opacity duration-200 hover:opacity-90',
        className,
      )}
      aria-label="SmartTags home"
    >
      {image}
    </Link>
  );
}
