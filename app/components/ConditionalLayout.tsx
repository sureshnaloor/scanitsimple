'use client';

import { usePathname } from 'next/navigation';
import { isMarketingRoute } from '@/lib/design-tokens';
import { MarketingLayout } from './marketing/MarketingLayout';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = isMarketingRoute(pathname);

  if (isMarketing) {
    return <MarketingLayout>{children}</MarketingLayout>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
