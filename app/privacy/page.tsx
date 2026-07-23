import { SectionHeader } from '@/app/components/marketing/section-header';

export default function PrivacyPage() {
  return (
    <div className="bg-primary-dark py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Legal"
          headline="Privacy Policy"
          subheadline="Last updated: July 2026"
          align="left"
          className="mb-12 !text-left !mx-0"
        />
        <div className="prose prose-invert max-w-none space-y-6 text-body-ds">
          <p>
            SmartTags (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our
            asset management platform.
          </p>
          <h2 className="text-h4 text-text-primary">Information We Collect</h2>
          <p>
            We collect information you provide directly, such as account registration details, asset data,
            and communication preferences. We also collect usage data to improve our services.
          </p>
          <h2 className="text-h4 text-text-primary">How We Use Your Information</h2>
          <p>
            Your information is used to provide and improve our services, communicate with you, ensure
            security, and comply with legal obligations.
          </p>
          <h2 className="text-h4 text-text-primary">Data Security</h2>
          <p>
            We implement enterprise-grade security measures including encryption, access controls, and
            regular security audits to protect your data.
          </p>
          <h2 className="text-h4 text-text-primary">Contact Us</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:hello@smarttags.io" className="text-accent-teal hover:underline">
              hello@smarttags.io
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
