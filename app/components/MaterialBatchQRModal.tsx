// app/components/MaterialBatchQRModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MaterialBatchQRModalProps {
  batchId: string;
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
  receivedQuantity?: number;
  batchNumber?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface StorageLocationDetail {
  _id?: string;
  name?: string;
  incharge?: string;
  remarks?: string;
}

interface IssueDetail {
  _id?: string;
  batchId?: string;
  quantity?: number;
  issueDate?: string;
  entryDate?: string;
  issuedBy?: string;
  receivedBy?: string;
  transportMode?: string;
  drawingNumber?: string;
  usageLocation?: string;
  remarks?: string;
}

export default function MaterialBatchQRModal({ batchId, onClose }: MaterialBatchQRModalProps) {
  const [batch, setBatch] = useState<any>(null);
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [storageLocMaster, setStorageLocMaster] = useState<StorageLocationDetail | null>(null);
  const [issueHistory, setIssueHistory] = useState<IssueDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const batchRes = await fetch(`/api/material-batches?id=${batchId}`);
        if (!batchRes.ok) throw new Error('Failed to load batch');

        const batchData = await batchRes.json();
        setBatch(batchData);

        if (batchData) {
          const { materialId, transactionId, storageLocationId } = batchData;

          const [matRes, txRes, locRes, issueRes] = await Promise.all([
            fetch('/api/materials'),
            fetch('/api/material-transactions'),
            fetch('/api/storage-locations'),
            fetch(`/api/material-batch-issues?batchId=${batchId}`),
          ]);

          if (matRes.ok) {
            const allMats = await matRes.json();
            const arr = Array.isArray(allMats) ? allMats : [];
            const found = arr.find((m: MaterialDetail) => m._id === materialId);
            setMaterial(found || null);
          }

          if (txRes.ok) {
            const allTxs = await txRes.json();
            const arr = Array.isArray(allTxs) ? allTxs : [];
            const found = arr.find((tx: TransactionDetail) => tx._id === transactionId);
            setTransaction(found || null);
          }

          if (locRes.ok && storageLocationId) {
            const allLocs = await locRes.json();
            const arr = Array.isArray(allLocs) ? allLocs : [];
            const found = arr.find((loc: StorageLocationDetail) => loc._id === storageLocationId);
            setStorageLocMaster(found || null);
          }

          if (issueRes.ok) {
            const issues = await issueRes.json();
            setIssueHistory(Array.isArray(issues) ? issues : []);
          }
        }
      } catch (error) {
        console.error('Failed to load material batch details for QR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [batchId]);

  // Build the scanning URL that will automatically open this modal when scanned by mobile
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/inventory/materials/batches?qr=${batchId}`
    : `materials/batches?qr=${batchId}`;

  // Encoded JSON for scanning integration
  const qrPayload = JSON.stringify({
    batchId,
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
            Material Batch QR Code &amp; Details
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading batch details...</span>
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
                Scan with mobile camera to view batch details instantly
              </p>
            </div>

            {/* Quantities Status */}
            {batch && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                <div className="text-center border-r border-slate-200 dark:border-slate-800">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Initial Batch Quantity</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono mt-1">{batch.initialQuantity}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Current Available Quantity</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">{batch.currentQuantity}</div>
                </div>
              </div>
            )}

            {/* Material Section */}
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="text-xs font-bold uppercase tracking-wider px-2 text-blue-600 dark:text-blue-400">
                Linked Material Master Info
              </legend>
              {material ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
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
                Linked Transaction Batch
              </legend>
              {transaction ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <DetailRow label="PO Number" value={transaction.poNumber} />
                  <DetailRow label="PO Line Item" value={transaction.poLineItem} />
                  <DetailRow label="Cost Element" value={transaction.costElement} />
                  <DetailRow label="Received Quantity" value={transaction.receivedQuantity != null ? String(transaction.receivedQuantity) : ''} />
                  <DetailRow label="Batch Number" value={transaction.batchNumber} isMono />
                  <DetailRow label="Receipt Date" value={transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : ''} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">No transaction records associated with this batch</p>
              )}
            </fieldset>

            {/* Storage Section */}
            {batch && (batch.storageLocationId || batch.rackNumber) && (
              <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <legend className="text-xs font-bold uppercase tracking-wider px-2 text-amber-600 dark:text-amber-400">
                  Storage Location Details
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {storageLocMaster && (
                    <div className="col-span-1 md:col-span-2 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">
                      <DetailRow label="Warehouse" value={storageLocMaster.name} />
                      <DetailRow label="Incharge Person" value={storageLocMaster.incharge} />
                      {storageLocMaster.remarks && <DetailRow label="Warehouse Remarks" value={storageLocMaster.remarks} />}
                    </div>
                  )}
                  <DetailRow label="Rack Number" value={batch.rackNumber} />
                  <DetailRow label="Bin Number" value={batch.binNumber} />
                  <DetailRow label="Room Number" value={batch.roomNumber} />
                  <DetailRow label="Pallet Number" value={batch.palletNumber} />
                  <DetailRow label="Yard Number" value={batch.yardNumber} />
                </div>
              </fieldset>
            )}

            {/* Issue History Section */}
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <legend className="text-xs font-bold uppercase tracking-wider px-2 text-red-600 dark:text-red-400">
                Issue History Log
              </legend>
              {issueHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-slate-700 dark:text-slate-300">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-[10px] uppercase font-semibold">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Issued By</th>
                        <th className="p-2 text-left">Received By</th>
                        <th className="p-2 text-left">Transport</th>
                        <th className="p-2 text-left">Drawing #</th>
                        <th className="p-2 text-left">Location / Room</th>
                        <th className="p-2 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issueHistory.map(issue => (
                        <tr key={issue._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2 whitespace-nowrap">{issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : '—'}</td>
                          <td className="p-2 font-semibold text-red-600 dark:text-red-400 font-mono">{issue.quantity}</td>
                          <td className="p-2 truncate max-w-[120px]" title={issue.issuedBy}>{issue.issuedBy}</td>
                          <td className="p-2 truncate max-w-[120px]" title={issue.receivedBy}>{issue.receivedBy}</td>
                          <td className="p-2">{issue.transportMode}</td>
                          <td className="p-2 font-mono">{issue.drawingNumber || '—'}</td>
                          <td className="p-2">{issue.usageLocation || '—'}</td>
                          <td className="p-2 italic text-gray-400 max-w-[120px] truncate" title={issue.remarks}>{issue.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No issues recorded against this batch yet.</p>
              )}
            </fieldset>

            {/* Batch Level remarks */}
            {batch?.remarks && (
              <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <legend className="text-xs font-bold uppercase tracking-wider px-2 text-purple-600 dark:text-purple-400">
                  Batch Remarks
                </legend>
                <p className="text-sm text-gray-700 dark:text-gray-300">{batch.remarks}</p>
              </fieldset>
            )}
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
