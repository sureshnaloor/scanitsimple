'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FadeUp } from '@/app/components/marketing/fade-up';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-primary-dark py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <FadeUp>
            <h1 className="text-h1 mb-4">Let&apos;s Talk About Your Assets</h1>
            <p className="mb-10 text-body-ds">
              Schedule a personalized demo or reach out to our team.
            </p>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'hello@smarttags.io', href: 'mailto:hello@smarttags.io' },
                { icon: Phone, label: '+1 (555) 123-4567', href: 'tel:+15551234567' },
                { icon: MapPin, label: 'Enterprise Asset Management HQ', href: null },
              ].map(({ icon: Icon, label, href }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary-slate">
                    <Icon className="size-5 text-accent-teal" />
                  </div>
                  {href ? (
                    <a href={href} className="text-text-secondary hover:text-accent-teal transition-colors">
                      {label}
                    </a>
                  ) : (
                    <span className="text-text-secondary">{label}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 flex gap-4">
              {['LinkedIn', 'Twitter', 'GitHub'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-md border border-primary-light px-4 py-2 text-sm text-text-muted hover:border-accent-teal hover:text-accent-teal transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <Card variant="glass" className="p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <h2 className="text-h3 mb-4 text-success">Request Received!</h2>
                  <p className="text-body-ds">
                    Thank you for your interest. Our team will contact you within 1 business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-h4 mb-6">Request a Demo</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input placeholder="Full Name" required />
                    <Input type="email" placeholder="Work Email" required />
                  </div>
                  <Input placeholder="Company Name" required />
                  <Input type="tel" placeholder="Phone Number" />
                  <select
                    required
                    className="flex h-11 w-full rounded-md border border-primary-light bg-primary-slate px-4 py-3 text-sm text-text-primary focus:border-accent-teal focus:outline-none focus:shadow-glow-teal"
                    defaultValue=""
                  >
                    <option value="" disabled>Company Size</option>
                    <option value="1-50">1–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-1000">201–1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                  <Textarea placeholder="Tell us about your asset management needs..." rows={4} />
                  <Button variant="cta" type="submit" className="w-full">
                    Request Demo
                  </Button>
                  <p className="text-center text-xs text-text-muted">
                    We respect your privacy. No spam, ever.
                  </p>
                </form>
              )}
            </Card>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
