'use client';
import { useState, useEffect } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import { AssetQRCode } from '@/components/AssetQRCode';
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

export default function MMESearchBySerialNumberPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Equipment[]>([]);
  const [serialNumberSearch, setSerialNumberSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);

  const searchEquipment = async (serialNumber: string) => {
    if (!serialNumber?.trim() || serialNumber.trim().length < 2) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('serialNumber', serialNumber);
      const response = await fetch(`/api/mme/search-by-serial-number?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      setData(await response.json());
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchEquipment(serialNumberSearch), 500);
    return () => clearTimeout(timer);
  }, [serialNumberSearch]);

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
      accessorKey: 'assetserialnumber',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Serial Number
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetserialnumber')}</div>,
    },
    {
      accessorKey: 'assetdescription',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Description
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-[12px]">{row.getValue('assetdescription')}</div>
      ),
    },
    {
      accessorKey: 'assetmanufacturer',
      header: 'Manufacturer',
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetmanufacturer') || 'N/A'}</div>,
    },
    {
      accessorKey: 'assetmodel',
      header: 'Model',
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetmodel') || 'N/A'}</div>,
    },
    { accessorKey: 'assetcategory', header: 'Category' },
    { accessorKey: 'assetsubcategory', header: 'Subcategory' },
    { accessorKey: 'assetstatus', header: 'Status' },
    {
      accessorKey: 'acquiredvalue',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Value
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('acquiredvalue');
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value)
          : 'N/A';
      },
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Acquiring Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      header: 'QR Code',
      cell: ({ row }) => <AssetQRCode assetNumber={row.original.assetnumber} assetType="mme" />,
    },
  ];

  return (
    <SearchPageLayout
      title="MME Search by Serial Number"
      subtitle="Search MME equipment by serial number"
      hint="Enter at least 2 characters to search. Only records with serial numbers are displayed."
      searchArea={
        <input
          type="text"
          value={serialNumberSearch}
          onChange={(e) => setSerialNumberSearch(e.target.value)}
          placeholder="Search by serial number (minimum 2 characters)..."
          className={`max-w-sm ${s.searchInput}`}
        />
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={
        serialNumberSearch.trim().length >= 2
          ? 'No equipment found matching the serial number'
          : 'Enter at least 2 characters to search for equipment by serial number'
      }
      resultsSummary={
        <>
          Found {data.length} equipment record{data.length !== 1 ? 's' : ''} matching &quot;{serialNumberSearch}&quot;
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
