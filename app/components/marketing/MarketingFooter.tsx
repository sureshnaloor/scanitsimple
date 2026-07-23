import Link from 'next/link';

import SmartTagsLogo from '@/app/components/SmartTagsLogo';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'QR Codes', href: '/#demo' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/#about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security', href: '/privacy' },
      { label: 'Compliance', href: '/privacy' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-primary-light bg-primary-navy py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <SmartTagsLogo variant="primary" height={40} className="max-w-[200px]" />
            </div>
            <p className="text-body-sm-ds mb-4">
              Asset and Equipment Tagging Solutions
            </p>
            <div className="flex gap-3">
              {['LinkedIn', 'Twitter', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="rounded-md bg-primary-slate px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-accent-teal"
                  aria-label={social}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-accent-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-light pt-8 sm:flex-row">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} SmartTags. All rights reserved.
          </p>
          <p className="text-xs text-text-muted italic">Made with precision.</p>
        </div>
      </div>
    </footer>
  );
}
