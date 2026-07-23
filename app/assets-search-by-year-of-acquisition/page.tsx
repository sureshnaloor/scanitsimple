'use client';
import { useState, useEffect } from 'react';
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

export default function AssetsSearchByYearOfAcquisitionPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Asset[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2010 + 2 }, (_, i) => 2010 + i).reverse();

  const searchAssets = async (year: string) => {
    if (!year?.trim()) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year', year);
      const response = await fetch(`/api/assets/search-by-year-of-acquisition?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYear) searchAssets(selectedYear);
    else setData([]);
  }, [selectedYear]);

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
        <Link href={`/fixedasset/${row.original.assetnumber}`} target="_blank" rel="noopener noreferrer" className={s.link}>
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Acquisition Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as Date;
        return <div className="text-[12px]">{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>;
      },
    },
    { accessorKey: 'assetdescription', header: 'Description' },
    { accessorKey: 'assetcategory', header: 'Category' },
    { accessorKey: 'assetsubcategory', header: 'Subcategory' },
    { accessorKey: 'assetmanufacturer', header: 'Manufacturer' },
    { accessorKey: 'assetmodel', header: 'Model' },
    { accessorKey: 'assetstatus', header: 'Status' },
  ];

  const yearLabel = selectedYear === 'pre-2010' ? 'before 2010' : `in ${selectedYear}`;

  return (
    <SearchPageLayout
      title="Fixed Assets Search by Year of Acquisition"
      subtitle="Search for fixed assets by acquisition year"
      hint="Select a year to search for fixed assets acquired in that year."
      searchArea={
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={`max-w-sm ${s.select}`}>
          <option value="">Select a year...</option>
          <option value="pre-2010">Pre-2010</option>
          {years.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={
        selectedYear
          ? `No fixed assets found ${selectedYear === 'pre-2010' ? 'for pre-2010' : `for year ${selectedYear}`}`
          : 'Select a year to search for fixed assets'
      }
      resultsSummary={
        <>Found {data.length} fixed asset{data.length !== 1 ? 's' : ''} acquired {yearLabel}</>
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
