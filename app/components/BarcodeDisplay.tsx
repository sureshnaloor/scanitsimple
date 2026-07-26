// app/components/BarcodeDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface BarcodeDisplayProps {
  value: string;
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

/**
 * Renders a scannable QR code. Clicking it opens a modal showing
 * full details from all three collections (material, transaction, storage).
 */
export default function BarcodeDisplay({ value }: BarcodeDisplayProps) {
  const [showModal, setShowModal] = useState(false);
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [storage, setStorage] = useState<StorageDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  if (!value) return null;

  // Parse the pipe-delimited value: materialId|transactionId|storageId
  const [materialId] = value.split('|');

  const fetchDetails = async () => {
    if (!materialId) return;
    setLoadingDetails(true);
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
    } catch {
      // silently fail
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpen = () => {
    setShowModal(true);
    fetchDetails();
  };

  // Build a rich data string for QR — JSON with all relevant fields
  const qrPayload = JSON.stringify({
    materialId,
    app: 'ScanItSimple',
    url: typeof window !== 'undefined'
      ? `${window.location.origin}/inventory/materials?highlight=${materialId}`
      : value,
  });

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleOpen}
        title="Click to view full material details"
      >
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            value={qrPayload}
            size={200}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="text-xs text-center text-blue-500 dark:text-blue-400 font-medium">
          Click to view details
        </p>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Material Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div className="text-center py-8 text-gray-500">Loading details...</div>
            ) : (
              <div className="space-y-5">
                {/* Material Section */}
                <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <legend className="text-sm font-semibold px-2 text-blue-600 dark:text-blue-400">
                    Material
                  </legend>
                  {material ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <DetailRow label="Code" value={material.code} />
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
                        <div className="col-span-2">
                          <DetailRow label="Long Text" value={material.longText} />
                        </div>
                      )}
                      {material.remarks && (
                        <div className="col-span-2">
                          <DetailRow label="Remarks" value={material.remarks} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No material data found</p>
                  )}
                </fieldset>

                {/* Transaction Section */}
                <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <legend className="text-sm font-semibold px-2 text-green-600 dark:text-green-400">
                    Transaction
                  </legend>
                  {transactions.length > 0 ? (
                    transactions.map((tx, i) => (
                      <div key={tx._id || i} className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3 last:mb-0">
                        <DetailRow label="PO Number" value={tx.poNumber} />
                        <DetailRow label="PO Line Item" value={tx.poLineItem} />
                        <DetailRow label="Cost Element" value={tx.costElement} />
                        <DetailRow label="Order Quantity" value={tx.orderQuantity != null ? String(tx.orderQuantity) : ''} />
                        <DetailRow label="Batch Number" value={tx.batchNumber} />
                        <DetailRow label="Created" value={tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No transaction records</p>
                  )}
                </fieldset>

                {/* Storage Section */}
                <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <legend className="text-sm font-semibold px-2 text-amber-600 dark:text-amber-400">
                    Storage Location
                  </legend>
                  {storage.length > 0 ? (
                    storage.map((st, i) => (
                      <div key={st._id || i} className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3 last:mb-0">
                        <DetailRow label="Rack Number" value={st.rackNumber} />
                        <DetailRow label="Bin Number" value={st.binNumber} />
                        <DetailRow label="Room Number" value={st.roomNumber} />
                        <DetailRow label="Pallet Number" value={st.palletNumber} />
                        <DetailRow label="Yard Number" value={st.yardNumber} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No storage location records</p>
                  )}
                </fieldset>

                {/* QR code preview */}
                <div className="flex justify-center pt-2">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCodeSVG
                      value={qrPayload}
                      size={120}
                      level="H"
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>{' '}
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {value || '—'}
      </span>
    </div>
  );
}
