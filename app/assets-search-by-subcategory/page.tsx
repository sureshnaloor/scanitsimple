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

interface Subcategory {
  _id: string;
  category: string;
  name: string;
}

export default function AssetsSearchBySubcategoryPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Asset[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  useEffect(() => {
    const fetchSubcategories = async () => {
      setLoadingSubcategories(true);
      try {
        const response = await fetch('/api/subcategories/fixedasset');
        if (!response.ok) throw new Error('Failed to fetch subcategories');
        const data = await response.json();
        setSubcategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, []);

  const searchAssets = async (subcategory: string) => {
    if (!subcategory?.trim()) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('subcategory', subcategory);
      const response = await fetch(`/api/assets/search-by-subcategory?${params.toString()}`);
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
    if (selectedSubcategory) searchAssets(selectedSubcategory);
    else setData([]);
  }, [selectedSubcategory]);

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
      accessorKey: 'assetsubcategory',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Subcategory
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetsubcategory')}</div>,
    },
    {
      accessorKey: 'assetcategory',
      header: 'Category',
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetcategory') || 'N/A'}</div>,
    },
    { accessorKey: 'assetdescription', header: 'Description' },
    { accessorKey: 'assetmanufacturer', header: 'Manufacturer' },
    { accessorKey: 'assetmodel', header: 'Model' },
    { accessorKey: 'assetstatus', header: 'Status' },
  ];

  return (
    <SearchPageLayout
      title="Fixed Assets Search by Subcategory"
      subtitle="Search for fixed assets by subcategory"
      hint="Select a subcategory to search for fixed assets."
      searchArea={
        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          className={`max-w-sm ${s.select}`}
          disabled={loadingSubcategories}
        >
          <option value="">Select a subcategory...</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory._id} value={subcategory.name}>
              {subcategory.category} - {subcategory.name}
            </option>
          ))}
        </select>
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={
        selectedSubcategory
          ? 'No fixed assets found for the selected subcategory'
          : 'Select a subcategory to search for fixed assets'
      }
      resultsSummary={
        <>Found {data.length} fixed asset{data.length !== 1 ? 's' : ''} for subcategory &quot;{selectedSubcategory}&quot;</>
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
