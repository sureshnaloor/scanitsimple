import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen ds-page-bg">
      <MarketingNav />
      <main className="pt-[72px]">{children}</main>
      <MarketingFooter />
    </div>
  );
}
