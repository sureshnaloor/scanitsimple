import { HeroSection } from '@/app/components/marketing/sections/hero-section';
import { ProblemSection, HowItWorksSection } from '@/app/components/marketing/sections/problem-how-section';
import { CategoriesSection } from '@/app/components/marketing/sections/categories-section';
import { FeaturesSection } from '@/app/components/marketing/sections/features-section';
import { ShowcaseSection } from '@/app/components/marketing/sections/showcase-section';
import { QrSection } from '@/app/components/marketing/sections/qr-section';
import { IndustriesRoiSection } from '@/app/components/marketing/sections/industries-roi-section';
import { SocialProofSection } from '@/app/components/marketing/sections/social-proof-section';
import { PricingFaqSection } from '@/app/components/marketing/sections/pricing-faq-section';
import { CtaSection } from '@/app/components/marketing/sections/cta-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ShowcaseSection />
      <CategoriesSection />
      <QrSection />
      <IndustriesRoiSection />
      <SocialProofSection />
      <PricingFaqSection />
      <CtaSection />
    </>
  );
}
