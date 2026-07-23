'use client';
import { useState, useEffect } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { ProjectReturnMaterialData } from '@/types/projectreturnmaterials';

interface MaterialWithCurrentRate extends ProjectReturnMaterialData {
  currentUnitRate: number;
  ageInYears: number;
}

// Function to calculate age in years
function calculateAgeInYears(receivedDate?: Date): number {
  if (!receivedDate) {
    return 0;
  }

  const received = new Date(receivedDate);
  const now = new Date();
  const diffTime = now.getTime() - received.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
  
  return diffYears;
}

// Function to calculate current unit rate based on age
function calculateCurrentUnitRate(
  sourceUnitRate: number,
  receivedDate?: Date
): number {
  if (!receivedDate || !sourceUnitRate) {
    return 0;
  }

  const received = new Date(receivedDate);
  const now = new Date();
  const diffTime = now.getTime() - received.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years

  let percentage = 0.25; // Default for more than 3 years

  if (diffYears <= 1) {
    percentage = 0.5; // 50% for within 1 year
  } else if (diffYears <= 2) {
    percentage = 0.4; // 40% for 1-2 years
  } else if (diffYears <= 3) {
    percentage = 0.3; // 30% for 2-3 years
  }

  return sourceUnitRate * percentage;
}

export default function ListAllRecoForDisposalMaterialsPage() {
  const [data, setData] = useState<MaterialWithCurrentRate[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'materialCode', desc: false } // Sort by material code ascending
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      // Fetch all materials excluding disposed ones
      const response = await fetch('/api/projectreturn-materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      const materials: ProjectReturnMaterialData[] = await response.json();
      
      // Calculate current unit rate and age for each material, and filter for materials older than 3 years
      const materialsWithCurrentRate: MaterialWithCurrentRate[] = materials
        .map(material => {
          const ageInYears = calculateAgeInYears(material.receivedInWarehouseDate);
          return {
            ...material,
            currentUnitRate: calculateCurrentUnitRate(
              material.sourceUnitRate || 0,
              material.receivedInWarehouseDate
            ),
            ageInYears
          };
        })
        .filter(material => material.ageInYears > 3); // Only materials older than 3 years

      // Sort by material code ascending
      materialsWithCurrentRate.sort((a, b) => {
        const codeA = (a.materialCode || '').toLowerCase();
        const codeB = (b.materialCode || '').toLowerCase();
        return codeA.localeCompare(codeB);
      });

      setData(materialsWithCurrentRate);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<MaterialWithCurrentRate>[] = [
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
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
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
      accessorKey: 'currentUnitRate',
      header: 'Current Unit Rate',
      cell: ({ row }) => {
        const rate = row.getValue('currentUnitRate') as number;
        return (
          <div className="text-green-700 dark:text-green-400 font-semibold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(rate)}
          </div>
        );
      },
    },
    {
      accessorKey: 'ageInYears',
      header: 'Age (Years)',
      cell: ({ row }) => {
        const age = row.getValue('ageInYears') as number;
        return (
          <div className="text-orange-700 dark:text-orange-400 font-medium">
            {age.toFixed(1)}
          </div>
        );
      },
    },
    {
      accessorKey: 'receivedInWarehouseDate',
      header: 'Received Date',
      cell: ({ row }) => {
        const date = row.getValue('receivedInWarehouseDate') as Date;
        return (
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            {date ? new Date(date).toLocaleDateString() : 'N/A'}
          </div>
        );
      },
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Materials Recommended for Disposal
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This list shows materials that are older than 3 years and are recommended for disposal based on their depreciation.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No materials found that are recommended for disposal (older than 3 years).
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
            />
          </div>

          {/* Summary Information */}
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              Summary:
            </h3>
            <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
              <li>• Total materials recommended for disposal: <strong>{data.length}</strong></li>
              <li>• These materials are older than 3 years and have reached the minimum depreciation rate (25% of source unit rate)</li>
              <li>• Consider disposing of these materials to free up warehouse space and reduce inventory carrying costs</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

