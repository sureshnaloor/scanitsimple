'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import ThemedPageShell from '@/app/components/ThemedPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 5;

interface LocationResult {
  _id: string;
  assetnumber: string;
  locationType: string;
  locationValue: string;
  warehouseLocation?: string;
  departmentLocation?: string;
  warehouseCity?: string;
  employeenumber: string;
  employeename: string;
  custodyfrom: string;
  custodyto?: string | null;
  project?: string;
  projectname?: string;
  assetdescription?: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  assetmanufacturer?: string;
  assetmodel?: string;
  assetserialnumber?: string;
  acquireddate?: string;
  acquiredvalue?: number;
}

export default function MMESearchByLocationPage() {
  const [data, setData] = useState<LocationResult[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const s = useThemeSurfaces();

  const runSearch = useCallback(async (term: string) => {
    const trimmed = (term || '').trim();
    if (!trimmed) {
      setData([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ type: 'mme', search: trimmed });
      const response = await fetch(`/api/equipment/search-by-location?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching equipment by location:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByLocation = () => runSearch(searchText);

  // Debounced search when user types at least MIN_SEARCH_LENGTH characters
  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setData([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, runSearch]);

  const columns: ColumnDef<LocationResult>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Asset Number
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/asset/${row.original.assetnumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.link}
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'locationType',
      header: 'Location Type',
      cell: ({ row }) => <div className="text-[12px] capitalize">{row.getValue('locationType') || '—'}</div>,
    },
    {
      accessorKey: 'locationValue',
      header: 'Location',
      cell: ({ row }) => <div className="text-[12px]">{row.original.locationValue || row.original.warehouseLocation || row.original.departmentLocation || '—'}</div>,
    },
    { accessorKey: 'warehouseCity', header: 'City', cell: ({ row }) => <div className="text-[12px]">{row.original.warehouseCity || '—'}</div> },
    { accessorKey: 'employeename', header: 'Custodian', cell: ({ row }) => <div className="text-[12px]">{row.original.employeename || '—'}</div> },
    {
      accessorKey: 'custodyfrom',
      header: 'Custody From',
      cell: ({ row }) => (
        <div className="text-[12px]">
          {row.original.custodyfrom ? new Date(row.original.custodyfrom).toLocaleDateString() : '—'}
        </div>
      ),
    },
    { accessorKey: 'assetdescription', header: 'Description', cell: ({ row }) => <div className="text-[12px] max-w-[200px] truncate" title={row.original.assetdescription}>{row.original.assetdescription || '—'}</div> },
    { accessorKey: 'assetcategory', header: 'Category', cell: ({ row }) => <div className="text-[12px]">{row.original.assetcategory || '—'}</div> },
    { accessorKey: 'assetstatus', header: 'Status', cell: ({ row }) => <div className="text-[12px]">{row.original.assetstatus || '—'}</div> },
  ];

  return (
    <ThemedPageShell>
      <div className="flex flex-col gap-6">
        <div className={`${s.card} ${s.cardPadding}`}>
          <h1 className={s.heroTitle}>MME Search by Location</h1>
          <p className={`mt-2 ${s.heroSubtitle}`}>
            Find MME equipment by location. Type at least 5 characters; use * as wildcard (e.g. *camp* or safco).
          </p>
        </div>

        <div className={`${s.card} p-6`}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="location-search" className={`mb-1 block text-sm font-medium ${s.textSecondary}`}>
                Location search
              </label>
              <input
                id="location-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchByLocation()}
                placeholder="e.g. *camp* or safco (min 5 chars)"
                className={s.searchInput}
              />
            </div>
            <button
              type="button"
              onClick={searchByLocation}
              disabled={loading || searchText.trim().length < MIN_SEARCH_LENGTH}
              className={`${s.btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className={`mt-3 text-xs ${s.textMuted}`}>
            Search runs after you type at least 5 characters (debounced). Searches warehouse, department, and
            camp/office locations; case-insensitive. Use * as wildcard.
          </p>
        </div>

        <div className={s.tableWrap}>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className={s.spinner} />
            </div>
          ) : !hasSearched ? (
            <div className={`py-8 text-center ${s.textMuted}`}>
              Enter at least 5 characters to search by location (e.g. &quot;camp&quot; or &quot;*safco*&quot;).
              Search runs automatically.
            </div>
          ) : data.length === 0 ? (
            <div className={`py-8 text-center ${s.textMuted}`}>
              No MME equipment found for location &quot;{searchText.trim()}&quot;
            </div>
          ) : (
            <>
              <div className="border-b border-b px-4 py-2 {s.tableSummaryBorder}">
                <p className={`text-sm ${s.textSecondary}`}>
                  Found {data.length} asset{data.length !== 1 ? 's' : ''} for location &quot;{searchText.trim()}&quot;
                </p>
              </div>
              <ResponsiveTanStackTable
                data={data}
                columns={columns}
                sorting={sorting}
                setSorting={setSorting}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                getRowId={(row) => (row as LocationResult)._id ?? (row as LocationResult).assetnumber}
                variant="smarttags"
              />
            </>
          )}
        </div>
      </div>
    </ThemedPageShell>
  );
}
