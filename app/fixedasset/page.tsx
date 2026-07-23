'use client';

import { useState, useEffect } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

import { SearchField } from '@/components/ui/search-field';

import { AssetQRCode } from '@/components/AssetQRCode';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import FixedAssetPageHeader from '@/app/components/fixedasset/FixedAssetPageHeader';
import FixedAssetStatBar from '@/app/components/fixedasset/FixedAssetStatBar';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import FixedAssetListShell from '@/app/components/fixedasset/FixedAssetListShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';
import { computeAssetStats, sortBtn, th } from '@/lib/fixedAssetListHelpers';

interface FixedAsset {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  acquiredvalue: number;
  acquireddate: Date;
  location: string;
  department: string;
}

interface BulkFixedAssetRow {
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

export default function FixedAssetPage() {
  const [data, setData] = useState<FixedAsset[]>([]);
  const [recentAssets, setRecentAssets] = useState<FixedAsset[]>([]);
  const [assetNumberSearch, setAssetNumberSearch] = useState('');
  const [assetNameSearch, setAssetNameSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [landingSorting, setLandingSorting] = useState<SortingState>([{ id: 'acquiredvalue', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [landingColumnFilters, setLandingColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [landingLoading, setLandingLoading] = useState(true);
  const [excludeCustody, setExcludeCustody] = useState(false);
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkFixedAssetRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkFixedAssetRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ assetnumber: string; sourceRow?: number }>;
  } | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Bulk Insert Error');
  const [errorModalContent, setErrorModalContent] = useState('');

  const isSearchActive =
    (assetNumberSearch?.trim().length ?? 0) >= 2 ||
    (assetNameSearch?.trim().length ?? 0) >= 2;

  const stats = computeAssetStats(isSearchActive ? data : recentAssets);

  const searchAssets = async (assetNumber: string, assetName: string) => {
    if ((!assetNumber?.trim() || assetNumber.trim().length < 2) &&
        (!assetName?.trim() || assetName.trim().length < 2)) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assetNumber?.trim()) params.append('assetNumber', assetNumber);
      if (assetName?.trim()) params.append('assetName', assetName);

      const response = await fetch(`/api/fixedassets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
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

  const parseBulkFile = async (file: File): Promise<BulkFixedAssetRow[]> => {
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

    const parsed: BulkFixedAssetRow[] = [];

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

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/fixedassets/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fixedassets_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      openBulkErrorModal('Template Download Error', error.message || 'Failed to download template.');
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
    } catch (error: any) {
      resetBulkState();
      openBulkErrorModal('File Parsing Error', error.message || 'Failed to parse uploaded file.');
    }
  };

  const handleValidateBulk = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation Error', 'Please upload file first.');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch('/api/fixedassets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', rows: bulkRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Validation failed.');
      }

      const data = result.data;
      setValidatedRows(data.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: data.totalUploaded || 0,
        validForInsert: data.validForInsert || 0,
        skippedExisting: data.skippedExisting || []
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (error: any) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      openBulkErrorModal('Validation Error', error.message || 'Validation failed.');
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
      const response = await fetch('/api/fixedassets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }

      alert(result.message || 'Fixed assets inserted successfully.');
      setShowBulkInsertModal(false);
      resetBulkState();
      searchAssets(assetNumberSearch, assetNameSearch);
    } catch (error: any) {
      openBulkErrorModal('Insert Error', error.message || 'Insert failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecentAssets = async () => {
      setLandingLoading(true);
      try {
        const params = new URLSearchParams();
        if (excludeCustody) params.append('excludeCustody', 'true');
        const query = params.toString();
        const response = await fetch(`/api/fixedassets/recent-acquisitions${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch recent fixed assets');
        const result = await response.json();
        setRecentAssets(result.data || []);
      } catch (error) {
        console.error('Error fetching recent fixed assets:', error);
        setRecentAssets([]);
      } finally {
        setLandingLoading(false);
      }
    };

    fetchRecentAssets();
  }, [excludeCustody]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchAssets(assetNumberSearch, assetNameSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [assetNumberSearch, assetNameSearch]);

  const buildAssetColumns = (options?: { includeActions?: boolean }): ColumnDef<FixedAsset>[] => [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          type="button"
          className={sortBtn}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset Number
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/fixedasset/${row.original.assetnumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={fap.link}
        >
          {row.original.assetnumber}
        </Link>
      ),
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
        <div className="max-w-[300px] truncate text-sm text-[#0F172A] dark:text-[#F8F9FA]">
          {row.getValue('assetdescription')}
        </div>
      ),
    },
    {
      accessorKey: 'assetcategory',
      header: () => <span className={th}>Category</span>,
    },
    {
      accessorKey: 'assetsubcategory',
      header: () => <span className={th}>Subcategory</span>,
    },
    {
      accessorKey: 'assetstatus',
      header: () => <span className={th}>Status</span>,
      cell: ({ row }) => <FixedAssetStatusBadge status={row.original.assetstatus} />,
    },
    {
      accessorKey: 'location',
      header: () => <span className={th}>Location</span>,
      cell: ({ row }) => (
        <span className="text-sm text-[#475569] dark:text-[#94A3B8]">{row.original.location || '—'}</span>
      ),
    },
    {
      accessorKey: 'department',
      header: () => <span className={th}>Department</span>,
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
      ),
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button
          type="button"
          className={sortBtn}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Acquiring Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as string;
        return (
          <span className="text-sm text-[#475569] dark:text-[#94A3B8]">
            {date ? new Date(date).toLocaleDateString() : '—'}
          </span>
        );
      },
    },
    ...(options?.includeActions
      ? [
          {
            id: 'actions',
            header: () => <span className={th}>Actions</span>,
            cell: ({ row }) => (
              <div className="flex flex-wrap gap-2 text-[12px]">
                <Link
                  href={`/fixedasset/${row.original.assetnumber}#custody`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={fap.link}
                >
                  Custody
                </Link>
              </div>
            ),
          } as ColumnDef<FixedAsset>,
        ]
      : [
          {
            id: 'qrcode',
            header: () => <span className={th}>QR Code</span>,
            cell: ({ row }) => (
              <AssetQRCode assetNumber={row.original.assetnumber} assetType="fixedasset" />
            ),
          } as ColumnDef<FixedAsset>,
        ]),
  ];

  const columns = buildAssetColumns();
  const landingColumns = buildAssetColumns({ includeActions: true });

  return (
    <FixedAssetListShell>
        <FixedAssetPageHeader
          title="Fixed Assets"
          subtitle="Search and manage fixed assets"
        />

        <div className={`${fap.card} ${fap.cardPadding} mb-8`}>
          <h2 className={fap.sectionTitle}>Search &amp; filter</h2>
          <p className={`${fap.sectionDesc} mb-4`}>Filter by asset number or description (2+ characters).</p>
          <div className="flex flex-wrap items-end gap-4">
            <SearchField
              containerClassName="min-w-[240px] flex-1"
              type="text"
              value={assetNumberSearch}
              onChange={(e) => setAssetNumberSearch(e.target.value)}
              placeholder="Search by asset number…"
            />
            <SearchField
              containerClassName="min-w-[240px] flex-1"
              type="text"
              value={assetNameSearch}
              onChange={(e) => setAssetNameSearch(e.target.value)}
              placeholder="Search by asset description…"
            />
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
        </div>

        <FixedAssetStatBar stats={stats} />

        {isSearchActive && (
          <div className={`${fap.tableWrap} mb-8`}>
            <div className="border-b border-slate-200 dark:border-[#2A3B4C]/50 px-6 py-4">
              <h2 className={fap.sectionTitle}>Search results</h2>
              <p className={fap.sectionDesc}>Fixed assets matching your search criteria.</p>
            </div>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className={fap.spinner} />
              </div>
            ) : data.length === 0 ? (
              <div className="py-12 text-center text-[#475569] dark:text-[#94A3B8]">
                No fixed assets match your search criteria
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
        )}

        <div className={fap.tableWrap}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-[#2A3B4C]/50 px-6 py-4">
            <div>
              <h2 className={fap.sectionTitle}>Latest acquired fixed assets</h2>
              <p className={fap.sectionDesc}>
                {excludeCustody
                  ? 'Top 100 most recently acquired fixed assets without custody, ranked by value'
                  : 'Top 100 most recently acquired fixed assets, ranked by value'}
              </p>
            </div>
            <label className="flex cursor-pointer select-none items-center gap-3">
              <span className="text-sm text-[#475569] dark:text-[#94A3B8]">Only without custody</span>
              <button
                type="button"
                role="switch"
                aria-checked={excludeCustody}
                onClick={() => setExcludeCustody((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  excludeCustody ? 'bg-[#00B4D8]' : 'bg-slate-100 dark:bg-[#2A3B4C]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    excludeCustody ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
          {landingLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className={fap.spinner} />
            </div>
          ) : recentAssets.length === 0 ? (
            <div className="py-12 text-center text-[#475569] dark:text-[#94A3B8]">
              {excludeCustody
                ? 'All recent fixed assets have custody records'
                : 'No recent fixed assets found'}
            </div>
          ) : (
            <ResponsiveTanStackTable
              data={recentAssets}
              columns={landingColumns}
              sorting={landingSorting}
              setSorting={setLandingSorting}
              columnFilters={landingColumnFilters}
              setColumnFilters={setLandingColumnFilters}
              getRowId={(row) => row._id}
              variant="smarttags"
            />
          )}
        </div>

        {showBulkInsertModal && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-4xl`}>
              <h3 className="mb-4 text-2xl font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Bulk insert fixed assets</h3>
              <p className="mb-4 text-sm text-[#475569] dark:text-[#94A3B8]">
                Download template, fill rows, validate to skip existing asset numbers, then insert only new rows.
              </p>

              <div className="mb-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleDownloadTemplate} className={fap.btnSecondary}>
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
                          Existing assetnumber skipped: {item.assetnumber}
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
                    Preview of rows ready to insert ({validatedRows.length})
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-[#1E293B]">
                        <tr className="text-[#64748B]">
                          <th className="px-3 py-2">Asset No</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, idx) => (
                          <tr key={`${row.assetnumber}-${idx}`} className="border-t border-slate-200/70 dark:border-[#2A3B4C]/30">
                            <td className="px-3 py-2 text-[#475569] dark:text-[#94A3B8]">{row.assetnumber}</td>
                            <td className="px-3 py-2 text-[#475569] dark:text-[#94A3B8]">{row.assetdescription}</td>
                            <td className="px-3 py-2 text-[#475569] dark:text-[#94A3B8]">{row.assetcategory || '—'}</td>
                            <td className="px-3 py-2 text-[#475569] dark:text-[#94A3B8]">{row.assetstatus || '—'}</td>
                            <td className="px-3 py-2 text-[#475569] dark:text-[#94A3B8]">
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

        {errorModalOpen && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-2xl`}>
              <h3 className="mb-3 text-xl font-semibold text-[#0F172A] dark:text-[#F8F9FA]">{errorModalTitle}</h3>
              <div className={`${fap.surfaceBorder} max-h-80 overflow-auto whitespace-pre-wrap p-4 text-sm text-[#475569] dark:text-[#94A3B8]`}>
                {errorModalContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setErrorModalOpen(false)} className={fap.btnSecondary}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </FixedAssetListShell>
  );
}
