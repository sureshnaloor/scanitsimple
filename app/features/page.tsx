'use client';

import Link from 'next/link';
import {
  QrCode,
  MapPin,
  Wrench,
  Users,
  BarChart3,
  Smartphone,
  Plug,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { SectionHeader } from '@/app/components/marketing/section-header';
import { FadeUp } from '@/app/components/marketing/fade-up';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const featureDetails = [
  {
    icon: QrCode,
    label: 'QR Management',
    title: 'QR Code Management',
    description:
      'Generate, print, and manage QR codes for every asset in your organization. Batch generation, custom branding, and instant scan-to-detail workflows.',
    benefits: ['Batch QR generation', 'Custom branded codes', 'Mobile scan support', 'Print-ready labels'],
  },
  {
    icon: MapPin,
    label: 'Tracking',
    title: 'Real-time Tracking',
    description:
      'Know where every asset is with GPS precision, indoor positioning, and geofencing. Location history and movement alerts keep you informed.',
    benefits: ['GPS & indoor positioning', 'Geofencing alerts', 'Location history', 'Map visualization'],
  },
  {
    icon: Wrench,
    label: 'Maintenance',
    title: 'Maintenance Automation',
    description:
      'Never miss a calibration or preventive maintenance window. Automated scheduling, work orders, and vendor coordination built in.',
    benefits: ['Automated scheduling', 'Work order management', 'Vendor coordination', 'Calibration tracking'],
  },
  {
    icon: Users,
    label: 'Custody',
    title: 'Custodian & Permissions',
    description:
      'Assign custodians with role-based permissions, transfer workflows, and full accountability chains for every asset.',
    benefits: ['Role-based access', 'Transfer workflows', 'Custody history', 'Undertaking letters'],
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    title: 'Analytics & Reporting',
    description:
      'Customizable dashboards, utilization reports, cost analysis, and compliance tracking for data-driven decisions.',
    benefits: ['Custom dashboards', 'Utilization reports', 'Cost analysis', 'Compliance tracking'],
  },
  {
    icon: Smartphone,
    label: 'Mobile',
    title: 'Mobile App',
    description:
      'Full mobile support with QR scanning, offline capabilities, and field data collection for teams on the go.',
    benefits: ['QR scanning', 'Offline mode', 'Field data collection', 'Push notifications'],
  },
  {
    icon: Plug,
    label: 'Integrations',
    title: 'Integrations',
    description:
      'Connect SmartTags with your ERP, HR, and accounting systems via API and pre-built connectors.',
    benefits: ['REST API access', 'ERP connectors', 'SSO support', 'Webhook events'],
  },
  {
    icon: ShieldCheck,
    label: 'Security',
    title: 'Security & Compliance',
    description:
      'Enterprise-grade security with audit trails, compliance monitoring, and regulatory reporting capabilities.',
    benefits: ['Audit trails', 'SOC 2 ready', 'GDPR compliant', 'Role-based security'],
  },
];

const comparisonRows = [
  { feature: 'Real-time tracking', smarttags: true, spreadsheets: false, legacy: true },
  { feature: 'QR code generation', smarttags: true, spreadsheets: false, legacy: false },
  { feature: 'Maintenance scheduling', smarttags: true, spreadsheets: false, legacy: true },
  { feature: 'Mobile access', smarttags: true, spreadsheets: false, legacy: false },
  { feature: 'Analytics dashboard', smarttags: true, spreadsheets: false, legacy: true },
  { feature: 'Easy setup', smarttags: true, spreadsheets: true, legacy: false },
  { feature: 'Low cost', smarttags: true, spreadsheets: true, legacy: false },
];

export default function FeaturesPage() {
  return (
    <div className="bg-primary-dark">
      <section className="bg-hero-gradient grid-pattern py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeUp>
            <h1 className="text-h1 mb-4">Everything You Need to Manage Assets</h1>
            <p className="text-body-ds">
              From tracking to compliance, every feature designed for scale.
            </p>
          </FadeUp>
        </div>
      </section>

      {featureDetails.map((feature, index) => {
        const Icon = feature.icon;
        const imageLeft = index % 2 === 0;
        return (
          <section
            key={feature.title}
            className={index % 2 === 0 ? 'bg-primary-dark py-24' : 'bg-primary-navy py-24'}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${!imageLeft ? 'lg:[direction:rtl]' : ''}`}>
                <FadeUp className={!imageLeft ? 'lg:[direction:ltr]' : ''}>
                  <div className="flex h-64 items-center justify-center rounded-xl border border-primary-light bg-primary-slate lg:h-80">
                    <Icon className="size-24 text-accent-teal/40" />
                  </div>
                </FadeUp>
                <FadeUp delay={0.1} className={!imageLeft ? 'lg:[direction:ltr]' : ''}>
                  <span className="mb-3 inline-block text-caption uppercase tracking-wider text-accent-teal">
                    {feature.label}
                  </span>
                  <h2 className="text-h2 mb-4">{feature.title}</h2>
                  <p className="mb-6 text-body-ds">{feature.description}</p>
                  <ul className="mb-8 space-y-2">
                    {feature.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="size-4 text-success" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Button variant="cta-secondary" asChild>
                    <Link href="/contact">See it in Action</Link>
                  </Button>
                </FadeUp>
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-primary-dark py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Compare"
            headline="SmartTags vs. The Alternatives"
            className="mb-12"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-light">
                  <th className="py-4 text-left text-text-muted">Feature</th>
                  <th className="border-x border-accent-teal/30 bg-accent-teal/5 py-4 text-center font-semibold text-accent-teal">
                    SmartTags
                  </th>
                  <th className="py-4 text-center text-text-muted">Spreadsheets</th>
                  <th className="py-4 text-center text-text-muted">Legacy Systems</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-primary-light/50">
                    <td className="py-4 text-text-secondary">{row.feature}</td>
                    <td className="border-x border-accent-teal/30 bg-accent-teal/5 py-4 text-center">
                      {row.smarttags ? (
                        <Check className="mx-auto size-5 text-success" />
                      ) : (
                        <X className="mx-auto size-5 text-error" />
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {row.spreadsheets ? (
                        <Check className="mx-auto size-5 text-success" />
                      ) : (
                        <X className="mx-auto size-5 text-text-muted" />
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {row.legacy ? (
                        <Check className="mx-auto size-5 text-success" />
                      ) : (
                        <X className="mx-auto size-5 text-text-muted" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
