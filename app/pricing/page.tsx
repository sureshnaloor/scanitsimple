'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { SectionHeader } from '@/app/components/marketing/section-header';
import { FadeUp } from '@/app/components/marketing/fade-up';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for small teams getting started',
    features: ['Up to 100 assets', 'Basic QR codes', 'Email support', 'Mobile app'],
    cta: 'Get Started Free',
    highlighted: false,
    href: '/auth/register',
  },
  {
    name: 'Professional',
    price: { monthly: 59, annual: 49 },
    description: 'For growing organizations',
    features: [
      'Up to 5,000 assets',
      'Custom QR branding',
      'Maintenance scheduling',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
    href: '/auth/register',
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'For large-scale operations',
    features: [
      'Unlimited assets',
      'API access',
      'SSO & SAML',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    href: '/contact',
  },
];

const faqs = [
  {
    q: 'Can I change plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Professional plan includes a 14-day free trial with full access to all features. No credit card required.',
  },
  {
    q: 'What happens when I exceed asset limits?',
    a: 'We will notify you when approaching your limit. You can upgrade your plan or contact us for a custom arrangement.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes, all plans include data export in Excel and CSV formats. Enterprise plans also include API access for automated exports.',
  },
  {
    q: 'How secure is my data?',
    a: 'We use enterprise-grade encryption, regular security audits, and comply with SOC 2 Type II and GDPR requirements.',
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="bg-primary-dark">
      <section className="bg-hero-gradient grid-pattern py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeUp>
            <h1 className="text-h1 mb-4">Simple, Transparent Pricing</h1>
            <p className="mb-8 text-body-ds">
              Start free, scale as you grow. No hidden fees.
            </p>
            <div className="inline-flex items-center gap-3 rounded-full border border-primary-light bg-primary-navy p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  !annual ? 'bg-accent-teal text-white' : 'text-text-secondary'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  annual ? 'bg-accent-teal text-white' : 'text-text-secondary'
                )}
              >
                Annual <span className="text-xs opacity-80">(save 20%)</span>
              </button>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-3 sm:px-6 lg:px-8">
          {plans.map((plan) => (
            <FadeUp key={plan.name}>
              <Card
                variant={plan.highlighted ? 'glass' : 'feature'}
                className={cn(
                  'relative flex h-full flex-col p-8',
                  plan.highlighted && 'shadow-glow-teal ring-1 ring-accent-teal/30'
                )}
              >
                {plan.badge && (
                  <Badge variant="orange" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {plan.badge}
                  </Badge>
                )}
                <h3 className="text-h4 mb-2">{plan.name}</h3>
                <p className="mb-6 text-sm text-text-muted">{plan.description}</p>
                <div className="mb-6">
                  {plan.price.monthly === null ? (
                    <span className="text-stat text-accent-teal">Custom</span>
                  ) : plan.price.monthly === 0 ? (
                    <span className="text-stat text-accent-teal">$0</span>
                  ) : (
                    <span className="text-stat text-accent-teal">
                      ${annual ? plan.price.annual : plan.price.monthly}
                      <span className="text-base font-normal text-text-muted">/mo</span>
                    </span>
                  )}
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'cta' : 'cta-secondary'}
                  className="w-full"
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </Card>
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="border-t border-primary-light py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6 px-4 text-center text-sm text-text-muted sm:px-6">
          {['SOC 2 Type II Certified', 'GDPR Compliant', '99.9% Uptime SLA', '24/7 Support'].map(
            (item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="size-4 text-success" />
                {item}
              </span>
            )
          )}
        </div>
      </section>

      <section className="bg-primary-navy py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader label="FAQ" headline="Frequently Asked Questions" className="mb-12" />
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
