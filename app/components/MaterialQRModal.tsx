// app/components/MaterialQRModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MaterialQRModalProps {
  materialId: string;
  onClose: () => void;
}

interface MaterialDetail {
  _id?: string;
  code?: string;
  description?: string;
  baseUOM?: string;
  orderUOM?: string;
  skuUOM?: string;
  longText?: string;
  materialType?: string;
  materialGroup?: string;
  mrpRelevant?: boolean;
  specialStock?: boolean;
  remarks?: string;
  status?: string;
  [key: string]: unknown;
}

interface TransactionDetail {
  _id?: string;
  materialId?: string;
  costElement?: string;
  poNumber?: string;
  poLineItem?: string;
  orderQuantity?: number;
  batchNumber?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface StorageDetail {
  _id?: string;
  materialId?: string;
  rackNumber?: string;
  binNumber?: string;
  roomNumber?: string;
  palletNumber?: string;
  yardNumber?: string;
  [key: string]: unknown;
}

export default function MaterialQRModal({ materialId, onClose }: MaterialQRModalProps) {
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [storage, setStorage] = useState<StorageDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!materialId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [matRes, txRes, stRes] = await Promise.all([
          fetch('/api/materials'),
          fetch(`/api/material-transactions?materialId=${materialId}`),
          fetch(`/api/material-storage?materialId=${materialId}`),
        ]);

        if (matRes.ok) {
          const allMats = await matRes.json();
          const arr = Array.isArray(allMats) ? allMats : [];
          const found = arr.find((m: MaterialDetail) => m._id === materialId);
          setMaterial(found || null);
        }

        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(Array.isArray(txData) ? txData : []);
        }

        if (stRes.ok) {
          const stData = await stRes.json();
          setStorage(Array.isArray(stData) ? stData : []);
        }
      } catch (error) {
        console.error('Failed to load material details for QR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [materialId]);

  // Build the scanning URL that will automatically open this modal when scanned by mobile
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/inventory/materials?qr=${materialId}`
    : `materials?qr=${materialId}`;

  // Encoded JSON for scanning integration
  const qrPayload = JSON.stringify({
    materialId,
    app: 'ScanItSimple',
    url: qrUrl,
  });

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Material QR Code &amp; Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-2xl font-bold leading-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scannable QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={qrPayload}
                  size={180}
                  level="H"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="text-[11px] font-mono mt-3 text-gray-500 dark:text-gray-400 break-all text-center max-w-xs">
                {qrUrl}
              </p>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                Scan with mobile camera to view details instantly
              </p>
            </div>

            {/* Material Section */}
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="text-xs font-bold uppercase tracking-wider px-2 text-blue-600 dark:text-blue-400">
                Material Master Info
              </legend>
              {material ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <DetailRow label="Material ID" value={material._id} isMono />
                  <DetailRow label="Code" value={material.code} isMono />
                  <DetailRow label="Description" value={material.description} />
                  <DetailRow label="Base UOM" value={material.baseUOM} />
                  <DetailRow label="Order UOM" value={material.orderUOM} />
                  <DetailRow label="SKU UOM" value={material.skuUOM} />
                  <DetailRow label="Material Type" value={material.materialType} />
                  <DetailRow label="Material Group" value={material.materialGroup} />
                  <DetailRow label="Status" value={material.status} />
                  <DetailRow label="MRP Relevant" value={material.mrpRelevant ? 'Yes' : 'No'} />
                  <DetailRow label="Special Stock" value={material.specialStock ? 'Yes' : 'No'} />
                  {material.longText && (
                    <div className="col-span-1 md:col-span-2">
                      <DetailRow label="Long Text" value={material.longText} />
                    </div>
                  )}
                  {material.remarks && (
                    <div className="col-span-1 md:col-span-2">
                      <DetailRow label="Remarks" value={material.remarks} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No material record found</p>
              )}
            </fieldset>

            {/* Transaction Section */}
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="text-xs font-bold uppercase tracking-wider px-2 text-green-600 dark:text-green-400">
                Transaction Info
              </legend>
              {transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <div key={tx._id || i} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                    <DetailRow label="PO Number" value={tx.poNumber} />
                    <DetailRow label="PO Line Item" value={tx.poLineItem} />
                    <DetailRow label="Cost Element" value={tx.costElement} />
                    <DetailRow label="Order Quantity" value={tx.orderQuantity != null ? String(tx.orderQuantity) : ''} />
                    <DetailRow label="Batch Number" value={tx.batchNumber} isMono />
                    <DetailRow label="Receipt Date" value={tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No transaction records associated with this material</p>
              )}
            </fieldset>

            {/* Storage Section */}
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="text-xs font-bold uppercase tracking-wider px-2 text-amber-600 dark:text-amber-400">
                Storage &amp; Warehouse Location
              </legend>
              {storage.length > 0 ? (
                storage.map((st, i) => (
                  <div key={st._id || i} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                    <DetailRow label="Rack Number" value={st.rackNumber} />
                    <DetailRow label="Bin Number" value={st.binNumber} />
                    <DetailRow label="Room Number" value={st.roomNumber} />
                    <DetailRow label="Pallet Number" value={st.palletNumber} />
                    <DetailRow label="Yard Number" value={st.yardNumber} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No storage locations assigned</p>
              )}
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, isMono = false }: { label: string; value?: string; isMono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-50 dark:border-gray-800/30 last:border-0">
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className={`font-semibold text-gray-900 dark:text-gray-100 ${isMono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}
