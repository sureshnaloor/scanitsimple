'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { SectionHeader } from '../section-header';

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

const PLANS = [
  {
    name: 'Starter',
    monthly: 0,
    annual: 0,
    desc: 'Perfect for small teams getting started',
    features: ['Up to 100 assets', 'Basic QR codes', 'Email support', 'Mobile web scanner'],
    cta: 'Get Started Free',
    href: '/auth/register',
    highlighted: false,
  },
  {
    name: 'Professional',
    monthly: 59,
    annual: 49,
    desc: 'For growing project & warehouse operations',
    features: [
      'Up to 5,000 assets',
      'Custom QR branding',
      'Calibration & maintenance scheduling',
      'Live operations dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/auth/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    annual: null,
    desc: 'For large-scale multi-site EPC operations',
    features: [
      'Unlimited assets',
      'API access & ERP connectors',
      'SSO & SAML',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: 'Do my teams need to install a special app to scan?',
    a: 'No. Standard smartphones use their native camera or web browser to scan a tag and view records based on their login credentials — no client installs, no dedicated hardware.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. The Professional plan includes a 14-day free trial with full access to all features. No credit card required. The Starter plan is free forever for up to 100 assets.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What happens when I exceed asset limits?',
    a: 'We notify you as you approach your limit. You can upgrade your plan, or contact us for a custom arrangement that fits your operation.',
  },
  {
    q: 'Can I export my data?',
    a: 'All plans include data export in Excel and CSV formats. Enterprise plans also include API access for automated exports and integrations with your ERP, HR or accounting systems.',
  },
  {
    q: 'How secure is my data?',
    a: 'We use enterprise-grade encryption, regular security audits, and comply with SOC 2 Type II and GDPR requirements. Role-based authorization keeps sensitive records visible only to cleared users.',
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-line bg-white transition-shadow hover:shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-[15px] font-bold text-epc-primary">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-golddeep transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-body">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingFaqSection() {
  const [annual, setAnnual] = useState(true);
  const [open, setOpen] = useState(0);

  return (
    <>
      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-mist py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            align="center"
            label="Simple, transparent pricing"
            headline="Start free. Scale as you grow."
            subheadline="No hidden fees, no per-scan charges — pick the register size that fits your operation."
          />

          <motion.div {...reveal} className="mb-12 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-line bg-white p-1 shadow-card">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 font-display text-sm font-semibold transition-colors ${
                  !annual ? 'bg-epc-primary text-white' : 'text-body'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 font-display text-sm font-semibold transition-colors ${
                  annual ? 'bg-epc-primary text-white' : 'text-body'
                }`}
              >
                Annual <span className="text-xs opacity-80">(save ~17%)</span>
              </button>
            </div>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.name}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className={`relative flex flex-col bg-white p-8 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-cardhover ${
                  p.highlighted ? 'ring-2 ring-gold' : 'border border-line'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-epc-primary">{p.name}</h3>
                <p className="mt-1.5 text-sm text-body">{p.desc}</p>
                <div className="mt-6">
                  {p.monthly === null ? (
                    <span className="font-display text-5xl font-extrabold text-epc-primary">
                      Custom
                    </span>
                  ) : p.monthly === 0 ? (
                    <span className="font-display text-5xl font-extrabold text-epc-primary">
                      $0
                    </span>
                  ) : (
                    <span className="font-display text-5xl font-extrabold text-epc-primary">
                      ${annual ? p.annual : p.monthly}
                      <span className="text-base font-normal text-body">/mo</span>
                    </span>
                  )}
                  {p.monthly !== null && p.monthly !== 0 && (
                    <div className="mt-1 text-xs text-body/70">
                      {annual ? 'billed annually' : 'billed monthly'}
                    </div>
                  )}
                </div>
                <ul className="mt-7 flex-1 space-y-3 border-t border-line pt-6">
                  {p.features.map((f) => (
                    <li key={f} className="check-item">
                      <span className="check-badge">
                        <Check size={10} strokeWidth={3.5} className="text-golddeep" />
                      </span>
                      <span className="text-[13px]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`${
                    p.highlighted ? 'btn-gold' : 'btn-outline'
                  } mt-8 justify-center !px-6`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeader
            align="center"
            label="Questions, answered"
            headline="Frequently asked questions"
          />
          <motion.div {...reveal} className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                open={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
