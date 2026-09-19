// app/inventory/materials/transactions/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import MaterialTransactionForm from '@/components/MaterialTransactionForm';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { ArrowUpDown, PlusCircle, MinusCircle, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
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

  // Search and date filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // Filter unified ledger based on search query and date range
  const filteredLedger = useMemo(() => {
    return unifiedLedger.filter(row => {
      // 1. Search Query Filter (matches materialCode, poNumber, materialDescription, batchNumber)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = row.materialCode.toLowerCase().includes(query);
        const matchesDesc = row.materialDescription.toLowerCase().includes(query);
        const matchesPO = row.poNumber.toLowerCase().includes(query);
        const matchesBatch = row.batchNumber.toLowerCase().includes(query);
        if (!matchesCode && !matchesDesc && !matchesPO && !matchesBatch) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (row.date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (row.date > end) return false;
      }

      return true;
    });
  }, [unifiedLedger, searchQuery, startDate, endDate]);

  const handleExportExcel = () => {
    if (filteredLedger.length === 0) {
      show({ title: 'No Data', description: 'No transaction records to export', variant: 'destructive' });
      return;
    }

    try {
      const headers = [
        'Sl No',
        'Type',
        'Date',
        'Material Code',
        'Material Description',
        'Batch Number',
        'PO Number',
        'Line Item',
        'Cost Element',
        'Quantity',
        'Storage / Issue Details',
        'Remarks'
      ];

      const rows = filteredLedger.map((tx, idx) => [
        idx + 1,
        tx.type,
        tx.date ? tx.date.toLocaleDateString('en-GB') : '',
        tx.materialCode,
        tx.materialDescription,
        tx.batchNumber,
        tx.poNumber,
        tx.poLineItem,
        tx.costElement,
        tx.qty,
        tx.storageDetails,
        tx.remarks
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([
        ['MATERIAL TRANSACTIONS & LEDGER AUDIT REPORT'],
        [`Generated: ${new Date().toLocaleString()} | Total Records: ${filteredLedger.length}`],
        [`Filter - Search: ${searchQuery || 'All'} | Date: ${startDate || 'Start'} to ${endDate || 'End'}`],
        [],
        headers,
        ...rows
      ]);

      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 30 },
        { wch: 18 },
        { wch: 16 },
        { wch: 12 },
        { wch: 16 },
        { wch: 14 },
        { wch: 40 },
        { wch: 25 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Transactions');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Material_Transactions_Report_${dateStr}.xlsx`);

      show({
        title: 'Export Succeeded',
        description: `Exported ${filteredLedger.length} material transactions to Excel`,
        variant: 'success'
      });
    } catch (err: any) {
      console.error('Error exporting material transactions:', err);
      show({ title: 'Export Failed', description: err.message || 'Failed to export Excel', variant: 'destructive' });
    }
  };

  const handleExportPDF = () => {
    if (filteredLedger.length === 0) {
      show({ title: 'No Data', description: 'No transaction records to export', variant: 'destructive' });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 14;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(10, y, pageWidth - 20, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('MATERIAL TRANSACTIONS & STOCK LEDGER REPORT', 15, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Search: ${searchQuery || 'All'} | Period: ${startDate || 'Earliest'} to ${endDate || 'Latest'}`, 15, y + 14);
      doc.text(`Generated: ${new Date().toLocaleString()} | Total Transactions: ${filteredLedger.length}`, 15, y + 19);

      y += 26;

      const columns = [
        { header: '#', width: 10, align: 'center' as const },
        { header: 'Type', width: 18, align: 'left' as const },
        { header: 'Date', width: 22, align: 'left' as const },
        { header: 'Material Code', width: 26, align: 'left' as const },
        { header: 'Description', width: 44, align: 'left' as const },
        { header: 'Batch #', width: 24, align: 'left' as const },
        { header: 'PO #', width: 24, align: 'left' as const },
        { header: 'Qty', width: 16, align: 'center' as const },
        { header: 'Storage / Issue Location', width: 54, align: 'left' as const },
        { header: 'Remarks', width: 39, align: 'left' as const }
      ];

      const drawTableHeader = (curY: number) => {
        doc.setFillColor(30, 41, 59);
        doc.rect(10, curY, pageWidth - 20, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);

        let curX = 10;
        columns.forEach((col) => {
          if (col.align === 'center') {
            doc.text(col.header, curX + col.width / 2, curY + 5, { align: 'center' });
          } else {
            doc.text(col.header, curX + 2, curY + 5);
          }
          curX += col.width;
        });
        return curY + 7;
      };

      y = drawTableHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      filteredLedger.forEach((row, index) => {
        if (y > pageHeight - 15) {
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

          doc.addPage();
          y = 12;
          y = drawTableHeader(y);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, pageWidth - 20, 6, 'F');
        }

        doc.setTextColor(30, 41, 59);
        let curX = 10;

        doc.text(String(index + 1), curX + columns[0].width / 2, y + 4.2, { align: 'center' });
        curX += columns[0].width;

        doc.text(row.type, curX + 2, y + 4.2);
        curX += columns[1].width;

        doc.text(row.date ? row.date.toLocaleDateString('en-GB') : '', curX + 2, y + 4.2);
        curX += columns[2].width;

        doc.text(row.materialCode.substring(0, 16), curX + 2, y + 4.2);
        curX += columns[3].width;

        doc.text(row.materialDescription.substring(0, 26), curX + 2, y + 4.2);
        curX += columns[4].width;

        doc.text(row.batchNumber.substring(0, 14), curX + 2, y + 4.2);
        curX += columns[5].width;

        doc.text(row.poNumber !== '—' ? row.poNumber.substring(0, 14) : '-', curX + 2, y + 4.2);
        curX += columns[6].width;

        const qtyStr = row.qty > 0 ? `+${row.qty}` : String(row.qty);
        doc.text(qtyStr, curX + columns[7].width / 2, y + 4.2, { align: 'center' });
        curX += columns[7].width;

        doc.text(row.storageDetails.substring(0, 36), curX + 2, y + 4.2);
        curX += columns[8].width;

        doc.text(row.remarks.substring(0, 24), curX + 2, y + 4.2);

        y += 6;
      });

      const totalPagesCount = doc.getNumberOfPages();
      for (let p = 1; p <= totalPagesCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${p} of ${totalPagesCount} | ScanItSimple Materials`, pageWidth / 2, pageHeight - 6, {
          align: 'center'
        });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`Material_Transactions_Report_${dateStr}.pdf`);

      show({
        title: 'PDF Export Complete',
        description: `Exported ${filteredLedger.length} material transactions to PDF`,
        variant: 'success'
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      show({ title: 'Export Failed', description: err.message || 'Failed to export PDF', variant: 'destructive' });
    }
  };

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Material Transactions Ledger</h1>

      {/* Filters Panel */}
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
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button onClick={handleCreate} className={fap.btnPrimary}>Record Receipt (PO)</button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredLedger.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Download Excel spreadsheet of filtered transactions"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel (.xlsx)
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filteredLedger.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Download PDF report of filtered transactions"
          >
            <FileText className="w-4 h-4" />
            Export PDF (.pdf)
          </button>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1 hover:text-blue-500 font-semibold text-xs tracking-wider border border-slate-300 dark:border-slate-700 py-2 px-3 rounded-lg bg-white dark:bg-gray-800 transition-colors"
          >
            Sort Material Code {sortAsc ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {unifiedLedger.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No material transactions recorded yet</p>
          <p className="text-sm mt-1">Click &quot;Record Receipt (PO)&quot; to log material receiving into storage</p>
        </div>
      ) : filteredLedger.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-lg font-semibold">No matching transactions found</p>
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

                  return filteredLedger.map((row) => {
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
