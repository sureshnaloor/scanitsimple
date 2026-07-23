'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Edit, Trash2 } from 'lucide-react';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { UnidentifiedItem } from '@/types/asset';

export default function UnidentifiedAssetsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  const [data, setData] = useState<UnidentifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UnidentifiedItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<UnidentifiedItem | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unidentified-assets');
      if (!response.ok) throw new Error('Failed to fetch items');
      const items = await response.json();
      setData(items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 0.6)';
        ctx.fill();

        particlesRef.current.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(45, 212, 191, ${0.3 * (1 - distance / 100)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleAdd = async (itemData: Partial<UnidentifiedItem>) => {
    try {
      const response = await fetch('/api/unidentified-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to create item');
      await fetchItems();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    }
  };

  const handleUpdate = async (id: string, itemData: Partial<UnidentifiedItem>) => {
    try {
      const response = await fetch(`/api/unidentified-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to update item');
      await fetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/unidentified-assets/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      await fetchItems();
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const columns: ColumnDef<UnidentifiedItem>[] = [
    {
      accessorKey: 'assetdescription',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset Description
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue('assetdescription') || 'N/A'}</div>,
    },
    {
      accessorKey: 'assetmanufacturer',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Manufacturer
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: 'assetmodel',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Model
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: 'assetserialnumber',
      header: 'Serial Number',
    },
    {
      accessorKey: 'possibleassetnumber',
      header: 'Possible Asset Number',
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
      accessorKey: 'assetvalue',
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
        const value = row.getValue('assetvalue') as number;
        return value ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR'
        }).format(value) : 'N/A';
      }
    },
    {
      accessorKey: 'location',
      header: 'Location',
    },
    {
      accessorKey: 'locationdate',
      header: 'Location Date',
      cell: ({ row }) => {
        const date = row.getValue('locationdate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    },
    {
      accessorKey: 'custodianname',
      header: 'Custodian',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingItem(row.original)}
            className="p-1 text-teal-400 hover:text-teal-300 transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteItem(row.original)}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent mb-2">
                Unidentified Assets
              </h1>
              <p className="text-white/80 text-lg">Manage unidentified assets</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add New
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-white/80">
              No unidentified items found. Click "Add New" to create one.
            </div>
          ) : (
            <ResponsiveTanStackTable
              data={data}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              getRowId={(row) => row._id || ''}
            />
          )}
        </div>
      </div>

      {showAddModal && (
        <ItemFormModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {editingItem && (
        <ItemFormModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={(data) => handleUpdate(editingItem._id!, data)}
        />
      )}

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={() => handleDelete(deleteItem._id!)}
        />
      )}
    </div>
  );
}

// Form Modal Component
function ItemFormModal({
  item,
  onClose,
  onSubmit,
}: {
  item?: UnidentifiedItem;
  onClose: () => void;
  onSubmit: (data: Partial<UnidentifiedItem>) => void;
}) {
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ _id: string; category: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [formData, setFormData] = useState({
    assetdescription: item?.assetdescription || '',
    assetmodel: item?.assetmodel || '',
    assetmanufacturer: item?.assetmanufacturer || '',
    assetserialnumber: item?.assetserialnumber || '',
    possibleassetnumber: item?.possibleassetnumber || '',
    assetvalue: item?.assetvalue || undefined,
    assettype: item?.assettype || '',
    assetcategory: item?.assetcategory || '',
    assetsubcategory: item?.assetsubcategory || '',
    location: item?.location || '',
    locationdate: item?.locationdate ? new Date(item.locationdate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    custodianuser: item?.custodianuser || '',
    custodianname: item?.custodianname || '',
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/categories/fixedasset');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes or when item is loaded
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.assetcategory || formData.assetcategory === '') {
        setSubcategories([]);
        if (!item?.assetsubcategory) {
          setFormData(prev => ({ ...prev, assetsubcategory: '' }));
        }
        return;
      }

      setLoadingSubcategories(true);
      try {
        const response = await fetch(`/api/subcategories/fixedasset?category=${encodeURIComponent(formData.assetcategory)}`);
        if (!response.ok) throw new Error('Failed to fetch subcategories');
        const data = await response.json();
        setSubcategories(data);
        // Reset subcategory if current one doesn't belong to new category
        if (formData.assetsubcategory && !data.find((s: { name: string }) => s.name === formData.assetsubcategory)) {
          setFormData(prev => ({ ...prev, assetsubcategory: '' }));
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, [formData.assetcategory, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetdescription || !formData.assetmodel || !formData.assetmanufacturer || !formData.assetserialnumber) {
      alert('Asset Description, Model, Manufacturer, and Serial Number are required');
      return;
    }
    // Convert form data to match API expectations
    const submitData: Partial<UnidentifiedItem> = {
      ...formData,
      locationdate: formData.locationdate ? new Date(formData.locationdate) : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {item ? 'Edit Unidentified Asset' : 'Add Unidentified Asset'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-1">
                Asset Description/Name *
              </label>
              <input
                type="text"
                required
                value={formData.assetdescription}
                onChange={(e) => setFormData({ ...formData, assetdescription: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                placeholder="Enter asset description or name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                required
                value={formData.assetmanufacturer}
                onChange={(e) => setFormData({ ...formData, assetmanufacturer: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={formData.assetmodel}
                onChange={(e) => setFormData({ ...formData, assetmodel: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={formData.assetserialnumber}
                onChange={(e) => setFormData({ ...formData, assetserialnumber: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Possible Asset Number
              </label>
              <input
                type="text"
                value={formData.possibleassetnumber}
                onChange={(e) => setFormData({ ...formData, possibleassetnumber: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Value (Estimated)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.assetvalue || ''}
                onChange={(e) => setFormData({ ...formData, assetvalue: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Type (Estimated)
              </label>
              <input
                type="text"
                value={formData.assettype}
                onChange={(e) => setFormData({ ...formData, assettype: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Category (Estimated)
              </label>
              <select
                value={formData.assetcategory}
                onChange={(e) => setFormData({ ...formData, assetcategory: e.target.value, assetsubcategory: '' })}
                disabled={loadingCategories}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all disabled:opacity-50"
              >
                <option value="" className="bg-[#1a2332]">Select Category...</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name} className="bg-[#1a2332]">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Subcategory (Estimated)
              </label>
              <select
                value={formData.assetsubcategory}
                onChange={(e) => setFormData({ ...formData, assetsubcategory: e.target.value })}
                disabled={loadingSubcategories || !formData.assetcategory || subcategories.length === 0}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#1a2332]">Select Subcategory...</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory._id} value={subcategory.name} className="bg-[#1a2332]">
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Location Date
              </label>
              <input
                type="date"
                value={formData.locationdate}
                onChange={(e) => setFormData({ ...formData, locationdate: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Custodian User
              </label>
              <input
                type="text"
                value={formData.custodianuser}
                onChange={(e) => setFormData({ ...formData, custodianuser: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Custodian Name
              </label>
              <input
                type="text"
                value={formData.custodianname}
                onChange={(e) => setFormData({ ...formData, custodianname: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  item,
  onClose,
  onConfirm,
}: {
  item: UnidentifiedItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Confirm Delete
        </h2>
        <p className="mb-4 text-white/80">
          Are you sure you want to delete this item?
          <br />
          <strong className="text-white">Manufacturer:</strong> {item.assetmanufacturer}
          <br />
          <strong className="text-white">Model:</strong> {item.assetmodel}
          <br />
          <strong className="text-white">Serial Number:</strong> {item.assetserialnumber}
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

