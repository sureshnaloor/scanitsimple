// app/inventory/materials/batches/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, ChevronRight, AlertCircle, Printer } from 'lucide-react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import MaterialTransactionForm from '@/components/MaterialTransactionForm';
import MaterialBatchQRModal from '@/app/components/MaterialBatchQRModal';
import MaterialBatchIssueForm from '@/components/MaterialBatchIssueForm';
import type { Material, MaterialTransaction, StorageLocation } from '@/types/material';

interface MaterialBatch {
  _id?: string;
  materialId: string;
  transactionId: string;
  initialQuantity?: number;
  currentQuantity?: number;
  parentBatchId?: string;
  storageLocationId?: string;
  rackNumber?: string;
  binNumber?: string;
  roomNumber?: string;
  palletNumber?: string;
  yardNumber?: string;
  remarks?: string;
  createdAt?: string;
}

interface FlatBatchRow extends MaterialBatch {
  materialCode: string;
  materialDescription: string;
  transactionPO: string;
  storageDetails: string;
  issues: FlatBatchRow[];
}

export default function MaterialBatchesPage() {
  const s = useThemeSurfaces();
  const { show } = useToast();
  
  const [batches, setBatches] = useState<MaterialBatch[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  
  const [selectedTransaction, setSelectedTransaction] = useState<MaterialTransaction | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeQRBatchId, setActiveQRBatchId] = useState<string>('');
  const [activeIssueBatch, setActiveIssueBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Sorting state
  const [sortKey, setSortKey] = useState<string>('materialCode');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Expandable row state
  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});

  // Search and date filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInitialData = async () => {
    try {
      const [batchRes, matRes, txRes, locRes] = await Promise.all([
        fetch('/api/material-batches'),
        fetch('/api/materials'),
        fetch('/api/material-transactions'),
        fetch('/api/storage-locations'),
      ]);

      if (batchRes.ok && matRes.ok && txRes.ok && locRes.ok) {
        setBatches(await batchRes.json());
        setMaterials(await matRes.json());
        setTransactions(await txRes.json());
        setLocations(await locRes.json());
      }
    } catch {
      show({ title: 'Error', description: 'Failed to load batch list data', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Check if a QR batch ID is in the query params (e.g. from scanning a batch QR code)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qrId = params.get('qr');
      if (qrId) {
        setActiveQRBatchId(qrId);
      }
    }
  }, []);

  // Map and sort batch rows (nested recursively)
  const flatRows = useMemo(() => {
    const resolvedBatches = batches.map(b => {
      const mat = materials.find(m => m._id === b.materialId);
      const tx = transactions.find(t => t._id === b.transactionId);
      const loc = b.storageLocationId ? locations.find(l => l._id === b.storageLocationId) : null;

      const locPrefix = loc ? `${loc.name} | ` : '';
      const room = b.roomNumber ? ` | Room: ${b.roomNumber}` : '';
      const storageText = b.rackNumber ? `${locPrefix}Rack: ${b.rackNumber} | Bin: ${b.binNumber}${room}` : 'Unknown Location';

      return {
        ...b,
        materialCode: mat ? mat.code : 'Unknown',
        materialDescription: mat ? mat.description : 'Unknown Material',
        transactionPO: tx ? `PO: ${tx.poNumber} (Batch: ${tx.batchNumber.substring(0, 10)}...)` : 'Unknown PO',
        storageDetails: storageText,
      };
    });

    // Filter into parents and children
    const parents = resolvedBatches.filter(b => !b.parentBatchId) as FlatBatchRow[];
    const children = resolvedBatches.filter(b => !!b.parentBatchId) as FlatBatchRow[];

    // Match child batches directly to their parents
    const mappedParents = parents.map(p => {
      const childBatches = children.filter(c => c.parentBatchId === p._id);
      return {
        ...p,
        issues: childBatches,
      };
    });

    // Apply sorting to parent rows
    mappedParents.sort((a: any, b: any) => {
      const valA = a[sortKey] ?? '';
      const valB = b[sortKey] ?? '';
      
      const strA = typeof valA === 'string' ? valA : String(valA);
      const strB = typeof valB === 'string' ? valB : String(valB);

      return sortAsc ? strA.localeCompare(strB, undefined, { numeric: true }) : strB.localeCompare(strA, undefined, { numeric: true });
    });

    return mappedParents;
  }, [batches, materials, transactions, locations, sortKey, sortAsc]);

  // Filter flatRows based on search query and date range
  const filteredFlatRows = useMemo(() => {
    return flatRows.map(row => {
      // Filter child issues if search query is active
      let filteredIssues = row.issues;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredIssues = row.issues.filter(child => 
          child.materialCode.toLowerCase().includes(query) ||
          child.materialDescription.toLowerCase().includes(query) ||
          child.transactionPO.toLowerCase().includes(query) ||
          child.storageDetails.toLowerCase().includes(query) ||
          (child.remarks || '').toLowerCase().includes(query)
        );
      }
      return {
        ...row,
        issues: filteredIssues
      };
    }).filter(row => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = row.materialCode.toLowerCase().includes(query);
        const matchesDesc = row.materialDescription.toLowerCase().includes(query);
        const matchesPO = row.transactionPO.toLowerCase().includes(query);
        const matchesStorage = row.storageDetails.toLowerCase().includes(query);
        const matchesRemarks = (row.remarks || '').toLowerCase().includes(query);
        
        // Retain if parent matches OR has matching child issues
        const hasMatchingChild = row.issues.length > 0;

        if (!matchesCode && !matchesDesc && !matchesPO && !matchesStorage && !matchesRemarks && !hasMatchingChild) {
          return false;
        }
      }

      // 2. Date Range Filter
      const rowDate = row.createdAt ? new Date(row.createdAt) : new Date();
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (rowDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (rowDate > end) return false;
      }

      return true;
    });
  }, [flatRows, searchQuery, startDate, endDate]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedBatchIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEdit = (batch: MaterialBatch) => {
    const tx = transactions.find(t => t._id === batch.transactionId);
    if (tx) {
      setSelectedTransaction(tx);
      setShowEditForm(true);
    } else {
      show({ title: 'Error', description: 'Linked receipt transaction not found', variant: 'destructive' });
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this unique batch configuration? The linked transaction and issues will be deleted.')) return;
    try {
      const res = await fetch(`/api/material-batches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        show({ title: 'Deleted', description: 'Batch configuration deleted', variant: 'success' });
        fetchInitialData();
      } else {
        show({ title: 'Error', description: 'Failed to delete batch configuration', variant: 'destructive' });
      }
    } catch {
      show({ title: 'Error', description: 'Failed to delete batch configuration', variant: 'destructive' });
    }
  };

  const handleEditSubmit = async (transaction: MaterialTransaction) => {
    setLoading(true);
    try {
      const res = await fetch('/api/material-transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!res.ok) {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to update transaction', variant: 'destructive' });
        return;
      }

      show({ title: 'Success', description: 'Material receipt and batch details updated successfully', variant: 'success' });
      setShowEditForm(false);
      fetchInitialData();
    } catch {
      show({ title: 'Error', description: 'Failed to update transaction', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSubmit = async (issueData: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/material-batch-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData),
      });

      if (!res.ok) {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to process material issue', variant: 'destructive' });
        return;
      }

      const responseData = await res.json();
      show({ title: 'Success', description: 'Material issue successfully recorded', variant: 'success' });
      setActiveIssueBatch(null);
      fetchInitialData();

      // Offer printing immediately based on whether it is a transfer or consumption
      const hasDest = Boolean(issueData.destinationStorageLocationId);
      const printType = hasDest ? 'gp' : 'gi';
      const confirmPrint = confirm(`Issue recorded. Would you like to print the ${hasDest ? 'Gate Pass' : 'Goods Issue Slip'} now?`);
      if (confirmPrint && responseData._id) {
        handlePrint(responseData._id, printType);
      }
    } catch {
      show({ title: 'Error', description: 'Failed to process material issue', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (txId: string, docType: 'grn' | 'gi' | 'gp') => {
    window.open(`/api/material-documents?id=${txId}&docType=${docType}`, '_blank');
  };

  return (
    <MasterDataPageShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Unique Material Batches</h1>
      
      {batches.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 mb-6 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Material Code, Description, PO, Batch..."
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {(searchQuery || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-2.5 rounded-lg border border-red-200 hover:border-red-300 dark:border-red-950 dark:hover:border-red-900 bg-red-50/50 dark:bg-red-950/20 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No material batches linked yet</p>
          <p className="text-sm mt-1">Batches are created automatically when material receipts are logged under Material Transactions</p>
        </div>
      ) : filteredFlatRows.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-lg font-semibold">No matching material batches found</p>
          <p className="text-sm mt-1">Try adjusting your search query or date range filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
            }}
            className="mt-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 border border-slate-200 dark:border-[#2A3B4C]/30 p-4">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-[#2A3B4C]/30">
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('materialCode')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Code <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('materialDescription')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Description <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('transactionPO')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Transaction PO <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('initialQuantity')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Initial Qty <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('currentQuantity')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Current Qty <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button onClick={() => handleSort('storageDetails')} className="flex items-center gap-1 hover:text-blue-500 font-semibold uppercase text-xs tracking-wider">
                      Storage Location <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="p-3 text-left uppercase text-xs tracking-wider font-semibold">Remarks</th>
                  <th className="p-3 text-left uppercase text-xs tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlatRows.map(b => {
                  const hasIssues = b.issues && b.issues.length > 0;
                  const isExpanded = !!expandedBatchIds[b._id || ''];

                  return (
                    <React.Fragment key={b._id}>
                      {/* Parent Row */}
                      <tr className="border-b border-slate-100 dark:border-[#2A3B4C]/20 hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/50 transition-colors">
                        <td className="p-3 text-center">
                          {hasIssues ? (
                            <button
                              onClick={() => toggleRowExpand(b._id || '')}
                              className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={isExpanded ? 'Hide Child Batches' : 'Show Child Batches'}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : (
                            <span className="inline-block w-4 h-4"></span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-900 dark:text-slate-100">{b.materialCode}</td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 break-words whitespace-normal max-w-xs">{b.materialDescription}</td>
                        <td className="p-3 font-mono text-xs text-slate-700 dark:text-slate-300">{b.transactionPO}</td>
                        <td className="p-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{b.initialQuantity ?? 0}</td>
                        <td className="p-3 font-mono text-xs font-bold">
                          <span className={`${
                            (b.currentQuantity ?? 0) <= 0
                              ? 'text-red-500'
                              : (b.currentQuantity ?? 0) < (b.initialQuantity ?? 0)
                              ? 'text-amber-500'
                              : 'text-blue-500'
                          }`}>
                            {b.currentQuantity ?? 0}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400 break-words whitespace-normal max-w-[200px]">{b.storageDetails}</td>
                        <td className="p-3 text-xs italic text-slate-400 break-words whitespace-normal max-w-[150px]">{b.remarks || '—'}</td>
                        <td className="p-3 space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setActiveIssueBatch({
                              _id: b._id || '',
                              materialId: b.materialId,
                              materialCode: b.materialCode,
                              materialDescription: b.materialDescription,
                              currentQuantity: b.currentQuantity ?? 0,
                              transactionPO: b.transactionPO
                            })}
                            disabled={(b.currentQuantity ?? 0) <= 0}
                            className={`font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer ${
                              (b.currentQuantity ?? 0) <= 0
                                ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            Issue
                          </button>
                          <button
                            onClick={() => handlePrint(b.transactionId, 'grn')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Print Goods Receipt Document"
                          >
                            <Printer className="h-3 w-3" /> Print GRN
                          </button>
                          <button
                            onClick={() => setActiveQRBatchId(b._id || '')}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer"
                          >
                            QR Code
                          </button>
                          <button onClick={() => handleEdit(b)} className={fap.btnSecondary}>Edit</button>
                          <button onClick={() => handleDelete(b._id)} className={fap.btnSecondary}>Delete</button>
                        </td>
                      </tr>

                      {/* Expanding Children Batch Issues Row */}
                      {hasIssues && isExpanded && (
                        <tr className="bg-slate-50/30 dark:bg-[#111827]/30 border-b border-slate-100 dark:border-[#2A3B4C]/20">
                          <td className="p-2"></td>
                          <td colSpan={8} className="p-4 pl-6 border-l-2 border-indigo-500/50">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Site Receipt Batches (Issued from Parent)
                              </h4>
                              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-850 p-2">
                                <table className="min-w-full text-xs text-slate-700 dark:text-slate-300">
                                  <thead>
                                    <tr className="bg-slate-100/50 dark:bg-slate-900/50 font-semibold border-b border-slate-150 dark:border-slate-800">
                                      <th className="p-2 text-left">Code</th>
                                      <th className="p-2 text-left">Description</th>
                                      <th className="p-2 text-left">Child Transaction Batch</th>
                                      <th className="p-2 text-left">Initial Qty</th>
                                      <th className="p-2 text-left">Current Qty</th>
                                      <th className="p-2 text-left">Site Location</th>
                                      <th className="p-2 text-left">Remarks</th>
                                      <th className="p-2 text-left">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {b.issues.map(child => (
                                      <tr key={child._id} className="border-b border-slate-50 dark:border-slate-850 last:border-0 hover:bg-slate-100/20">
                                        <td className="p-2 font-mono">{child.materialCode}</td>
                                        <td className="p-2 break-words whitespace-normal max-w-xs">{child.materialDescription}</td>
                                        <td className="p-2 font-mono text-slate-500">{child.transactionPO}</td>
                                        <td className="p-2 font-mono font-semibold">{child.initialQuantity}</td>
                                        <td className="p-2 font-mono font-bold">
                                          <span className={`${
                                            (child.currentQuantity ?? 0) <= 0
                                              ? 'text-red-500'
                                              : (child.currentQuantity ?? 0) < (child.initialQuantity ?? 0)
                                              ? 'text-amber-500'
                                              : 'text-blue-500'
                                          }`}>
                                            {child.currentQuantity}
                                          </span>
                                        </td>
                                        <td className="p-2 font-mono text-slate-500 break-words whitespace-normal max-w-[200px]">{child.storageDetails}</td>
                                        <td className="p-2 text-slate-400 italic break-words whitespace-normal max-w-xs">{child.remarks}</td>
                                        <td className="p-2 space-x-2 whitespace-nowrap">
                                          <button
                                            onClick={() => setActiveIssueBatch({
                                              _id: child._id || '',
                                              materialId: child.materialId,
                                              materialCode: child.materialCode,
                                              materialDescription: child.materialDescription,
                                              currentQuantity: child.currentQuantity ?? 0,
                                              transactionPO: child.transactionPO
                                            })}
                                            disabled={(child.currentQuantity ?? 0) <= 0}
                                            className={`font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer ${
                                              (child.currentQuantity ?? 0) <= 0
                                                ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                          >
                                            Issue
                                          </button>
                                          <button
                                            onClick={() => handlePrint(child.transactionId, 'grn')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                                            title="Print Goods Receipt Document"
                                          >
                                            <Printer className="h-3 w-3" /> Print GRN
                                          </button>
                                          <button
                                            onClick={() => setActiveQRBatchId(child._id || '')}
                                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors cursor-pointer"
                                          >
                                            QR Code
                                          </button>
                                          <button onClick={() => handleEdit(child)} className={fap.btnSecondary}>Edit</button>
                                          <button onClick={() => handleDelete(child._id)} className={fap.btnSecondary}>Delete</button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditForm && selectedTransaction && (
        <MaterialTransactionForm
          initial={selectedTransaction}
          onClose={() => {
            setShowEditForm(false);
            setSelectedTransaction(null);
          }}
          onSubmit={handleEditSubmit}
          loading={loading}
        />
      )}

      {activeQRBatchId && (
        <MaterialBatchQRModal
          batchId={activeQRBatchId}
          onClose={() => {
            setActiveQRBatchId('');
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('qr');
              window.history.replaceState({}, '', url.pathname + url.search);
            }
          }}
        />
      )}

      {activeIssueBatch && (
        <MaterialBatchIssueForm
          batch={activeIssueBatch}
          onClose={() => setActiveIssueBatch(null)}
          onSubmit={handleIssueSubmit}
          loading={loading}
        />
      )}
    </MasterDataPageShell>
  );
}
