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

interface Category { _id: string; name: string; }

export default function MMESearchByCategoryPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/categories/mme');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const searchEquipment = async (category: string) => {
    if (!category?.trim()) { setData([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('category', category);
      const response = await fetch(`/api/mme/search-by-category?${params.toString()}`);
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
    if (selectedCategory) searchEquipment(selectedCategory);
    else setData([]);
  }, [selectedCategory]);

  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Asset Number <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link href={`/asset/${row.original.assetnumber}`} className={s.link}>{row.original.assetnumber}</Link>
      ),
    },
    {
      accessorKey: 'assetcategory',
      header: ({ column }) => (
        <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Category <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetcategory')}</div>,
    },
    {
      accessorKey: 'assetsubcategory',
      header: 'Subcategory',
      cell: ({ row }) => <div className="text-[12px]">{row.getValue('assetsubcategory') || 'N/A'}</div>,
    },
    { accessorKey: 'assetdescription', header: 'Description' },
    { accessorKey: 'assetmanufacturer', header: 'Manufacturer' },
    { accessorKey: 'assetmodel', header: 'Model' },
    { accessorKey: 'assetstatus', header: 'Status' },
  ];

  return (
    <SearchPageLayout
      title="MME Search by Category"
      subtitle="Search MME equipment by category"
      hint="Select a category to search for equipment."
      searchArea={
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`max-w-sm ${s.select}`} disabled={loadingCategories}>
          <option value="">Select a category...</option>
          {categories.map((category) => (
            <option key={category._id} value={category.name}>{category.name}</option>
          ))}
        </select>
      }
      loading={loading}
      showResults={data.length > 0}
      emptyContent={selectedCategory ? 'No equipment found for the selected category' : 'Select a category to search for equipment'}
      resultsSummary={<>Found {data.length} equipment record{data.length !== 1 ? 's' : ''} for category &quot;{selectedCategory}&quot;</>}
    >
      <ResponsiveTanStackTable data={data} columns={columns} sorting={sorting} setSorting={setSorting} columnFilters={columnFilters} setColumnFilters={setColumnFilters} getRowId={(row) => row._id} variant="smarttags" />
    </SearchPageLayout>
  );
}
