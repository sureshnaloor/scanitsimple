// app/inventory/materials/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import MaterialForm from '@/components/MaterialForm';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import type { Material } from '@/types/material';

export default function MaterialsPage() {
  const s = useThemeSurfaces();
  const { show } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selected, setSelected] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch {
      show({ title: 'Error', description: 'Failed to load materials', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const handleEdit = (m: Material) => {
    setSelected(m);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this material? All associated transactions and storage details will remain but be unlinked.')) return;
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        show({ title: 'Deleted', description: 'Material master record deleted', variant: 'success' });
        fetchMaterials();
      } else {
        show({ title: 'Error', description: 'Failed to delete material', variant: 'destructive' });
      }
    } catch {
      show({ title: 'Error', description: 'Failed to delete material', variant: 'destructive' });
    }
  };

  const handleSubmit = async (material: Material) => {
    setLoading(true);
    try {
      const isEdit = Boolean(material._id);
      const res = await fetch('/api/materials', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });

      if (!res.ok) {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to save material', variant: 'destructive' });
        return;
      }

      show({ title: 'Success', description: `Material master ${isEdit ? 'updated' : 'created'} successfully`, variant: 'success' });
      setShowForm(false);
      fetchMaterials();
    } catch {
      show({ title: 'Error', description: 'Failed to save material', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Define sortable columns using TanStack Table
  const columns: ColumnDef<Material>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Code <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span className="font-mono">{row.original.code}</span>,
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span>{row.original.description}</span>,
    },
    {
      accessorKey: 'baseUOM',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Base UOM <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span>{row.original.baseUOM || '—'}</span>,
    },
    {
      accessorKey: 'materialType',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span>{row.original.materialType || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          row.original.status === 'stock'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="space-x-2">
          <button onClick={() => handleEdit(row.original)} className={fap.btnSecondary}>Edit</button>
          <button onClick={() => handleDelete(row.original._id)} className={fap.btnSecondary}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <MasterDataPageShell>
      <h1 className={s.pageTitle}>Material Master Data</h1>
      <div className="flex justify-between mb-4">
        <button onClick={handleCreate} className={fap.btnPrimary}>Add New Material</button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No materials found</p>
          <p className="text-sm mt-1">Click &quot;Add New Material&quot; to get started</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 border border-slate-200 dark:border-[#2A3B4C]/30 p-2">
          <ResponsiveTanStackTable
            data={materials}
            columns={columns}
            sorting={sorting}
            setSorting={setSorting}
            getRowId={(row) => row._id || ''}
            variant="smarttags"
          />
        </div>
      )}

      {showForm && (
        <MaterialForm
          initial={selected}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </MasterDataPageShell>
  );
}
