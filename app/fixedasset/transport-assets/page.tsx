'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import Link from 'next/link';

import { SearchField } from '@/components/ui/search-field';

import { AssetQRCode } from '@/components/AssetQRCode';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import FixedAssetPageHeader from '@/app/components/fixedasset/FixedAssetPageHeader';
import FixedAssetStatBar from '@/app/components/fixedasset/FixedAssetStatBar';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import FixedAssetListShell from '@/app/components/fixedasset/FixedAssetListShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';
import { computeAssetStats, sortBtn, th } from '@/lib/fixedAssetListHelpers';

interface TransportAsset {
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
  plateNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  vehicleModel?: string;
  modelYear?: number | null;
}

interface BulkTransportAssetRow {
  assetnumber: string;
  assetdescription: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  acquiredvalue?: number;
  acquireddate?: string;
  location?: string;
  department?: string;
  plateNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  vehicleModel?: string;
  modelYear?: number;
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
  department: '',
  plateNumber: '',
  chassisNumber: '',
  engineNumber: '',
  vehicleModel: '',
  modelYear: ''
});

function formatDateInput(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function TransportAssetsPage() {
  const [data, setData] = useState<TransportAsset[]>([]);
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
  const [bulkRows, setBulkRows] = useState<BulkTransportAssetRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkTransportAssetRow[]>([]);
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

  const parseBulkFile = async (file: File): Promise<BulkTransportAssetRow[]> => {
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

    const parsed: BulkTransportAssetRow[] = [];

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
      const plateNumber = getCell(row, ['plate number', 'platenumber']);
      const chassisNumber = getCell(row, ['chassis number', 'chassisnumber']);
      const engineNumber = getCell(row, ['engine number', 'enginenumber']);
      const vehicleModel = getCell(row, ['model']);
      const yearText = getCell(row, ['year', 'modelyear']);

      const hasAnyData = [
        assetnumber,
        assetdescription,
        assetcategory,
        assetsubcategory,
        assetstatus,
        acquiredValueText,
        acquireddate,
        location,
        department,
        plateNumber,
        chassisNumber,
        engineNumber,
        vehicleModel,
        yearText
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
        plateNumber,
        chassisNumber,
        engineNumber,
        vehicleModel,
        modelYear: yearText && !Number.isNaN(Number(yearText)) ? Number(yearText) : undefined,
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

      const response = await fetch(`/api/transportassets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transport assets');
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error('Error fetching transport assets:', error);
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
      const response = await fetch('/api/transportassets/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to download template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transportassets_bulk_insert_template.xlsx';
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
      const response = await fetch('/api/transportassets/bulk-import', {
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
      const response = await fetch('/api/transportassets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }

      alert(result.message || 'Transport assets inserted successfully.');
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
        department: form.department,
        plateNumber: form.plateNumber,
        chassisNumber: form.chassisNumber,
        engineNumber: form.engineNumber,
        vehicleModel: form.vehicleModel
      };
      if (form.acquiredvalue.trim() !== '') {
        body.acquiredvalue = Number(form.acquiredvalue);
      }
      if (form.acquireddate) {
        body.acquireddate = form.acquireddate;
      }
      if (form.modelYear.trim() !== '') {
        body.modelYear = Number(form.modelYear);
      }

      const res = await fetch('/api/transportassets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || 'Failed to add transport asset.');
      }

      setForm(emptyForm());
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add.';
      openBulkErrorModal('Add Transport Asset', message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row: TransportAsset) => {
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
      department: row.department ?? '',
      plateNumber: row.plateNumber ?? '',
      chassisNumber: row.chassisNumber ?? '',
      engineNumber: row.engineNumber ?? '',
      vehicleModel: row.vehicleModel ?? '',
      modelYear:
        row.modelYear !== null && row.modelYear !== undefined ? String(row.modelYear) : ''
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
        department: editForm.department,
        plateNumber: editForm.plateNumber,
        chassisNumber: editForm.chassisNumber,
        engineNumber: editForm.engineNumber,
        vehicleModel: editForm.vehicleModel
      };
      if (editForm.acquiredvalue.trim() !== '') {
        body.acquiredvalue = Number(editForm.acquiredvalue);
      } else {
        body.acquiredvalue = null;
      }
      body.acquireddate = editForm.acquireddate || null;
      body.modelYear = editForm.modelYear.trim() !== '' ? Number(editForm.modelYear) : null;

      const res = await fetch(`/api/transportassets/${encodeURIComponent(editAssetNumber)}`, {
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
      openBulkErrorModal('Edit Transport Asset', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assetnumber: string) => {
    if (!window.confirm(`Delete transport asset "${assetnumber}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/transportassets/${encodeURIComponent(assetnumber)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || 'Delete failed.');
      }
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Delete failed.';
      openBulkErrorModal('Delete Transport Asset', message);
    }
  };

  const stats = computeAssetStats(data);

  const columns: ColumnDef<TransportAsset>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          type="button"
          className={sortBtn}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset ID
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/fixedasset/transport-assets/${encodeURIComponent(row.original.assetnumber)}`}
          className={fap.link}
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
          className={sortBtn}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[280px] truncate text-sm text-[#0F172A] dark:text-[#F8F9FA]">
          {row.getValue('assetdescription')}
        </div>
      )
    },
    {
      accessorKey: 'assetcategory',
      header: () => <span className={th}>Category</span>
    },
    {
      accessorKey: 'assetsubcategory',
      header: () => <span className={th}>Subcategory</span>
    },
    {
      accessorKey: 'assetstatus',
      header: () => <span className={th}>Status</span>,
      cell: ({ row }) => <FixedAssetStatusBadge status={row.original.assetstatus} />
    },
    {
      accessorKey: 'location',
      header: () => <span className={th}>Location</span>,
      cell: ({ row }) => <span className="text-sm text-[#475569] dark:text-[#94A3B8]">{row.original.location || '—'}</span>
    },
    {
      accessorKey: 'department',
      header: () => <span className={th}>Department</span>
    },
    {
      accessorKey: 'plateNumber',
      header: () => <span className={th}>Plate</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-[#0F172A] dark:text-[#F8F9FA]">{row.original.plateNumber || '—'}</span>
      )
    },
    {
      accessorKey: 'vehicleModel',
      header: () => <span className={th}>Model</span>,
      cell: ({ row }) => (
        <span className="text-sm text-[#475569] dark:text-[#94A3B8]">{row.original.vehicleModel || '—'}</span>
      )
    },
    {
      accessorKey: 'acquiredvalue',
      header: ({ column }) => (
        <button
          type="button"
          className={sortBtn}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-[#0F172A] dark:text-[#F8F9FA]">
          {formatCurrency(row.original.acquiredvalue)}
        </span>
      )
    },
    {
      id: 'qrcode',
      header: () => <span className={th}>QR</span>,
      cell: ({ row }) => (
        <AssetQRCode
          assetNumber={row.original.assetnumber}
          assetDescription={row.original.assetdescription}
          assetType="transportasset"
        />
      )
    },
    {
      id: 'actions',
      header: () => <span className={th}>Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(row.original)}
            className={fap.btnSecondary}
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original.assetnumber)}
            className={fap.btnDanger}
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
        <FixedAssetPageHeader
          title="Transport Assets"
          subtitle="Search and manage fleet assets with plate numbers, vehicle models, and transport maintenance details."
        />

        <div className={`${fap.card} ${fap.cardPadding} mb-8`}>
          <h2 className={fap.sectionTitle}>Search &amp; filter</h2>
          <p className={`${fap.sectionDesc} mb-4`}>Filter by asset number or description (2+ characters).</p>
          <div className="flex flex-wrap gap-4">
            <SearchField
              containerClassName="min-w-[240px] flex-1"
              type="text"
              value={assetNumberSearch}
              onChange={(e) => setAssetNumberSearch(e.target.value)}
              placeholder="Search by asset ID…"
            />
            <SearchField
              containerClassName="min-w-[240px] flex-1"
              type="text"
              value={assetNameSearch}
              onChange={(e) => setAssetNameSearch(e.target.value)}
              placeholder="Search by description…"
            />
          </div>
        </div>

        <FixedAssetStatBar stats={stats} />

        <form
          onSubmit={handleAddSubmit}
          className={`${fap.card} ${fap.cardPadding} mb-8 space-y-4`}
        >
          <h2 className={fap.sectionTitle}>Add transport asset</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={fap.label}>Asset number *</label>
              <input
                className={fap.input}
                value={form.assetnumber}
                onChange={(e) => setForm((f) => ({ ...f, assetnumber: e.target.value }))}
                placeholder="e.g. TA-3001"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={fap.label}>Description *</label>
              <input
                className={fap.input}
                value={form.assetdescription}
                onChange={(e) => setForm((f) => ({ ...f, assetdescription: e.target.value }))}
                placeholder="Vehicle description"
                required
              />
            </div>
            <div>
              <label className={fap.label}>Category</label>
              <input
                className={fap.input}
                value={form.assetcategory}
                onChange={(e) => setForm((f) => ({ ...f, assetcategory: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Subcategory</label>
              <input
                className={fap.input}
                value={form.assetsubcategory}
                onChange={(e) => setForm((f) => ({ ...f, assetsubcategory: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Status</label>
              <input
                className={fap.input}
                value={form.assetstatus}
                onChange={(e) => setForm((f) => ({ ...f, assetstatus: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Acquired value</label>
              <input
                type="number"
                step="any"
                className={fap.input}
                value={form.acquiredvalue}
                onChange={(e) => setForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Acquired date</label>
              <input
                type="date"
                className={fap.input}
                value={form.acquireddate}
                onChange={(e) => setForm((f) => ({ ...f, acquireddate: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Location</label>
              <input
                className={fap.input}
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Department</label>
              <input
                className={fap.input}
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Plate number</label>
              <input
                className={fap.input}
                value={form.plateNumber}
                onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Chassis number</label>
              <input
                className={fap.input}
                value={form.chassisNumber}
                onChange={(e) => setForm((f) => ({ ...f, chassisNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Engine number</label>
              <input
                className={fap.input}
                value={form.engineNumber}
                onChange={(e) => setForm((f) => ({ ...f, engineNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Model</label>
              <input
                className={fap.input}
                value={form.vehicleModel}
                onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value }))}
              />
            </div>
            <div>
              <label className={fap.label}>Year</label>
              <input
                type="number"
                className={fap.input}
                value={form.modelYear}
                onChange={(e) => setForm((f) => ({ ...f, modelYear: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className={fap.btnPrimary}
            >
              {saving ? 'Saving…' : 'Add asset'}
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

        <div className={fap.tableWrap}>
          <div className="border-b border-slate-200 dark:border-[#2A3B4C]/50 px-6 py-4">
            <h2 className={fap.sectionTitle}>Transport asset records</h2>
            <p className={fap.sectionDesc}>Click an asset ID to open vehicle identifiers and maintenance history.</p>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className={fap.spinner} />
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-[#475569] dark:text-[#94A3B8]">
              No transport assets yet. Add one above or use bulk insert.
            </div>
          ) : (
            <ResponsiveTanStackTable
              data={data}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              getRowId={(row) => row._id}
              variant="smarttags"
            />
          )}
        </div>

        {showBulkInsertModal && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-4xl`}>
              <h3 className="mb-4 text-2xl font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Bulk insert transport assets</h3>
              <p className="mb-4 text-sm text-[#475569] dark:text-[#94A3B8]">
                Download the template, fill rows, validate to skip existing asset numbers, then insert new rows only.
              </p>

              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={fap.btnSecondary}
                >
                  Download template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileSelect}
                  className="text-sm text-[#475569] dark:text-[#94A3B8]"
                />
              </div>

              {bulkFileName && (
                <p className="mb-3 text-sm text-[#475569] dark:text-[#94A3B8]">
                  Selected file: {bulkFileName} ({bulkRows.length} rows detected)
                </p>
              )}

              {validationSummary && (
                <div className={`${fap.surfaceBorder} mb-4 p-4`}>
                  <p className="text-[#0F172A] dark:text-[#F8F9FA]">{validationMessage}</p>
                  <p className="mt-2 text-sm text-[#475569] dark:text-[#94A3B8]">
                    Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert} |
                    Existing skipped: {validationSummary.skippedExisting.length}
                  </p>
                  {validationSummary.skippedExisting.length > 0 && (
                    <div className="mt-2 max-h-24 overflow-auto text-xs text-[#475569] dark:text-[#94A3B8]">
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
                <div className={`${fap.surfaceBorder} mb-4 p-4`}>
                  <p className="mb-3 text-sm font-medium text-[#0F172A] dark:text-[#F8F9FA]">
                    Preview ({validatedRows.length} rows)
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-xs text-[#475569] dark:text-[#94A3B8]">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-[#1E293B]">
                        <tr className="text-[#64748B]">
                          <th className="px-3 py-2">Asset No</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Plate</th>
                          <th className="px-3 py-2">Model</th>
                          <th className="px-3 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, idx) => (
                          <tr key={`${row.assetnumber}-${idx}`} className="border-t border-slate-200/70 dark:border-[#2A3B4C]/30">
                            <td className="px-3 py-2">{row.assetnumber}</td>
                            <td className="px-3 py-2">{row.assetdescription}</td>
                            <td className="px-3 py-2">{row.assetcategory || '—'}</td>
                            <td className="px-3 py-2">{row.assetstatus || '—'}</td>
                            <td className="px-3 py-2">{row.plateNumber || '—'}</td>
                            <td className="px-3 py-2">{row.vehicleModel || '—'}</td>
                            <td className="px-3 py-2">{row.acquiredvalue ?? '—'}</td>
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
                  className={fap.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidateBulk}
                  disabled={bulkLoading || bulkRows.length === 0}
                  className={fap.btnSecondary}
                >
                  {bulkLoading ? 'Processing…' : 'Validate'}
                </button>
                <button
                  type="button"
                  onClick={handleInsertBulk}
                  disabled={bulkLoading || validatedRows.length === 0}
                  className={fap.btnPrimary}
                >
                  {bulkLoading ? 'Processing…' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editOpen && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-2xl`}>
              <h3 className="mb-4 text-xl font-semibold text-[#0F172A] dark:text-[#F8F9FA]">
                Edit transport asset {editAssetNumber}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={fap.label}>Description</label>
                  <input
                    className={fap.input}
                    value={editForm.assetdescription}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetdescription: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Category</label>
                  <input
                    className={fap.input}
                    value={editForm.assetcategory}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetcategory: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Subcategory</label>
                  <input
                    className={fap.input}
                    value={editForm.assetsubcategory}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetsubcategory: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Status</label>
                  <input
                    className={fap.input}
                    value={editForm.assetstatus}
                    onChange={(e) => setEditForm((f) => ({ ...f, assetstatus: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Acquired value</label>
                  <input
                    type="number"
                    step="any"
                    className={fap.input}
                    value={editForm.acquiredvalue}
                    onChange={(e) => setEditForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Acquired date</label>
                  <input
                    type="date"
                    className={fap.input}
                    value={editForm.acquireddate}
                    onChange={(e) => setEditForm((f) => ({ ...f, acquireddate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Location</label>
                  <input
                    className={fap.input}
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Department</label>
                  <input
                    className={fap.input}
                    value={editForm.department}
                    onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Plate number</label>
                  <input
                    className={fap.input}
                    value={editForm.plateNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, plateNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Chassis number</label>
                  <input
                    className={fap.input}
                    value={editForm.chassisNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, chassisNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Engine number</label>
                  <input
                    className={fap.input}
                    value={editForm.engineNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, engineNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Model</label>
                  <input
                    className={fap.input}
                    value={editForm.vehicleModel}
                    onChange={(e) => setEditForm((f) => ({ ...f, vehicleModel: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={fap.label}>Year</label>
                  <input
                    type="number"
                    className={fap.input}
                    value={editForm.modelYear}
                    onChange={(e) => setEditForm((f) => ({ ...f, modelYear: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className={fap.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={saving}
                  className={fap.btnPrimary}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {errorModalOpen && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-2xl`}>
              <h3 className="mb-3 text-xl font-semibold text-[#0F172A] dark:text-[#F8F9FA]">{errorModalTitle}</h3>
              <div className={`${fap.surfaceBorder} max-h-80 overflow-auto whitespace-pre-wrap p-4 text-sm text-[#475569] dark:text-[#94A3B8]`}>
                {errorModalContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setErrorModalOpen(false)}
                  className={fap.btnSecondary}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </FixedAssetListShell>
  );
}
