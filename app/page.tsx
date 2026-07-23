import { HeroSection } from '@/app/components/marketing/sections/hero-section';
import { CategoriesSection } from '@/app/components/marketing/sections/categories-section';
import { QrSection } from '@/app/components/marketing/sections/qr-section';
import { FeaturesSection } from '@/app/components/marketing/sections/features-section';
import { SocialProofSection } from '@/app/components/marketing/sections/social-proof-section';
import { CtaSection } from '@/app/components/marketing/sections/cta-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <QrSection />
      <FeaturesSection />
      <SocialProofSection />
      <CtaSection />
    </>
  );
}
