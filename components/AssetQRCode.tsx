'use client';

import { useState, useEffect, useId } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface AssetQRCodeProps {
  assetNumber: string;
  assetDescription?: string;
  assetType?:
    | 'mme'
    | 'fixedasset'
    | 'softwareasset'
    | 'transportasset'
    | 'facilityasset'
    | 'portableasset'
    | 'Tool'
    | 'Zero-Value Material'
    | 'Project Issued Material'
    | 'Project Return Material';
}

function buildAssetUrl(origin: string, assetNumber: string, assetType: NonNullable<AssetQRCodeProps['assetType']>) {
  const enc = encodeURIComponent(assetNumber);
  switch (assetType) {
    case 'fixedasset':
      return `${origin}/fixedasset/${enc}`;
    case 'softwareasset':
      return `${origin}/fixedasset/software-assets/${enc}`;
    case 'transportasset':
      return `${origin}/fixedasset/transport-assets/${enc}`;
    case 'facilityasset':
      return `${origin}/fixedasset/facility-assets/${enc}`;
    case 'portableasset':
      return `${origin}/fixedasset/portable-assets/${enc}`;
    case 'Tool':
      return `${origin}/tools/${enc}`;
    case 'Zero-Value Material':
      return `${origin}/zerovalmaterials/${enc}`;
    case 'Project Issued Material':
      return `${origin}/projectissued-materials/${enc}`;
    case 'Project Return Material':
      return `${origin}/projectreturn-materials/${enc}`;
    case 'mme':
    default:
      return `${origin}/asset/${enc}`;
  }
}

export const AssetQRCode = ({ assetNumber, assetDescription, assetType = 'mme' }: AssetQRCodeProps) => {
  const [qrUrl, setQrUrl] = useState('');
  const reactId = useId();
  const domSafeId = `qr-${reactId.replace(/:/g, '')}-${assetNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  useEffect(() => {
    setQrUrl(buildAssetUrl(window.location.origin, assetNumber, assetType));
  }, [assetNumber, assetType]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const node = document.getElementById(domSafeId);
      printWindow.document.write(`
        <html>
          <head>
            <title>Asset QR Code - ${assetNumber}</title>
          </head>
          <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <div style="text-align: center;">
              <h2 style="font-size: 2em;">${assetDescription || 'Asset'}: ${assetNumber}</h2>
              <p style="font-size: 0.95em; word-break: break-all; max-width: 90vw;">${qrUrl}</p>
              <svg width="400" height="400">
                ${node?.innerHTML
                    .replace(/width="32"/, 'width="400"')
                    .replace(/height="32"/, 'height="400"')}
              </svg>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <a
        href={qrUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        id={domSafeId}
        className="inline-flex shrink-0 rounded border border-gray-200 dark:border-gray-600 p-0.5 hover:bg-gray-50 dark:hover:bg-gray-800"
        title="Open asset page (same URL encoded in QR)"
        onClick={(e) => {
          if (!qrUrl) e.preventDefault();
        }}
      >
        {qrUrl ? <QRCodeSVG value={qrUrl} size={32} level="H" /> : <span className="inline-block h-8 w-8 bg-gray-100 dark:bg-gray-800" />}
      </a>
      <button
        type="button"
        onClick={handlePrint}
        disabled={!qrUrl}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-40"
        title="Print QR Code"
      >
        <PrinterIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
};

export default AssetQRCode;
