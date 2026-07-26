// app/inventory/materials/storage-locations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import MasterDataPageShell from '@/app/components/MasterDataPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import StorageLocationForm from '@/components/StorageLocationForm';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import type { StorageLocation } from '@/types/material';

export default function StorageLocationsPage() {
  const s = useThemeSurfaces();
  const { show } = useToast();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selected, setSelected] = useState<StorageLocation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/storage-locations');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      show({ title: 'Error', description: 'Failed to load storage locations', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const handleEdit = (loc: StorageLocation) => {
    setSelected(loc);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this storage location master? Associated storage mappings will lose their location reference.')) return;
    try {
      const res = await fetch(`/api/storage-locations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        show({ title: 'Deleted', description: 'Storage location master deleted', variant: 'success' });
        fetchLocations();
      } else {
        show({ title: 'Error', description: 'Failed to delete storage location', variant: 'destructive' });
      }
    } catch {
      show({ title: 'Error', description: 'Failed to delete storage location', variant: 'destructive' });
    }
  };

  const handleSubmit = async (location: StorageLocation) => {
    setLoading(true);
    try {
      const isEdit = Boolean(location._id);
      const res = await fetch('/api/storage-locations', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      if (!res.ok) {
        const err = await res.json();
        show({ title: 'Error', description: err.error || 'Failed to save storage location', variant: 'destructive' });
        return;
      }

      show({ title: 'Success', description: `Storage location master ${isEdit ? 'updated' : 'created'} successfully`, variant: 'success' });
      setShowForm(false);
      fetchLocations();
    } catch {
      show({ title: 'Error', description: 'Failed to save storage location', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<StorageLocation>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Warehouse Name <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'incharge',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-blue-500 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Incharge Person <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <span>{row.original.incharge}</span>,
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <span className="italic text-gray-400 break-words whitespace-normal block max-w-md">
          {row.original.remarks || '—'}
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
      <h1 className={s.pageTitle}>Storage Location Master Data</h1>
      <div className="flex justify-between mb-4">
        <button onClick={handleCreate} className={fap.btnPrimary}>Add New Location</button>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No storage locations defined</p>
          <p className="text-sm mt-1">Click &quot;Add New Location&quot; to define central or site warehouses</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 border border-slate-200 dark:border-[#2A3B4C]/30 p-2">
          <ResponsiveTanStackTable
            data={locations}
            columns={columns}
            sorting={sorting}
            setSorting={setSorting}
            getRowId={(row) => row._id || ''}
            variant="smarttags"
          />
        </div>
      )}

      {showForm && (
        <StorageLocationForm
          initial={selected}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </MasterDataPageShell>
  );
}
