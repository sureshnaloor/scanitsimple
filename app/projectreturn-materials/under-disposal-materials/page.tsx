'use client';
import { useState, useEffect } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown, AlertTriangle } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { DisposedMaterial } from '@/types/projectreturnmaterials';

export default function UnderDisposalMaterialsPage() {
  const [data, setData] = useState<DisposedMaterial[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'materialCode', desc: false } // Sort by material code ascending
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisposedMaterials();
  }, []);

  const fetchDisposedMaterials = async () => {
    try {
      const response = await fetch('/api/disposed-materials');
      if (!response.ok) throw new Error('Failed to fetch disposed materials');
      const materials: DisposedMaterial[] = await response.json();
      
      // Sort by material code ascending
      materials.sort((a, b) => {
        const codeA = (a.materialCode || '').toLowerCase();
        const codeB = (b.materialCode || '').toLowerCase();
        return codeA.localeCompare(codeB);
      });

      setData(materials);
    } catch (error) {
      console.error('Error fetching disposed materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<DisposedMaterial>[] = [
    {
      accessorKey: 'materialCode',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Material Code
            <ArrowUpDown className="h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {row.getValue('materialCode')}
        </div>
      ),
    },
    {
      accessorKey: 'materialDescription',
      header: 'Material Description',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300 max-w-xs">
          {row.getValue('materialDescription')}
        </div>
      ),
    },
    {
      accessorKey: 'uom',
      header: 'UOM',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue('uom')}
        </div>
      ),
    },
    {
      accessorKey: 'disposedQuantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const quantity = row.getValue('disposedQuantity') as number;
        return (
          <div className="text-gray-900 dark:text-white font-medium">
            {quantity.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'warehouseLocation',
      header: 'Warehouse Location',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300">
          {row.getValue('warehouseLocation')}
        </div>
      ),
    },
    {
      accessorKey: 'sourceUnitRate',
      header: 'Source Unit Rate',
      cell: ({ row }) => {
        const rate = row.getValue('sourceUnitRate') as number;
        return (
          <div className="text-gray-900 dark:text-white font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(rate)}
          </div>
        );
      },
    },
    {
      accessorKey: 'disposedValue',
      header: 'Disposed Value',
      cell: ({ row }) => {
        const value = row.getValue('disposedValue') as number;
        return (
          <div className="text-red-700 dark:text-red-400 font-semibold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(value)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'disposedAt',
      header: 'Disposed Date',
      cell: ({ row }) => {
        const date = row.getValue('disposedAt') as Date;
        return (
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'disposedBy',
      header: 'Disposed By',
      cell: ({ row }) => (
        <div className="text-gray-700 dark:text-gray-300 text-sm">
          {row.getValue('disposedBy')}
        </div>
      ),
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Materials Under Disposal
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Materials that have been flagged as scrap and are currently in the disposal area.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No materials are currently under disposal.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <ResponsiveTanStackTable
              data={data}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={[]}
              setColumnFilters={() => {}}
              globalFilter=""
              setGlobalFilter={() => {}}
              getRowId={(row) => row._id || row.materialid}
            />
          </div>

          {/* Summary Information */}
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
              Summary:
            </h3>
            <ul className="text-xs text-red-800 dark:text-red-300 space-y-1">
              <li>• Total materials under disposal: <strong>{data.length}</strong></li>
              <li>• Total disposed value: <strong>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'SAR'
                }).format(data.reduce((sum, material) => sum + (material.disposedValue || 0), 0))}
              </strong></li>
              <li>• These materials have been flagged as scrap and are kept in the disposal area</li>
              <li>• Materials are sorted by material code in ascending order</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

