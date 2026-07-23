'use client';

import { useState, useEffect, useRef } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ArrowUpDown, Download } from 'lucide-react';
import Link from 'next/link';

import { AssetQRCode } from '@/components/AssetQRCode';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface Equipment {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  acquiredvalue: number;
  acquireddate: Date | string;
  assetmanufacturer: string;
  assetmodel: string;
  assetserialnumber: string;
}

export default function MMEUncalibratedPage() {
  const { theme } = useAppTheme();
  const [data, setData] = useState<Equipment[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }>
  >([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const fetchUncalibrated = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/mme/uncalibrated');
        if (!response.ok) throw new Error('Failed to fetch un-calibrated MME');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Failed to load un-calibrated MME list');
      } finally {
        setLoading(false);
      }
    };

    fetchUncalibrated();
  }, []);

  // Animated particle background for glassmorphic theme only
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
        radius: Math.random() * 3 + 1,
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

  const getBackgroundStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container:
            'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          textColor: 'text-white',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          resultsBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          emptyText: 'text-white/70',
          errorText: 'text-red-300',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          downloadButton:
            'bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 disabled:cursor-not-allowed text-white shadow-lg shadow-teal-500/30',
          resultsMetaBorder: 'border-white/20',
          resultsMetaText: 'text-white/80',
        };
      case 'light':
        return {
          container:
            'relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          textColor: 'text-gray-900',
          headerBg: 'bg-white border-2 border-blue-200 shadow-lg',
          headerHover: 'hover:bg-blue-50',
          headerTitle: 'bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent',
          headerSubtitle: 'text-gray-700',
          resultsBg: 'border-2 border-blue-200 bg-white shadow-md',
          emptyText: 'text-gray-600',
          errorText: 'text-red-600',
          spinnerColor: 'border-blue-500',
          linkColor: 'text-blue-600 hover:text-blue-700',
          cellText: 'text-gray-900',
          downloadButton:
            'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white border-2 border-blue-500 shadow-md',
          resultsMetaBorder: 'border-blue-200',
          resultsMetaText: 'text-gray-700',
        };
      default:
        return {
          container:
            'relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          textColor: 'text-white',
          headerBg: 'bg-white/10 backdrop-blur-lg border border-white/20',
          headerHover: 'hover:bg-white/15',
          headerTitle: 'bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent',
          headerSubtitle: 'text-white/80',
          resultsBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          emptyText: 'text-white/70',
          errorText: 'text-red-300',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white',
          downloadButton:
            'bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 disabled:cursor-not-allowed text-white shadow-lg shadow-teal-500/30',
          resultsMetaBorder: 'border-white/20',
          resultsMetaText: 'text-white/80',
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset Number
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/asset/${row.original.assetnumber}`}
          className={`${backgroundStyles.linkColor} transition-colors font-semibold`}
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'assetdescription',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => (
        <div className={`max-w-[300px] truncate text-[12px] ${backgroundStyles.cellText}`}>
          {row.getValue('assetdescription')}
        </div>
      ),
    },
    {
      accessorKey: 'assetcategory',
      header: () => <span className={backgroundStyles.textColor}>Category</span>,
    },
    {
      accessorKey: 'assetsubcategory',
      header: () => <span className={backgroundStyles.textColor}>Subcategory</span>,
    },
    {
      accessorKey: 'assetstatus',
      header: () => <span className={backgroundStyles.textColor}>Status</span>,
    },
    {
      accessorKey: 'acquiredvalue',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('acquiredvalue');
        return typeof value === 'number'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'SAR',
            }).format(value)
          : 'N/A';
      },
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button
          className={`flex items-center gap-1 ${backgroundStyles.textColor} hover:opacity-80 transition-opacity`}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Acquiring Date
          <ArrowUpDown className={`h-4 w-4 ${backgroundStyles.textColor}`} />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: 'qrcode',
      header: () => <span className={backgroundStyles.textColor}>QR Code</span>,
      cell: ({ row }) => <AssetQRCode assetNumber={row.original.assetnumber} assetType="mme" />,
    },
  ];

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const response = await fetch('/api/mme/uncalibrated/export');
      if (!response.ok) {
        throw new Error('Failed to download Excel file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mme_uncalibrated_equipment.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download Excel file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={backgroundStyles.container}>
      {theme === 'glassmorphic' && (
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      )}

      <div
        className={`relative ${theme === 'glassmorphic' ? 'z-20' : 'z-10'} flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen`}
      >
        <div className="mb-8">
          <div
            className={`${backgroundStyles.headerBg} rounded-3xl p-8 ${backgroundStyles.headerHover} transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
          >
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
                MME Un-calibrated
              </h1>
              <p className={`${backgroundStyles.headerSubtitle} text-lg`}>
                Listing all MME (asset numbers starting with 5) without calibration certificates
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={downloading || loading || !!error || data.length === 0}
              className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${backgroundStyles.downloadButton}`}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Preparing Excel...' : 'Download Excel'}
            </button>
          </div>
        </div>

        <div className={`rounded-xl ${backgroundStyles.resultsBg} shadow-xl`}>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}
              />
            </div>
          ) : error ? (
            <div className={`text-center py-8 ${backgroundStyles.errorText}`}>{error}</div>
          ) : data.length === 0 ? (
            <div className={`text-center py-8 ${backgroundStyles.emptyText}`}>
              No un-calibrated MME found with asset numbers starting with 5.
            </div>
          ) : (
            <>
              <div className={`p-4 border-b ${backgroundStyles.resultsMetaBorder}`}>
                <p className={`text-sm ${backgroundStyles.resultsMetaText}`}>
                  Found {data.length} MME equipment item{data.length !== 1 ? 's' : ''} without
                  calibration certificates
                </p>
              </div>
              <div className={theme === 'default' ? 'dark' : undefined}>
                <ResponsiveTanStackTable
                  data={data}
                  columns={columns}
                  sorting={sorting}
                  setSorting={setSorting}
                  columnFilters={columnFilters}
                  setColumnFilters={setColumnFilters}
                  getRowId={(row) => row._id}
                  variant={
                    theme === 'light'
                      ? 'light'
                      : theme === 'glassmorphic'
                        ? 'glassmorphic'
                        : 'default'
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

