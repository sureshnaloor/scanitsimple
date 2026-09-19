'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isMarketingRoute } from '@/lib/design-tokens';
import { MarketingLayout } from './marketing/MarketingLayout';
import Header from './Header';
import Footer from './Footer';
import SignInRequired from './auth/SignInRequired';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isMarketing = isMarketingRoute(pathname);
  const isAuthRoute = pathname ? pathname.startsWith('/auth') : false;

  // Marketing pages remain fully accessible to guests
  if (isMarketing) {
    return <MarketingLayout>{children}</MarketingLayout>;
  }

  // Auth pages (signin, register, forgot-password) are public
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not signed in, show the dedicated SignInRequired screen
  if (status === 'unauthenticated' || !session) {
    return <SignInRequired />;
  }

  // Authenticated user: render standard dashboard layout
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
