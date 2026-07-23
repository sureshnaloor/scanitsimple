'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import Link from 'next/link';

import { AssetQRCode } from '@/components/AssetQRCode';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import FixedAssetListShell from '@/app/components/fixedasset/FixedAssetListShell';
import { fap } from '@/lib/fixedAssetPageDesign';

interface SoftwareAsset {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  acquiredvalue: number | null;
  acquireddate?: string | Date | null;
  location: string;
  department: string;
}

interface BulkSoftwareAssetRow {
  assetnumber: string;
  assetdescription: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  acquiredvalue?: number;
  acquireddate?: string;
  location?: string;
  department?: string;
  sourceRow?: number;
}

const emptyForm = () => ({
  assetnumber: '',
  assetdescription: '',
  assetcategory: '',
  assetsubcategory: '',
  assetstatus: '',
  acquiredvalue: '',
  acquireddate: '',
  location: '',
  department: ''
});

function formatDateInput(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function SoftwareAssetsPage() {
  const [data, setData] = useState<SoftwareAsset[]>([]);
  const [assetNumberSearch, setAssetNumberSearch] = useState('');
  const [assetNameSearch, setAssetNameSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => emptyForm());

  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkSoftwareAssetRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkSoftwareAssetRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ assetnumber: string; sourceRow?: number }>;
  } | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Error');
  const [errorModalContent, setErrorModalContent] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm());
  const [editAssetNumber, setEditAssetNumber] = useState('');

  const backgroundStyles = {
    textColor: fap.textPrimary,
    headerBg: `${fap.card} transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#1E293B]/90`,
    headerHover: '',
    headerTitle:
      'text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#0891B2] to-[#0077B6] bg-clip-text text-transparent dark:from-white dark:to-[#00B4D8]',
    headerSubtitle: fap.subtitle,
    panelBg: fap.card,
    inputBg: fap.input,
    resultsBg: fap.tableWrap,
    emptyText: fap.textMuted,
    spinnerColor: 'border-[#00B4D8]',
    linkColor: fap.link,
    cellText: fap.textPrimary,
  };

  const openBulkErrorModal = (title: string, content: string) => {
    setErrorModalTitle(title);
    setErrorModalContent(content);
    setErrorModalOpen(true);
  };

  const resetBulkState = () => {
    setBulkFileName('');
    setBulkRows([]);
    setValidatedRows([]);
    setValidationMessage('');
    setValidationSummary(null);
  };

  const normalizeHeader = (header: unknown) => String(header ?? '').trim().toLowerCase();

  const parseBulkFile = async (file: File): Promise<BulkSoftwareAssetRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    if (!rows || rows.length < 2) {
      throw new Error('File must include a header row and at least one data row.');
    }

    const headers = rows[0].map(normalizeHeader);
    const requiredHeaders = ['asset number', 'asset description'];
    const missing = requiredHeaders.filter((header) => !headers.includes(header));
    if (missing.length > 0) {
      throw new Error(`Missing required header(s): ${missing.join(', ')}.`);
    }

    const getCell = (row: (string | number | null)[], names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      if (idx === -1) {
        return '';
      }
      return String(row[idx] ?? '').trim();
    };

    const parsed: BulkSoftwareAssetRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const assetnumber = getCell(row, ['asset number', 'assetnumber']);
      const assetdescription = getCell(row, ['asset description', 'assetdescription']);
      const assetcategory = getCell(row, ['asset category', 'assetcategory']);
      const assetsubcategory = getCell(row, ['asset subcategory', 'assetsubcategory']);
      const assetstatus = getCell(row, ['asset status', 'assetstatus']);
      const acquiredValueText = getCell(row, ['acquired value', 'acquiredvalue']);
      const acquireddate = getCell(row, ['acquired date', 'acquireddate']);
      const location = getCell(row, ['location']);
      const department = getCell(row, ['department']);

      const hasAnyData = [
        assetnumber,
        assetdescription,
        assetcategory,
        assetsubcategory,
        assetstatus,
        acquiredValueText,
        acquireddate,
        location,
        department
      ].some((value) => value !== '');
      if (!hasAnyData) {
        continue;
      }

      const acquiredvalue = acquiredValueText ? Number(acquiredValueText) : undefined;
      parsed.push({
        assetnumber,
        assetdescription,
        assetcategory,
        assetsubcategory,
        assetstatus,
        acquiredvalue: Number.isNaN(acquiredvalue) ? undefined : acquiredvalue,
        acquireddate,
        location,
        department,
        sourceRow: i + 1
      });
    }

    if (parsed.length === 0) {
      throw new Error('No data rows found in uploaded file.');
    }

    return parsed;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assetNumberSearch.trim().length >= 2) params.append('assetNumber', assetNumberSearch.trim());
      if (assetNameSearch.trim().length >= 2) params.append('assetName', assetNameSearch.trim());

      const response = await fetch(`/api/softwareassets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch software assets');
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error('Error fetching software assets:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [assetNumberSearch, assetNameSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/softwareassets/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to download template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'softwareassets_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to download template.';
      openBulkErrorModal('Template Download Error', message);
    }
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseBulkFile(file);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
    } catch (error: unknown) {
      resetBulkState();
      const message = error instanceof Error ? error.message : 'Failed to parse uploaded file.';
      openBulkErrorModal('File Parsing Error', message);
    }
  };

  const handleValidateBulk = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation Error', 'Please upload file first.');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch('/api/softwareassets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', rows: bulkRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Validation failed.');
      }

      const payload = result.data;
      setValidatedRows(payload.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: payload.totalUploaded || 0,
        validForInsert: payload.validForInsert || 0,
        skippedExisting: payload.skippedExisting || []
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (error: unknown) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      const message = error instanceof Error ? error.message : 'Validation failed.';
      openBulkErrorModal('Validation Error', message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInsertBulk = async () => {
    if (!validatedRows.length) {
      openBulkErrorModal('Insert Error', 'No validated rows ready for insert.');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch('/api/softwareassets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }

      alert(result.message || 'Software assets inserted successfully.');
      setShowBulkInsertModal(false);
      resetBulkState();
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Insert failed.';
      openBulkErrorModal('Insert Error', message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetnumber.trim() || !form.assetdescription.trim()) {
      openBulkErrorModal('Validation', 'Asset Number and Asset Description are required.');
      return;
    }

    try {
      setSaving(true);
      const body: Record<string, unknown> = {
        assetnumber: form.assetnumber.trim(),
        assetdescription: form.assetdescription.trim(),
        assetcategory: form.assetcategory,
        assetsubcategory: form.assetsubcategory,
        assetstatus: form.assetstatus,
        location: form.location,
        department: form.department
      };
      if (form.acquiredvalue.trim() !== '') {
        body.acquiredvalue = Number(form.acquiredvalue);
      }
      if (form.acquireddate) {
        body.acquireddate = form.acquireddate;
      }

      const res = await fetch('/api/softwareassets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || 'Failed to add software asset.');
      }

      setForm(emptyForm());
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add.';
      openBulkErrorModal('Add Software Asset', message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row: SoftwareAsset) => {
    setEditAssetNumber(row.assetnumber);
    setEditForm({
      assetnumber: row.assetnumber,
      assetdescription: row.assetdescription,
      assetcategory: row.assetcategory ?? '',
      assetsubcategory: row.assetsubcategory ?? '',
      assetstatus: row.assetstatus ?? '',
      acquiredvalue:
        row.acquiredvalue !== null && row.acquiredvalue !== undefined ? String(row.acquiredvalue) : '',
      acquireddate: formatDateInput(row.acquireddate),
      location: row.location ?? '',
      department: row.department ?? ''
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editAssetNumber) return;

    try {
      setSaving(true);
      const body: Record<string, unknown> = {
        assetdescription: editForm.assetdescription,
        assetcategory: editForm.assetcategory,
        assetsubcategory: editForm.assetsubcategory,
        assetstatus: editForm.assetstatus,
        location: editForm.location,
        department: editForm.department
      };
      if (editForm.acquiredvalue.trim() !== '') {
        body.acquiredvalue = Number(editForm.acquiredvalue);
      } else {
        body.acquiredvalue = null;
      }
      body.acquireddate = editForm.acquireddate || null;

      const res = await fetch(`/api/softwareassets/${encodeURIComponent(editAssetNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || 'Update failed.');
      }

      setEditOpen(false);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update failed.';
      openBulkErrorModal('Edit Software Asset', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assetnumber: string) => {
    if (!window.confirm(`Delete software asset "${assetnumber}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/softwareassets/${encodeURIComponent(assetnumber)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || 'Delete failed.');
      }
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Delete failed.';
      openBulkErrorModal('Delete Software Asset', message);
    }
  };

  const inputClass = fap.input;

  const columns: ColumnDef<SoftwareAsset>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          type="button"
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset Number
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/fixedasset/software-assets/${encodeURIComponent(row.original.assetnumber)}`}
          className={`font-semibold ${backgroundStyles.linkColor} hover:underline`}
        >
          {row.original.assetnumber}
        </Link>
      )
    },
    {
      accessorKey: 'assetdescription',
      header: ({ column }) => (
        <button
          type="button"
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <div className={`max-w-[280px] truncate text-[12px] ${backgroundStyles.cellText}`}>
          {row.getValue('assetdescription')}
        </div>
      )
    },
    {
      accessorKey: 'assetcategory',
      header: () => <span className={backgroundStyles.textColor}>Category</span>
    },
    {
      accessorKey: 'assetsubcategory',
      header: () => <span className={backgroundStyles.textColor}>Subcategory</span>
    },
    {
      accessorKey: 'assetstatus',
      header: () => <span className={backgroundStyles.textColor}>Status</span>
    },
    {
      accessorKey: 'location',
      header: () => <span className={backgroundStyles.textColor}>Location</span>
    },
    {
      accessorKey: 'department',
      header: () => <span className={backgroundStyles.textColor}>Department</span>
    },
    {
      accessorKey: 'acquiredvalue',
      header: ({ column }) => (
        <button
          type="button"
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('acquiredvalue');
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value)
          : '—';
      }
    },
    {
      id: 'qrcode',
      header: () => <span className={backgroundStyles.textColor}>QR</span>,
      cell: ({ row }) => (
        <AssetQRCode
          assetNumber={row.original.assetnumber}
          assetDescription={row.original.assetdescription}
          assetType="softwareasset"
        />
      )
    },
    {
      id: 'actions',
      header: () => <span className={backgroundStyles.textColor}>Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(row.original)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${backgroundStyles.inputBg}`}
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original.assetnumber)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs border-red-400/50 text-red-300 hover:bg-red-500/10`}
            aria-label="Delete"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <FixedAssetListShell>
      <div className="flex flex-col gap-4 md:gap-8">
        <div className="mb-4">
          <div
            className={`${backgroundStyles.headerBg} rounded-3xl p-8 ${backgroundStyles.headerHover} transition-all duration-300`}
          >
            <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
              Software Assets
            </h1>
            <p className={`${backgroundStyles.headerSubtitle} text-lg`}>
              Add software assets individually or in bulk. Custody and license details can be layered on later.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAddSubmit}
          className={`p-6 ${backgroundStyles.panelBg} rounded-xl shadow-lg space-y-4`}
        >
          <h2 className={`text-lg font-semibold ${backgroundStyles.textColor}`}>Add software asset</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Asset number *</label>
              <input
                className={inputClass}
                value={form.assetnumber}
                onChange={(e) => setForm((f) => ({ ...f, assetnumber: e.target.value }))}
                placeholder="e.g. SW-8001"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Description *</label>
              <input
                className={inputClass}
                value={form.assetdescription}
                onChange={(e) => setForm((f) => ({ ...f, assetdescription: e.target.value }))}
                placeholder="License or product name"
                required
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Category</label>
              <input
                className={inputClass}
                value={form.assetcategory}
                onChange={(e) => setForm((f) => ({ ...f, assetcategory: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Subcategory</label>
              <input
                className={inputClass}
                value={form.assetsubcategory}
                onChange={(e) => setForm((f) => ({ ...f, assetsubcategory: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Status</label>
              <input
                className={inputClass}
                value={form.assetstatus}
                onChange={(e) => setForm((f) => ({ ...f, assetstatus: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Acquired value</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={form.acquiredvalue}
                onChange={(e) => setForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Acquired date</label>
              <input
                type="date"
                className={inputClass}
                value={form.acquireddate}
                onChange={(e) => setForm((f) => ({ ...f, acquireddate: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Location</label>
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Department</label>
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`${fap.btnPrimary} disabled:opacity-50`}
            >
              {saving ? 'Saving…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetBulkState();
                setShowBulkInsertModal(true);
              }}
              className={fap.btnSecondary}
            >
              Bulk insert
            </button>
          </div>
        </form>

        <div className={`p-6 ${backgroundStyles.panelBg} rounded-xl shadow-lg`}>
          <h2 className={`text-lg font-semibold mb-4 ${backgroundStyles.textColor}`}>Filter (optional)</h2>
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              value={assetNumberSearch}
              onChange={(e) => setAssetNumberSearch(e.target.value)}
              placeholder="Asset number (2+ characters to filter)…"
              className={`w-full max-w-sm px-4 py-3 rounded-xl ${backgroundStyles.inputBg} focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            />
            <input
              type="text"
              value={assetNameSearch}
              onChange={(e) => setAssetNameSearch(e.target.value)}
              placeholder="Description (2+ characters to filter)…"
              className={`w-full max-w-sm px-4 py-3 rounded-xl ${backgroundStyles.inputBg} focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            />
          </div>
          <p className={`mt-2 text-sm ${backgroundStyles.headerSubtitle}`}>
            Leave filters short or empty to list all software assets.
          </p>
        </div>

        <div className={`rounded-xl ${backgroundStyles.resultsBg} shadow-xl`}>
          <div className={`px-4 py-3 border-b border-slate-200 dark:border-[#2A3B4C]/50 ${backgroundStyles.panelBg}`}>
            <h2 className={`text-lg font-semibold ${backgroundStyles.textColor}`}>Software asset records</h2>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}
              />
            </div>
          ) : data.length === 0 ? (
            <div className={`text-center py-10 ${backgroundStyles.emptyText}`}>
              No software assets yet. Add one above or use bulk insert.
            </div>
          ) : (
            <ResponsiveTanStackTable
              data={data}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              variant="smarttags"
              getRowId={(row) => row._id}
            />
          )}
        </div>

        {showBulkInsertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${backgroundStyles.panelBg} w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
              <h3 className={`mb-4 text-2xl font-semibold ${backgroundStyles.textColor}`}>Bulk insert software assets</h3>
              <p className={`mb-4 text-sm ${backgroundStyles.headerSubtitle}`}>
                Download the template, fill rows, validate to skip existing asset numbers, then insert new rows only.
              </p>

              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Download template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileSelect}
                  className={`text-sm ${backgroundStyles.textColor}`}
                />
              </div>

              {bulkFileName && (
                <p className={`mb-3 text-sm ${backgroundStyles.headerSubtitle}`}>
                  Selected file: {bulkFileName} ({bulkRows.length} rows detected)
                </p>
              )}

              {validationSummary && (
                <div className={`mb-4 rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={backgroundStyles.textColor}>{validationMessage}</p>
                  <p className={`mt-2 text-sm ${backgroundStyles.headerSubtitle}`}>
                    Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert} |
                    Existing skipped: {validationSummary.skippedExisting.length}
                  </p>
                  {validationSummary.skippedExisting.length > 0 && (
                    <div className={`mt-2 max-h-24 overflow-auto text-xs ${backgroundStyles.headerSubtitle}`}>
                      {validationSummary.skippedExisting.map((item, idx) => (
                        <div key={`${item.assetnumber}-${idx}`}>
                          Existing asset number skipped: {item.assetnumber}
                          {item.sourceRow ? ` (row ${item.sourceRow})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {validatedRows.length > 0 && (
                <div className={`mb-4 rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={`mb-3 text-sm font-medium ${backgroundStyles.textColor}`}>
                    Preview ({validatedRows.length} rows)
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-white/20">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-black/20">
                        <tr>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Asset No</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Description</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Category</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Status</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, idx) => (
                          <tr key={`${row.assetnumber}-${idx}`} className="border-t border-white/10">
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetnumber}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetdescription}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetcategory || '—'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetstatus || '—'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>
                              {row.acquiredvalue !== undefined ? row.acquiredvalue : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkInsertModal(false);
                    resetBulkState();
                  }}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidateBulk}
                  disabled={bulkLoading || bulkRows.length === 0}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg} disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing…' : 'Validate'}
                </button>
                <button
                  type="button"
                  onClick={handleInsertBulk}
                  disabled={bulkLoading || validatedRows.length === 0}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg} disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing…' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${backgroundStyles.panelBg} w-full max-w-2xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
              <h3 className={`mb-4 text-xl font-semibold ${backgroundStyles.textColor}`}>
                Edit software asset {editAssetNumber}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Description</label>
                  <input
                    className={inputClass}
                    value={editForm.assetdescription}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetdescription: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Category</label>
                  <input
                    className={inputClass}
                    value={editForm.assetcategory}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetcategory: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Subcategory</label>
                  <input
                    className={inputClass}
                    value={editForm.assetsubcategory}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetsubcategory: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Status</label>
                  <input
                    className={inputClass}
                    value={editForm.assetstatus}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetstatus: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Acquired value</label>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={editForm.acquiredvalue}
                    onChange={(e) => setEditForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Acquired date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={editForm.acquireddate}
                    onChange={(e) => setEditForm((f) => ({ ...f, acquireddate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Location</label>
                  <input
                    className={inputClass}
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${backgroundStyles.headerSubtitle}`}>Department</label>
                  <input
                    className={inputClass}
                    value={editForm.department}
                    onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg} disabled:opacity-50`}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {errorModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`${backgroundStyles.panelBg} w-full max-w-2xl rounded-2xl p-6 shadow-xl`}>
              <h3 className={`mb-3 text-xl font-semibold ${backgroundStyles.textColor}`}>{errorModalTitle}</h3>
              <div className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border p-4 text-sm ${backgroundStyles.inputBg}`}>
                {errorModalContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setErrorModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FixedAssetListShell>
  );
}
