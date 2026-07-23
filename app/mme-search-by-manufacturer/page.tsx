'use client';
import { useState, useEffect } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import SearchPageLayout from '@/app/components/search/SearchPageLayout';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useThemeSurfaces } from '@/lib/themePageStyles';

interface Equipment {
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
  assetserialnumber: string;
}

export default function MMESearchByManufacturerPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Equipment[]>([]);
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);

  const searchEquipment = async (manufacturer: string) => {
    if (!manufacturer?.trim() || manufacturer.trim().length < 2) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('manufacturer', manufacturer);
      const response = await fetch(`/api/mme/search-by-manufacturer?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchEquipment(manufacturerSearch), 500);
    return () => clearTimeout(timer);
  }, [manufacturerSearch]);

  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Asset Number
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link href={`/asset/${row.original.assetnumber}`} className={s.link}>
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'assetmanufacturer',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Manufacturer
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetmanufacturer')}</div>,
    },
    {
      accessorKey: 'assetmodel',
      header: 'Model',
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetmodel') || 'N/A'}</div>,
    },
    { accessorKey: 'assetserialnumber', header: 'Serial' },
    { accessorKey: 'assetdescription', header: 'Description' },
    { accessorKey: 'assetcategory', header: 'Category' },
    { accessorKey: 'assetsubcategory', header: 'Subcategory' },
    { accessorKey: 'assetstatus', header: 'Status' },
  ];

  return (
    <SearchPageLayout
      title="MME Search by Manufacturer"
      subtitle="Search MME equipment by manufacturer"
      hint="Enter at least 2 characters to search. Only non-empty manufacturer fields are displayed."
      searchArea={
        <input
          type="text"
          value={manufacturerSearch}
          onChange={(e) => setManufacturerSearch(e.target.value)}
          placeholder="Search by manufacturer (minimum 2 characters)..."
          className={`max-w-sm ${s.searchInput}`}
        />
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={
        manufacturerSearch.trim().length >= 2
          ? 'No equipment found matching the manufacturer'
          : 'Enter at least 2 characters to search for equipment by manufacturer'
      }
      resultsSummary={
        <>Found {data.length} equipment record{data.length !== 1 ? 's' : ''} matching &quot;{manufacturerSearch}&quot;</>
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
