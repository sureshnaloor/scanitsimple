// app/inventory/materials/transactions/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import MaterialTransactionForm from '@/components/MaterialTransactionForm';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { ArrowUpDown, PlusCircle, MinusCircle, Printer } from 'lucide-react';
import type { Material, MaterialTransaction, StorageLocation } from '@/types/material';

interface UnifiedTransaction {
  id: string;
  materialId: string;
  materialCode: string;
  materialDescription: string;
  batchNumber: string;
  poNumber: string;
  poLineItem: string;
  costElement: string;
  qty: number; // positive for receipt, negative for issue
  type: 'Receipt' | 'Issue';
  storageDetails: string;
  date: Date;
  remarks: string;
  isTransfer?: boolean;
  rawDoc: any;
}

export default function MaterialTransactionsPage() {
  const s = useThemeSurfaces();
  const { show } = useToast();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const [selectedTransaction, setSelectedTransaction] = useState<MaterialTransaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sorting order toggle for material code
  const [sortAsc, setSortAsc] = useState(true);

  const fetchInitialData = async () => {
    try {
      const [matRes, batchRes, txRes, locRes, issueRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/material-batches'),
        fetch('/api/material-transactions'),
        fetch('/api/storage-locations'),
        fetch('/api/material-batch-issues'),
      ]);

      if (matRes.ok && batchRes.ok && txRes.ok && locRes.ok && issueRes.ok) {
        setMaterials(await matRes.json());
        setBatches(await batchRes.json());
        setTransactions(await txRes.json());
        setLocations(await locRes.json());
        setIssues(await issueRes.json());
      }
    } catch {
      show({ title: 'Error', description: 'Failed to load transaction ledger data', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Combine receipts and issues into a single unified ledger
  const unifiedLedger = useMemo(() => {
    const list: UnifiedTransaction[] = [];

    // 1. Map Receipts (from transactions collection)
    transactions.forEach(tx => {
      const mat = materials.find(m => m._id === tx.materialId);
      const loc = locations.find(l => l._id === tx.storageLocationId);
      list.push({
        id: tx._id || '',
        materialId: tx.materialId,
        materialCode: mat ? mat.code : 'Unknown',
        materialDescription: mat ? mat.description : 'Unknown Material',
        batchNumber: tx.batchNumber,
        poNumber: tx.poNumber,
        poLineItem: tx.poLineItem,
        costElement: tx.costElement,
        qty: tx.receivedQuantity,
        type: 'Receipt',
        storageDetails: loc ? `${loc.name} | Rack: ${tx.rackNumber} | Bin: ${tx.binNumber}` : '—',
        date: new Date(tx.createdAt),
        remarks: tx.remarks || '',
        rawDoc: tx
      });
    });

    // 2. Map Issues (from issues collection)
    issues.forEach(issue => {
      const parentBatch = batches.find(b => b._id === issue.batchId);
      const mat = parentBatch ? materials.find(m => m._id === parentBatch.materialId) : null;
      const tx = parentBatch ? transactions.find(t => t._id === parentBatch.transactionId) : null;
      const batchNum = tx ? tx.batchNumber : 'Unknown';

      list.push({
        id: issue._id || '',
        materialId: parentBatch ? parentBatch.materialId : '',
        materialCode: mat ? mat.code : 'Unknown',
        materialDescription: mat ? mat.description : 'Unknown Material',
        batchNumber: batchNum,
        poNumber: tx ? tx.poNumber : '—',
        poLineItem: tx ? tx.poLineItem : '—',
        costElement: tx ? tx.costElement : '—',
        qty: -issue.quantity,
        type: 'Issue',
        storageDetails: `Issued to: ${issue.usageLocation || 'Site'} | Issued by: ${issue.issuedBy.split(' - ')[1] || issue.issuedBy} | Received by: ${issue.receivedBy.split(' - ')[1] || issue.receivedBy} | Mode: ${issue.transportMode}`,
        date: new Date(issue.issueDate),
        remarks: issue.remarks || '',
        isTransfer: Boolean(issue.destinationStorageLocationId),
        rawDoc: issue
      });
    });

    // 3. Sort unified list: Material Code -> Batch Number -> Date
    list.sort((a, b) => {
      const codeComp = sortAsc
        ? a.materialCode.localeCompare(b.materialCode, undefined, { numeric: true })
        : b.materialCode.localeCompare(a.materialCode, undefined, { numeric: true });
      
      if (codeComp !== 0) return codeComp;

      const batchComp = a.batchNumber.localeCompare(b.batchNumber);
      if (batchComp !== 0) return batchComp;

      return a.date.getTime() - b.date.getTime();
    });

    return list;
  }, [transactions, issues, materials, batches, locations, sortAsc]);

  const handleCreate = () => {
    setSelectedTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (tx: MaterialTransaction) => {
    setSelectedTransaction(tx);
    setShowForm(true);
  };

  const handleDelete = async (id: string, type: 'Receipt' | 'Issue') => {
    if (type === 'Issue') {
      show({ title: 'Restriction', description: 'Please delete issues directly from the corresponding Batch Issue history to restore quantities.', variant: 'destructive' });
      return;
    }

    if (!confirm('Delete this receipt transaction? This will also delete the corresponding Material Batch and its issues.')) return;
    try {
      const res = await fetch(`/api/material-transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        show({ title: 'Deleted', description: 'Receipt record and associated batch deleted', variant: 'success' });
        fetchInitialData();
      } else {
        show({ title: 'Error', description: 'Failed to delete transaction record', variant: 'destructive' });
      }
    } catch {
      show({ title: 'Error', description: 'Failed to delete transaction record', variant: 'destructive' });
    }
  };

  const handleSubmit = async (transaction: MaterialTransaction) => {
    setLoading(true);
    try {
      const isEdit = Boolean(transaction._id);
      const res = await fetch('/api/material-transactions', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!res.ok) {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to save transaction', variant: 'destructive' });
        return;
      }

      show({ title: 'Success', description: `Material receipt ${isEdit ? 'updated' : 'recorded'} successfully`, variant: 'success' });
      setShowForm(false);
      fetchInitialData();
    } catch {
      show({ title: 'Error', description: 'Failed to save transaction', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (id: string, docType: 'grn' | 'gi' | 'gp') => {
    window.open(`/api/material-documents?id=${id}&docType=${docType}`, '_blank');
  };

  return (
    <MasterDataPageShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Transactions Ledger</h1>
      
      <div className="flex justify-between mb-4">
        <button onClick={handleCreate} className={fap.btnPrimary}>Record Receipt (PO)</button>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1 hover:text-blue-500 font-semibold text-xs tracking-wider border border-slate-300 dark:border-slate-700 py-1.5 px-3 rounded-lg bg-white dark:bg-gray-800 transition-colors"
        >
          Sort Material Code {sortAsc ? '▲' : '▼'}
        </button>
      </div>

      {unifiedLedger.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No material transactions recorded yet</p>
          <p className="text-sm mt-1">Click &quot;Record Receipt (PO)&quot; to log material receiving into storage</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 border border-slate-200 dark:border-[#2A3B4C]/30 p-4">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-[#2A3B4C]/30 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Qty</th>
                  <th className="p-3 text-left">PO No. &amp; Item</th>
                  <th className="p-3 text-left">Cost Element</th>
                  <th className="p-3 text-left">Storage / Details</th>
                  <th className="p-3 text-left">Remarks</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let prevCode = '';
                  let prevBatch = '';

                  return unifiedLedger.map((row) => {
                    const showCodeHeader = row.materialCode !== prevCode;
                    const showBatchHeader = showCodeHeader || row.batchNumber !== prevBatch;

                    prevCode = row.materialCode;
                    prevBatch = row.batchNumber;

                    return (
                      <React.Fragment key={row.id}>
                        {/* Material Group Header */}
                        {showCodeHeader && (
                          <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-t border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={8} className="p-2.5 pl-4 font-bold text-indigo-700 dark:text-indigo-400 text-xs uppercase tracking-wider">
                              Material: {row.materialCode} — {row.materialDescription}
                            </td>
                          </tr>
                        )}

                        {/* Batch Group Header */}
                        {showBatchHeader && (
                          <tr className="bg-slate-50/60 dark:bg-slate-950/30 border-b border-slate-150 dark:border-slate-900">
                            <td colSpan={8} className="p-2 pl-8 font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                              Batch: {row.batchNumber} (PO: {row.poNumber})
                            </td>
                          </tr>
                        )}

                        {/* Transaction Detail Row */}
                        <tr className="border-b border-slate-100 dark:border-[#2A3B4C]/10 hover:bg-slate-50/30 dark:hover:bg-[#1E293B]/20 transition-colors">
                          {/* Inner Visual Group Borders */}
                          <td className="p-3 pl-12 font-mono text-xs text-slate-500 border-l-4 border-indigo-500/70">
                            <div className="border-l-2 border-emerald-500/60 pl-3">
                              {row.date.toLocaleDateString()} {row.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 font-semibold text-xs py-0.5 px-2 rounded-full ${
                              row.type === 'Receipt'
                                ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                            }`}>
                              {row.type === 'Receipt' ? (
                                <PlusCircle className="h-3 w-3" />
                              ) : (
                                <MinusCircle className="h-3 w-3" />
                              )}
                              {row.type}
                            </span>
                          </td>
                          <td className={`p-3 font-mono text-xs font-bold ${
                            row.type === 'Receipt' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {row.qty > 0 ? `+${row.qty}` : row.qty}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {row.poNumber} {row.poLineItem ? `/ ${row.poLineItem}` : ''}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300">{row.costElement}</td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400 break-words whitespace-normal max-w-xs">{row.storageDetails}</td>
                          <td className="p-3 text-xs italic text-slate-400 break-words whitespace-normal max-w-xs">{row.remarks || '—'}</td>
                          <td className="p-3 space-x-2 whitespace-nowrap">
                            {row.type === 'Receipt' ? (
                              <>
                                <button
                                  onClick={() => handlePrint(row.id, 'grn')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Printer className="h-3 w-3" /> Print GRN
                                </button>
                                <button onClick={() => handleEdit(row.rawDoc)} className={fap.btnSecondary}>Edit</button>
                                <button onClick={() => handleDelete(row.id, 'Receipt')} className={fap.btnSecondary}>Delete</button>
                              </>
                            ) : (
                              <button
                                onClick={() => handlePrint(row.id, row.isTransfer ? 'gp' : 'gi')}
                                className={`${
                                  row.isTransfer
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-amber-600 hover:bg-amber-700'
                                } text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1`}
                              >
                                <Printer className="h-3 w-3" /> {row.isTransfer ? 'Print Gate Pass' : 'Print Goods Issue'}
                              </button>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <MaterialTransactionForm
          initial={selectedTransaction}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </MasterDataPageShell>
  );
}
