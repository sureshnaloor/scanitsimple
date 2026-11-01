'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrDemoProps {
  defaultValue?: string;
  className?: string;
}

export function QrDemo({ defaultValue = 'MME-2041-CAT320', className }: QrDemoProps) {
  const [qrText, setQrText] = useState(defaultValue);

  return (
    <div
      className={cn(
        'service-card border border-line bg-white p-8 text-center shadow-cardhover',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-epc-secondary">
        <span>Interactive QR Studio</span>
        <span className="flex items-center gap-1 text-golddeep">
          <ScanLine size={12} /> Live Preview
        </span>
      </div>
      <h3 className="mb-6 font-display text-xl font-bold text-epc-primary">
        Generate Any Asset Tag
      </h3>

      <div className="relative mx-auto mb-5 flex size-[210px] items-center justify-center bg-mist p-5">
        {/* Corner brackets */}
        {[
          'left-0 top-0 border-l-4 border-t-4',
          'right-0 top-0 border-r-4 border-t-4',
          'bottom-0 left-0 border-b-4 border-l-4',
          'bottom-0 right-0 border-b-4 border-r-4',
        ].map((pos, i) => (
          <span key={i} className={`absolute h-6 w-6 border-gold ${pos}`} />
        ))}
        <div className="bg-white p-3 shadow-sm">
          <QRCodeSVG value={qrText || defaultValue} size={156} fgColor="#05052D" />
        </div>
        <span className="scanline pointer-events-none absolute left-2 right-2 h-0.5 bg-gold shadow-[0_0_12px_rgba(252,188,69,0.9)]" />
      </div>

      <p className="mb-6 font-mono text-xs font-semibold uppercase tracking-wider text-navy">
        Asset Tag ID: <span className="text-epc-secondary">{qrText || defaultValue}</span>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={qrText}
          onChange={(e) => setQrText(e.target.value)}
          placeholder="Enter asset ID (e.g. MME-2041)..."
          className="flex-1 border border-line bg-mist px-4 py-3 text-sm font-medium text-navy placeholder:text-body/50 focus:border-epc-secondary focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setQrText(qrText || defaultValue)}
          className="btn-gold justify-center !px-6 !py-3 text-xs"
        >
          Generate
        </button>
      </div>
    </div>
  );
}
