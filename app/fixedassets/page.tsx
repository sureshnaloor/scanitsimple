'use client';
import { useState, useEffect } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';

interface FixedAsset {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  acquiredvalue?: number;
  acquireddate?: Date;
  assetlocation?: string;
  assetcondition?: string;
}

export default function FixedAssetsPage() {
  const [data, setData] = useState<FixedAsset[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixedAssets();
  }, []);

  const fetchFixedAssets = async () => {
    try {
      const response = await fetch('/api/fixedassets');
      if (!response.ok) throw new Error('Failed to fetch fixed assets');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<FixedAsset>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
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
          className="text-blue-400 hover:text-blue-300"
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'assetdescription',
      header: 'Description',
      cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue('assetdescription')}</div>,
    },
    {
      accessorKey: 'assetcategory',
      header: 'Category',
    },
    {
      accessorKey: 'assetsubcategory',
      header: 'Subcategory',
    },
    {
      accessorKey: 'assetstatus',
      header: 'Status',
    },
    {
      accessorKey: 'acquiredvalue',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('acquiredvalue');
        return typeof value === 'number' ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR'
        }).format(value) : 'N/A';
      }
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Acquiring Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    },
    {
      accessorKey: 'assetlocation',
      header: 'Location',
    },
    {
      accessorKey: 'assetcondition',
      header: 'Condition',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search fixed assets..."
          className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ResponsiveTanStackTable
          data={data}
          columns={columns}
          sorting={sorting}
          setSorting={setSorting}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          getRowId={(row) => row._id}
        />
      </div>
    </div>
  );
} 