'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Trash2, AlertTriangle, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { DisposedMaterial } from '@/types/projectreturnmaterials';
import { useAppTheme } from '@/app/contexts/ThemeContext';

export default function DisposedMaterialsPage() {
  const { theme } = useAppTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationFrameRef = useRef<number>();

  const [data, setData] = useState<DisposedMaterial[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisposedMaterials();
  }, []);

  // Theme-based styling function
  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerTitle: 'bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          headerIcon: 'text-red-400',
          searchCardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          labelText: 'text-white',
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          tableBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          spinnerColor: 'border-teal-400',
          loadingBg: 'bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          cellSubtext: 'text-white/80',
          cellIcon: 'text-white/70',
          statusBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
          emptyCardBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          emptyIcon: 'text-white/60',
          emptyTitle: 'text-white',
          emptyText: 'text-white/70',
          headerButton: 'text-white hover:text-teal-400'
        };
      case 'light':
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerTitle: 'bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          headerIcon: 'text-red-600',
          searchCardBg: 'bg-white border-2 border-blue-200 shadow-md',
          labelText: 'text-gray-900',
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          tableBg: 'bg-white border-2 border-blue-200 shadow-md',
          spinnerColor: 'border-blue-500',
          loadingBg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          linkColor: 'text-blue-600 hover:text-blue-700',
          cellText: 'text-gray-900',
          cellSubtext: 'text-gray-600',
          cellIcon: 'text-gray-500',
          statusBadge: 'bg-red-100 text-red-800 border-2 border-red-300',
          emptyCardBg: 'bg-white border-2 border-blue-200 shadow-md',
          emptyIcon: 'text-gray-400',
          emptyTitle: 'text-gray-900',
          emptyText: 'text-gray-600',
          headerButton: 'text-gray-700 hover:text-blue-600'
        };
      default: // dark theme
        return {
          container: 'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          headerBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          headerTitle: 'bg-gradient-to-r from-slate-100 to-red-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-slate-300',
          headerIcon: 'text-red-400',
          searchCardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          labelText: 'text-slate-200',
          inputBg: 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400',
          tableBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          spinnerColor: 'border-teal-400',
          loadingBg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-slate-200',
          cellSubtext: 'text-slate-400',
          cellIcon: 'text-slate-400',
          statusBadge: 'bg-red-900/50 text-red-300 border-red-700',
          emptyCardBg: 'bg-slate-800/90 border border-slate-700 shadow-xl',
          emptyIcon: 'text-slate-400',
          emptyTitle: 'text-slate-200',
          emptyText: 'text-slate-400',
          headerButton: 'text-slate-200 hover:text-teal-400'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

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

        // Draw particle - theme-based colors
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        if (theme === 'light') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // blue for light theme
        } else if (theme === 'glassmorphic') {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.6)'; // teal for glassmorphic
        } else {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.6)'; // teal for dark theme
        }
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
              if (theme === 'light') {
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.25 * (1 - distance / 100)})`;
              } else {
                ctx.strokeStyle = `rgba(45, 212, 191, ${0.3 * (1 - distance / 100)})`;
              }
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

  const fetchDisposedMaterials = async () => {
    try {
      const response = await fetch('/api/disposed-materials');
      if (!response.ok) throw new Error('Failed to fetch disposed materials');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching disposed materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<DisposedMaterial>[] = [
    {
      accessorKey: 'materialid',
      header: ({ column }) => {
        return (
          <button
            className={`flex items-center gap-2 ${backgroundStyles.headerButton}`}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Material ID
            <ArrowUpDown className="h-4 w-4" />
          </button>
        );
      },
      cell: ({ row }) => (
        <Link 
          href={`/disposed-materials/${row.getValue('materialid')}`}
          className={`font-mono text-sm ${backgroundStyles.linkColor} hover:underline transition-colors`}
        >
          {row.getValue('materialid')}
        </Link>
      ),
    },
    {
      accessorKey: 'materialCode',
      header: 'Material Info',
      cell: ({ row }) => {
        const materialCode = row.getValue('materialCode') as string;
        const materialDescription = row.original.materialDescription;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              {materialCode}
            </div>
            <div className={`${backgroundStyles.cellSubtext} text-xs max-w-xs truncate`} title={materialDescription}>
              {materialDescription}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'uom',
      header: 'UOM',
    },
    {
      accessorKey: 'disposedQuantity',
      header: 'Disposal Details',
      cell: ({ row }) => {
        const disposedQuantity = row.getValue('disposedQuantity') as number;
        const disposedValue = row.original.disposedValue;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              Qty: {disposedQuantity.toLocaleString()}
            </div>
            <div className={backgroundStyles.cellSubtext + ' text-xs'}>
              Value: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SAR'
              }).format(disposedValue)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sourceProject',
      header: 'Project Info',
      cell: ({ row }) => {
        const sourceProject = row.getValue('sourceProject') as string;
        const sourceWBS = row.original.sourceWBS;
        return (
          <div className="space-y-1">
            <div className={`font-semibold ${backgroundStyles.cellText} text-sm`}>
              {sourceProject}
            </div>
            <div className={backgroundStyles.cellSubtext + ' text-xs'}>
              WBS: {sourceWBS}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'warehouseLocation',
      header: 'Warehouse Location',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${backgroundStyles.statusBadge}`}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'disposedBy',
      header: 'Disposal Info',
      cell: ({ row }) => {
        const disposedBy = row.getValue('disposedBy') as string;
        const disposedAt = row.original.disposedAt;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <User className={`h-3 w-3 ${backgroundStyles.cellIcon}`} />
              <span className={`text-sm font-semibold ${backgroundStyles.cellText}`}>{disposedBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className={`h-3 w-3 ${backgroundStyles.cellIcon}`} />
              <span className={`text-xs ${backgroundStyles.cellSubtext}`}>
                {new Date(disposedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${backgroundStyles.loadingBg}`}>
        <div className={`animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
      </div>
    );
  }

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* Main content */}
      <div className="relative z-20 container mx-auto p-4 min-h-screen">
        {/* Header Section */}
        <div className={`mb-6 ${backgroundStyles.headerBg} rounded-2xl p-6 shadow-xl`}>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className={`h-8 w-8 ${backgroundStyles.headerIcon}`} />
            <h1 className={`text-2xl font-bold ${backgroundStyles.headerTitle}`}>
              Disposed Materials
            </h1>
          </div>
          <p className={`${backgroundStyles.headerSubtitle} text-lg`}>
            Materials that have been disposed and moved to scrap status
          </p>
        </div>

        {/* Search Section */}
        <div className={`mb-6 ${backgroundStyles.searchCardBg} rounded-2xl p-4 shadow-xl`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${backgroundStyles.labelText} mb-2`}>
                Search Disposed Materials
              </label>
              <input
                type="text"
                placeholder="Search materials..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className={`w-full px-4 py-2 ${backgroundStyles.inputBg} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className={`${backgroundStyles.tableBg} rounded-xl shadow-xl`}>
          <ResponsiveTanStackTable
            data={data}
            columns={columns}
            sorting={sorting}
            setSorting={setSorting}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            getRowId={(row) => row._id || row.materialid}
            variant={theme === 'light' ? 'light' : 'glassmorphic'}
          />
        </div>

        {/* Empty State */}
        {data.length === 0 && (
          <div className={`text-center py-12 ${backgroundStyles.emptyCardBg} rounded-2xl mt-6`}>
            <AlertTriangle className={`h-12 w-12 ${backgroundStyles.emptyIcon} mx-auto mb-4`} />
            <h3 className={`text-lg font-medium ${backgroundStyles.emptyTitle} mb-2`}>
              No Disposed Materials
            </h3>
            <p className={backgroundStyles.emptyText}>
              No materials have been disposed yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
