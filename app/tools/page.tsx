'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { ToolData } from '@/types/tools';
import AssetQRCode from '@/components/AssetQRCode';
import { useAppTheme } from '@/app/contexts/ThemeContext';

export default function ToolsPage() {
  const { theme } = useAppTheme();
  const [data, setData] = useState<ToolData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  // Animated particle background for glassmorphic theme only (same as /mme)
  useEffect(() => {
    if (theme !== 'glassmorphic') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

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
      if (!ctx || !canvas || theme !== 'glassmorphic') return;

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
  }, [theme]);

  // Page chrome aligned with /mme (glass + default share frosted panels on dark gradient)
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          textColor: 'text-white',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          searchBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          buttonAdd: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          tableBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          tableHover: 'hover:bg-white/15',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          actionEdit: 'text-teal-400 hover:text-teal-300',
          actionDelete: 'text-red-400 hover:text-red-300',
          modalOverlay: 'bg-black/60 backdrop-blur-sm',
          modalBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          modalTitle: 'text-white',
          modalInput: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          modalSelect: 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:ring-teal-400',
          modalTextarea: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          modalButtonCancel: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          modalButtonSubmit: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          modalButtonDisabled: 'bg-white/5 backdrop-blur-md border border-white/10 text-white/50 cursor-not-allowed'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          textColor: 'text-gray-900',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerHover: 'hover:bg-blue-50',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          searchBg: 'bg-white border-2 border-blue-200 shadow-md',
          buttonAdd: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          tableBg: 'border-2 border-blue-200 bg-white shadow-md',
          tableHover: 'hover:bg-blue-50',
          spinnerColor: 'border-blue-500',
          linkColor: 'text-blue-600 hover:text-blue-700',
          cellText: 'text-gray-900',
          actionEdit: 'text-blue-600 hover:text-blue-700',
          actionDelete: 'text-red-600 hover:text-red-700',
          modalOverlay: 'bg-black/40 backdrop-blur-sm',
          modalBg: 'bg-white border-2 border-blue-200 shadow-xl',
          modalTitle: 'text-gray-900',
          modalInput: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          modalSelect: 'bg-white border-2 border-blue-300 text-gray-900 focus:ring-blue-500',
          modalTextarea: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500',
          modalButtonCancel: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          modalButtonSubmit: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          modalButtonDisabled: 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
        };
      default:
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          textColor: 'text-white',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          searchBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          buttonAdd: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          tableBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          tableHover: 'hover:bg-white/15',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          actionEdit: 'text-teal-400 hover:text-teal-300',
          actionDelete: 'text-red-400 hover:text-red-300',
          modalOverlay: 'bg-black/70 backdrop-blur-sm',
          modalBg: 'bg-slate-800/95 border border-slate-700 shadow-xl',
          modalTitle: 'text-slate-100',
          modalInput: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          modalSelect: 'bg-slate-800/90 border border-slate-600 text-slate-100 focus:ring-teal-400',
          modalTextarea: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400',
          modalButtonCancel: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          modalButtonSubmit: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          modalButtonDisabled: 'bg-slate-700/30 border border-slate-600/50 text-slate-500 cursor-not-allowed'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = async (toolData: Partial<ToolData>) => {
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toolData),
      });

      if (!response.ok) throw new Error('Failed to add tool');
      
      await fetchTools();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding tool:', error);
    }
  };

  const handleEditTool = async (toolId: string, toolData: Partial<ToolData>) => {
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toolData),
      });

      if (!response.ok) throw new Error('Failed to update tool');
      
      await fetchTools();
      setEditingTool(null);
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete tool');
      
      await fetchTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const columns: ColumnDef<ToolData>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tool ID
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <Link 
          href={`/tools/${row.original.assetnumber}`}
          className={`${backgroundStyles.linkColor} transition-colors font-semibold`}
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'toolDescription',
      header: ({ column }) => (
        <button
          type="button"
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <div className={`max-w-[300px] truncate text-[12px] ${backgroundStyles.cellText}`}>
          {row.getValue('toolDescription')}
        </div>
      ),
    },
    {
      accessorKey: 'serialNumber',
      header: () => <span className={backgroundStyles.textColor}>Serial Number</span>,
    },
    {
      accessorKey: 'manufacturer',
      header: () => <span className={backgroundStyles.textColor}>Manufacturer</span>,
    },
    {
      accessorKey: 'modelNumber',
      header: () => <span className={backgroundStyles.textColor}>Model</span>,
    },
    {
      accessorKey: 'toolCost',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Cost
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('toolCost');
        return typeof value === 'number' ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR'
        }).format(value) : 'N/A';
      }
    },
    {
      accessorKey: 'purchasedDate',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Purchase Date
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('purchasedDate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    },
    {
      accessorKey: 'toolStatus',
      header: () => <span className={backgroundStyles.textColor}>Status</span>,
    },
    {
      accessorKey: 'toolLocation',
      header: () => <span className={backgroundStyles.textColor}>Location</span>,
    },
    {
      id: 'qrcode',
      header: () => <span className={backgroundStyles.textColor}>QR Code</span>,
      cell: ({ row }) => (
        <AssetQRCode 
          assetNumber={row.original.assetnumber} 
          assetDescription={row.original.toolDescription}
          assetType="Tool" 
        />
      )
    },
    {
      id: 'actions',
      header: () => <span className={backgroundStyles.textColor}>Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingTool(row.original)}
            className={`${backgroundStyles.actionEdit} transition-colors`}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteTool(row.original.assetnumber)}
            className={`${backgroundStyles.actionDelete} transition-colors`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    const styles = getBackgroundStyles();
    return (
      <div className={`${styles.container} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 ${styles.spinnerColor}`}></div>
        <p className={`${styles.textColor} ml-4`}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={backgroundStyles.container}>
      {theme === 'glassmorphic' && (
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      )}

      <div className={`relative ${theme === 'glassmorphic' ? 'z-20' : 'z-10'} pt-8 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className={`${backgroundStyles.headerBg} ${backgroundStyles.headerHover} rounded-3xl p-8 transition-all duration-300`}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
                    Tools Management
                  </h1>
                  <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Manage and track your tools inventory</p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className={`flex items-center gap-2 px-6 py-3 ${backgroundStyles.buttonAdd} rounded-xl font-semibold transition-all duration-300`}
                >
                  <Plus className="h-5 w-5" />
                  Add Tool
                </button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className={`mb-6 p-6 ${backgroundStyles.searchBg} rounded-xl shadow-lg`}>
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search tools..."
              className={`w-full max-w-sm px-4 py-3 rounded-xl ${backgroundStyles.inputBg} focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            />
          </div>

          {/* Table Section */}
          <div className={`rounded-xl ${backgroundStyles.tableBg} shadow-xl overflow-hidden`}>
            <div className={theme === 'default' ? 'dark' : undefined}>
              <ResponsiveTanStackTable
                data={data}
                columns={columns}
                sorting={sorting}
                setSorting={setSorting}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                getRowId={(row) => row._id || row.assetnumber}
                variant={
                  theme === 'light'
                    ? 'light'
                    : theme === 'glassmorphic'
                      ? 'glassmorphic'
                      : 'default'
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Tool Form Modal */}
      {showAddForm && (
        <AddToolForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddTool}
          theme={theme}
        />
      )}

      {/* Edit Tool Form Modal */}
      {editingTool && (
        <EditToolForm
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSubmit={(toolData) => handleEditTool(editingTool.assetnumber, toolData)}
          theme={theme}
        />
      )}
    </div>
  );
}

// Add Tool Form Component
function AddToolForm({ onClose, onSubmit, theme }: { onClose: () => void; onSubmit: (data: Partial<ToolData>) => void; theme?: string }) {
  const getModalStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          overlay: 'bg-black/60 backdrop-blur-sm',
          bg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          title: 'text-white',
          input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          select: 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:ring-teal-400',
          textarea: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          buttonCancel: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          buttonSubmit: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          buttonDisabled: 'bg-white/5 backdrop-blur-md border border-white/10 text-white/50 cursor-not-allowed',
          label: 'text-white'
        };
      case 'light':
        return {
          overlay: 'bg-black/40 backdrop-blur-sm',
          bg: 'bg-white border-2 border-blue-200 shadow-xl',
          title: 'text-gray-900',
          input: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          select: 'bg-white border-2 border-blue-300 text-gray-900 focus:ring-blue-500',
          textarea: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500',
          buttonCancel: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          buttonSubmit: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          buttonDisabled: 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed',
          label: 'text-gray-700'
        };
      default:
        return {
          overlay: 'bg-black/70 backdrop-blur-sm',
          bg: 'bg-slate-800/95 border border-slate-700 shadow-xl',
          title: 'text-slate-100',
          input: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          select: 'bg-slate-800/90 border border-slate-600 text-slate-100 focus:ring-teal-400',
          textarea: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400',
          buttonCancel: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          buttonSubmit: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          buttonDisabled: 'bg-slate-700/30 border border-slate-600/50 text-slate-500 cursor-not-allowed',
          label: 'text-slate-200'
        };
    }
  };

  const modalStyles = getModalStyles();
  const [formData, setFormData] = useState<Partial<ToolData>>({
    toolDescription: '',
    serialNumber: '',
    manufacturer: '',
    modelNumber: '',
    toolCost: 0,
    purchasedDate: new Date(),
    purchasePONumber: '',
    purchaseSupplier: '',
    toolCategory: '',
    toolSubcategory: '',
    toolStatus: 'Available',
    toolLocation: 'Warehouse',
    toolCondition: 'Good',
    toolNotes: '',
    accessories: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={`fixed inset-0 ${modalStyles.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${modalStyles.bg} rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <h2 className={`text-2xl font-bold mb-6 ${modalStyles.title}`}>Add New Tool</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Description *
              </label>
              <input
                type="text"
                required
                value={formData.toolDescription}
                onChange={(e) => setFormData({ ...formData, toolDescription: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Model Number
              </label>
              <input
                type="text"
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.toolCost}
                onChange={(e) => setFormData({ ...formData, toolCost: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchasedDate ? (formData.purchasedDate instanceof Date ? formData.purchasedDate.toISOString().split('T')[0] : formData.purchasedDate) : ''}
                onChange={(e) => setFormData({ ...formData, purchasedDate: new Date(e.target.value) })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase PO Number
              </label>
              <input
                type="text"
                value={formData.purchasePONumber}
                onChange={(e) => setFormData({ ...formData, purchasePONumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase Supplier
              </label>
              <input
                type="text"
                value={formData.purchaseSupplier}
                onChange={(e) => setFormData({ ...formData, purchaseSupplier: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Status
              </label>
              <select
                value={formData.toolStatus}
                onChange={(e) => setFormData({ ...formData, toolStatus: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Location
              </label>
              <select
                value={formData.toolLocation}
                onChange={(e) => setFormData({ ...formData, toolLocation: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Warehouse">Warehouse</option>
                <option value="Project Site">Project Site</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Condition
              </label>
              <select
                value={formData.toolCondition}
                onChange={(e) => setFormData({ ...formData, toolCondition: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Accessories
              </label>
              <input
                type="text"
                value={formData.accessories}
                onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Notes
              </label>
              <textarea
                value={formData.toolNotes}
                onChange={(e) => setFormData({ ...formData, toolNotes: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 ${modalStyles.textarea} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 ${modalStyles.buttonCancel} rounded-xl transition-all duration-300 font-medium`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 ${modalStyles.buttonSubmit} rounded-xl font-semibold transition-all duration-300`}
            >
              Add Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Tool Form Component
function EditToolForm({ tool, onClose, onSubmit, theme }: { tool: ToolData; onClose: () => void; onSubmit: (data: Partial<ToolData>) => void; theme?: string }) {
  const [formData, setFormData] = useState<Partial<ToolData>>(tool);

  const getModalStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          overlay: 'bg-black/60 backdrop-blur-sm',
          bg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          title: 'text-white',
          input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          select: 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:ring-teal-400',
          textarea: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          buttonCancel: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          buttonSubmit: 'bg-teal-500/20 backdrop-blur-md border border-teal-400/30 text-teal-300 hover:bg-teal-500/30 hover:border-teal-400/50',
          buttonDisabled: 'bg-white/5 backdrop-blur-md border border-white/10 text-white/50 cursor-not-allowed',
          label: 'text-white'
        };
      case 'light':
        return {
          overlay: 'bg-black/40 backdrop-blur-sm',
          bg: 'bg-white border-2 border-blue-200 shadow-xl',
          title: 'text-gray-900',
          input: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          select: 'bg-white border-2 border-blue-300 text-gray-900 focus:ring-blue-500',
          textarea: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500',
          buttonCancel: 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200',
          buttonSubmit: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500',
          buttonDisabled: 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed',
          label: 'text-gray-700'
        };
      default:
        return {
          overlay: 'bg-black/70 backdrop-blur-sm',
          bg: 'bg-slate-800/95 border border-slate-700 shadow-xl',
          title: 'text-slate-100',
          input: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          select: 'bg-slate-800/90 border border-slate-600 text-slate-100 focus:ring-teal-400',
          textarea: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400',
          buttonCancel: 'bg-slate-700/50 border border-slate-600 text-slate-200 hover:bg-slate-600',
          buttonSubmit: 'bg-teal-600 hover:bg-teal-700 text-white border border-teal-500',
          buttonDisabled: 'bg-slate-700/30 border border-slate-600/50 text-slate-500 cursor-not-allowed',
          label: 'text-slate-200'
        };
    }
  };

  const modalStyles = getModalStyles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={`fixed inset-0 ${modalStyles.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${modalStyles.bg} rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <h2 className={`text-2xl font-bold mb-6 ${modalStyles.title}`}>Edit Tool</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool ID
              </label>
              <input
                type="text"
                value={formData.assetnumber}
                disabled
                className={`w-full px-4 py-2 ${modalStyles.buttonDisabled} rounded-xl`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Description *
              </label>
              <input
                type="text"
                required
                value={formData.toolDescription}
                onChange={(e) => setFormData({ ...formData, toolDescription: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Model Number
              </label>
              <input
                type="text"
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.toolCost}
                onChange={(e) => setFormData({ ...formData, toolCost: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchasedDate ? new Date(formData.purchasedDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, purchasedDate: new Date(e.target.value) })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase PO Number
              </label>
              <input
                type="text"
                value={formData.purchasePONumber}
                onChange={(e) => setFormData({ ...formData, purchasePONumber: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Purchase Supplier
              </label>
              <input
                type="text"
                value={formData.purchaseSupplier}
                onChange={(e) => setFormData({ ...formData, purchaseSupplier: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Status
              </label>
              <select
                value={formData.toolStatus}
                onChange={(e) => setFormData({ ...formData, toolStatus: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Location
              </label>
              <select
                value={formData.toolLocation}
                onChange={(e) => setFormData({ ...formData, toolLocation: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Warehouse">Warehouse</option>
                <option value="Project Site">Project Site</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Tool Condition
              </label>
              <select
                value={formData.toolCondition}
                onChange={(e) => setFormData({ ...formData, toolCondition: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.select} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Accessories
              </label>
              <input
                type="text"
                value={formData.accessories}
                onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                className={`w-full px-4 py-2 ${modalStyles.input} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${modalStyles.label} mb-2`}>
                Notes
              </label>
              <textarea
                value={formData.toolNotes}
                onChange={(e) => setFormData({ ...formData, toolNotes: e.target.value })}
                rows={3}
                className={`w-full px-4 py-2 ${modalStyles.textarea} rounded-xl focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 ${modalStyles.buttonCancel} rounded-xl transition-all duration-300 font-medium`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 ${modalStyles.buttonSubmit} rounded-xl font-semibold transition-all duration-300`}
            >
              Update Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
