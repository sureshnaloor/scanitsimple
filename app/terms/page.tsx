import { SectionHeader } from '@/app/components/marketing/section-header';

export default function TermsPage() {
  return (
    <div className="bg-primary-dark py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Legal"
          headline="Terms of Service"
          subheadline="Last updated: July 2026"
          align="left"
          className="mb-12 !text-left !mx-0"
        />
        <div className="space-y-6 text-body-ds">
          <p>
            By accessing or using SmartTags, you agree to be bound by these Terms of Service.
            Please read them carefully before using our platform.
          </p>
          <h2 className="text-h4 text-text-primary">Use of Service</h2>
          <p>
            SmartTags provides asset and equipment management tools for authorized users.
            You are responsible for maintaining the confidentiality of your account credentials.
          </p>
          <h2 className="text-h4 text-text-primary">Acceptable Use</h2>
          <p>
            You agree not to misuse the platform, attempt unauthorized access, or use the service
            in violation of applicable laws or regulations.
          </p>
          <h2 className="text-h4 text-text-primary">Limitation of Liability</h2>
          <p>
            SmartTags is provided &quot;as is&quot; without warranties. We are not liable for indirect
            or consequential damages arising from use of the service.
          </p>
          <h2 className="text-h4 text-text-primary">Contact</h2>
          <p>
            Questions about these terms? Email{' '}
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
