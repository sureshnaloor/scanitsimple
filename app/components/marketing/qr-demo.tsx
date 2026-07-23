'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QrDemoProps {
  defaultValue?: string;
  className?: string;
}

export function QrDemo({ defaultValue = 'SMART-ASSET-DEMO', className }: QrDemoProps) {
  const [qrText, setQrText] = useState(defaultValue);
  const [hovered, setHovered] = useState(false);

  return (
    <div className={cn('glass-card p-8 text-center', className)}>
      <h3 className="text-h4 mb-6">Live QR Code Demo</h3>
      <div
        className={cn(
          'mx-auto mb-4 flex size-[200px] items-center justify-center rounded-lg bg-white p-4 transition-all duration-300',
          hovered && 'border-2 border-accent-teal shadow-glow-teal'
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <QRCodeSVG value={qrText} size={168} />
      </div>
      <p className="font-mono text-caption text-text-muted mb-6">
        QR Code for: {qrText}
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={qrText}
          onChange={(e) => setQrText(e.target.value)}
          placeholder="Enter asset ID..."
          className="flex-1 rounded-md border border-primary-light bg-primary-slate px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-teal focus:outline-none focus:shadow-glow-teal"
        />
        <button
          type="button"
          onClick={() => setQrText(qrText || defaultValue)}
          className="rounded-full bg-cta-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow-orange transition-all hover:-translate-y-0.5"
        >
          Generate
        </button>
      </div>
    </div>
  );
}
