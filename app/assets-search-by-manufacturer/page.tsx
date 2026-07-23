'use client';
import { useEffect, useState } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import SearchPageLayout from '@/app/components/search/SearchPageLayout';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useThemeSurfaces } from '@/lib/themePageStyles';

interface Asset {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  acquiredvalue: number;
  acquireddate: Date;
  assetmanufacturer: string;
  assetmodel: string;
}

export default function AssetsSearchByManufacturerPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);

  const searchAssets = async (manufacturer: string) => {
    if (!manufacturer?.trim() || manufacturer.trim().length < 2) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('manufacturer', manufacturer);
      const response = await fetch(`/api/assets/search-by-manufacturer?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setData(data);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchAssets(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const columns: ColumnDef<Asset>[] = [
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
          href={`/fixedasset/${row.original.assetnumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.link}
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    { accessorKey: 'assetmanufacturer', header: 'Manufacturer' },
    { accessorKey: 'assetmodel', header: 'Model' },
    { accessorKey: 'assetdescription', header: 'Description' },
    { accessorKey: 'assetcategory', header: 'Category' },
    { accessorKey: 'assetsubcategory', header: 'Subcategory' },
    { accessorKey: 'assetstatus', header: 'Status' },
  ];

  return (
    <SearchPageLayout
      title="Assets Search by Manufacturer"
      subtitle="Search for assets by manufacturer name"
      hint="Enter at least 2 characters to search."
      searchArea={
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by manufacturer (minimum 2 characters)..."
          className={`max-w-sm ${s.searchInput}`}
        />
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={
        search.trim().length >= 2 ? 'No assets found' : 'Enter at least 2 characters to search'
      }
      resultsSummary={
        <>
          Found {data.length} asset{data.length !== 1 ? 's' : ''} matching &quot;{search}&quot;
        </>
      }
    >
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
    </SearchPageLayout>
  );
}
