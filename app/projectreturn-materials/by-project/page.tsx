'use client';
import { useState, useEffect } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { ProjectReturnMaterialData } from '@/types/projectreturnmaterials';

interface MaterialWithCurrentRate extends ProjectReturnMaterialData {
  currentUnitRate: number;
  currentValue: number;
}

// Function to calculate current unit rate based on age
function calculateCurrentUnitRate(
  sourceUnitRate: number,
  receivedDate?: Date | string
): number {
  if (!receivedDate || !sourceUnitRate) {
    return 0;
  }

  const received = new Date(receivedDate);
  // Check if date is valid
  if (isNaN(received.getTime())) {
    return 0;
  }

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

export default function ReturnedMaterialsByProjectPage() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [data, setData] = useState<MaterialWithCurrentRate[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'materialCode', desc: false }
  ]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMaterialsByProject();
    } else {
      setData([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projectreturn-materials/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projectsList: string[] = await response.json();
      setProjects(projectsList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsByProject = async () => {
    if (!selectedProject) return;
    
    setLoadingMaterials(true);
    try {
      const response = await fetch(
        `/api/projectreturn-materials?sourceProject=${encodeURIComponent(selectedProject)}`
      );
      if (!response.ok) throw new Error('Failed to fetch materials');
      const materials: ProjectReturnMaterialData[] = await response.json();
      
      // Calculate current unit rate and current value for each material
      const materialsWithCurrentRate: MaterialWithCurrentRate[] = materials.map(material => {
        const currentUnitRate = calculateCurrentUnitRate(
          material.sourceUnitRate || 0,
          material.receivedInWarehouseDate
        );
        const currentValue = currentUnitRate * (material.quantity || 0);
        
        return {
          ...material,
          currentUnitRate,
          currentValue
        };
      });

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
      setLoadingMaterials(false);
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
      header: 'Current Quantity',
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
      accessorKey: 'currentValue',
      header: 'Current Value',
      cell: ({ row }) => {
        const value = row.getValue('currentValue') as number;
        return (
          <div className="text-green-700 dark:text-green-400 font-semibold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR'
            }).format(value)}
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
          Returned Materials by Project
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a project to view all returned materials with current quantities and values.
        </p>

        {/* Project Selection Dropdown */}
        <div className="mb-4">
          <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Project
          </label>
          <select
            id="project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingMaterials ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : selectedProject && data.length > 0 ? (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Project:</span> {selectedProject}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Total Materials:</span> {data.length}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Total Current Value:</span>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SAR'
              }).format(
                data.reduce((sum, material) => sum + material.currentValue, 0)
              )}
            </p>
          </div>

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
        </>
      ) : selectedProject && !loadingMaterials ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-900 dark:text-yellow-200">
            No returned materials found for the selected project.
          </p>
        </div>
      ) : null}

      {/* Legend for current unit rate calculation */}
      {selectedProject && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Current Unit Rate Calculation:
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Within 1 year: 50% of source unit rate</li>
            <li>• 1-2 years: 40% of source unit rate</li>
            <li>• 2-3 years: 30% of source unit rate</li>
            <li>• More than 3 years: 25% of source unit rate</li>
          </ul>
        </div>
      )}
    </div>
  );
}

