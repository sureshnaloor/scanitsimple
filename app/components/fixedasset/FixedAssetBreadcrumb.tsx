import Link from 'next/link';
import { fap } from '@/lib/fixedAssetPageDesign';

export type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
};

export default function FixedAssetBreadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-[#64748B]">/</span> : null}
            {isLast || !item.href ? (
              <span className={fap.breadcrumbCurrent}>{item.label}</span>
            ) : (
              <Link href={item.href} className={fap.breadcrumbLink}>
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
