'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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
  acquireddate: Date;
  assetmanufacturer: string;
  assetmodel: string;
  assetserialnumber: string;
}

interface BulkAssetRow {
  assetnumber: string;
  assetdescription: string;
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
  acquiredvalue?: number;
  acquireddate?: string;
  assetmanufacturer?: string;
  assetmodel?: string;
  assetserialnumber?: string;
  sourceRow?: number;
}

export default function MMEPage() {
  const [data, setData] = useState<Equipment[]>([]);
  const [recentAcquisitions, setRecentAcquisitions] = useState<Equipment[]>([]);
  const [assetNumberSearch, setAssetNumberSearch] = useState('');
  const [assetNameSearch, setAssetNameSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [landingSorting, setLandingSorting] = useState<SortingState>([{ id: 'acquiredvalue', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [landingColumnFilters, setLandingColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [landingLoading, setLandingLoading] = useState(true);
  const [excludeCustody, setExcludeCustody] = useState(false);
  const [showBulkInsertModal, setShowBulkInsertModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkAssetRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkAssetRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ assetnumber: string; sourceRow?: number }>;
  } | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Bulk Insert Error');
  const [errorModalContent, setErrorModalContent] = useState('');
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

  const isSearchActive =
    (assetNumberSearch?.trim().length ?? 0) >= 2 ||
    (assetNameSearch?.trim().length ?? 0) >= 2;

  const searchEquipment = async (assetNumber: string, assetName: string) => {
    // Only search if input is at least 2 characters
    if ((!assetNumber?.trim() || assetNumber.trim().length < 2) && 
        (!assetName?.trim() || assetName.trim().length < 2)) {
      setData([]);
      return;
    }
    // Only proceed if at least one search parameter is filled
    if (!assetNumber?.trim() && !assetName?.trim()) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (assetNumber?.trim()) params.append('assetNumber', assetNumber);
      if (assetName?.trim()) params.append('assetName', assetName);

      const response = await fetch(`/api/assets?${params.toString()}`); // Changed from fixedassets to assets
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBulkErrorModal = (title: string, content: string) => {
    setErrorModalTitle(title);
    setErrorModalContent(content);
    setErrorModalOpen(true);
  };

  const resetBulkState = () => {
    setBulkFileName('');
    setBulkRows([]);
    setValidatedRows([]);
    setValidationMessage('');
    setValidationSummary(null);
  };

  const normalizeHeader = (header: unknown) => String(header ?? '').trim().toLowerCase();

  const parseBulkFile = async (file: File): Promise<BulkAssetRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false
    });

    if (!rows || rows.length < 2) {
      throw new Error('File must include a header row and at least one data row.');
    }

    const headers = rows[0].map(normalizeHeader);
    const requiredHeaders = ['asset number', 'asset description'];
    const missing = requiredHeaders.filter((header) => !headers.includes(header));
    if (missing.length > 0) {
      throw new Error(`Missing required header(s): ${missing.join(', ')}.`);
    }

    const getCell = (row: (string | number | null)[], names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      if (idx === -1) {
        return '';
      }
      return String(row[idx] ?? '').trim();
    };

    const parsed: BulkAssetRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const assetnumber = getCell(row, ['asset number', 'assetnumber']);
      const assetdescription = getCell(row, ['asset description', 'assetdescription']);
      const assetcategory = getCell(row, ['asset category', 'assetcategory']);
      const assetsubcategory = getCell(row, ['asset subcategory', 'assetsubcategory']);
      const assetstatus = getCell(row, ['asset status', 'assetstatus']);
      const acquiredValueText = getCell(row, ['acquired value', 'acquiredvalue']);
      const acquireddate = getCell(row, ['acquired date', 'acquireddate']);
      const assetmanufacturer = getCell(row, ['asset manufacturer', 'assetmanufacturer']);
      const assetmodel = getCell(row, ['asset model', 'assetmodel']);
      const assetserialnumber = getCell(row, ['asset serial number', 'assetserialnumber']);

      const hasAnyData = [
        assetnumber,
        assetdescription,
        assetcategory,
        assetsubcategory,
        assetstatus,
        acquiredValueText,
        acquireddate,
        assetmanufacturer,
        assetmodel,
        assetserialnumber
      ].some((value) => value !== '');
      if (!hasAnyData) {
        continue;
      }

      const acquiredvalue = acquiredValueText ? Number(acquiredValueText) : undefined;
      parsed.push({
        assetnumber,
        assetdescription,
        assetcategory,
        assetsubcategory,
        assetstatus,
        acquiredvalue: Number.isNaN(acquiredvalue) ? undefined : acquiredvalue,
        acquireddate,
        assetmanufacturer,
        assetmodel,
        assetserialnumber,
        sourceRow: i + 1
      });
    }

    if (parsed.length === 0) {
      throw new Error('No data rows found in uploaded file.');
    }

    return parsed;
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/assets/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mme_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      openBulkErrorModal('Template Download Error', error.message || 'Failed to download template.');
    }
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseBulkFile(file);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
    } catch (error: any) {
      resetBulkState();
      openBulkErrorModal('File Parsing Error', error.message || 'Failed to parse uploaded file.');
    }
  };

  const handleValidateBulk = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation Error', 'Please upload file first.');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', rows: bulkRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Validation failed.');
      }

      const data = result.data;
      setValidatedRows(data.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: data.totalUploaded || 0,
        validForInsert: data.validForInsert || 0,
        skippedExisting: data.skippedExisting || []
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (error: any) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      openBulkErrorModal('Validation Error', error.message || 'Validation failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInsertBulk = async () => {
    if (!validatedRows.length) {
      openBulkErrorModal('Insert Error', 'No validated rows ready for insert.');
      return;
    }

    try {
      setBulkLoading(true);
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }

      alert(result.message || 'MME assets inserted successfully.');
      setShowBulkInsertModal(false);
      resetBulkState();
      searchEquipment(assetNumberSearch, assetNameSearch);
    } catch (error: any) {
      openBulkErrorModal('Insert Error', error.message || 'Insert failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecentAcquisitions = async () => {
      setLandingLoading(true);
      try {
        const params = new URLSearchParams();
        if (excludeCustody) params.append('excludeCustody', 'true');
        const query = params.toString();
        const response = await fetch(`/api/mme/recent-acquisitions${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch recent acquisitions');
        const result = await response.json();
        setRecentAcquisitions(result.data || []);
      } catch (error) {
        console.error('Error fetching recent acquisitions:', error);
        setRecentAcquisitions([]);
      } finally {
        setLandingLoading(false);
      }
    };

    fetchRecentAcquisitions();
  }, [excludeCustody]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchEquipment(assetNumberSearch, assetNameSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [assetNumberSearch, assetNameSearch]);

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

  // Theme-based styling functions
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
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          resultsBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          emptyText: 'text-white/70',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white'
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
          inputBg: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
          resultsBg: 'border-2 border-blue-200 bg-white shadow-md',
          emptyText: 'text-gray-600',
          spinnerColor: 'border-blue-500',
          linkColor: 'text-blue-600 hover:text-blue-700',
          cellText: 'text-gray-900'
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
          inputBg: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-teal-400',
          resultsBg: 'border border-white/20 bg-white/10 backdrop-blur-lg',
          emptyText: 'text-white/70',
          spinnerColor: 'border-teal-400',
          linkColor: 'text-teal-400 hover:text-teal-300',
          cellText: 'text-white'
        };
    }
  };

  const backgroundStyles = getBackgroundStyles();

  const formatCurrency = (value: unknown) =>
    typeof value === 'number'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value)
      : 'N/A';

  const buildAssetColumns = (options?: { includeActions?: boolean }): ColumnDef<Equipment>[] => [
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
          target="_blank"
          rel="noopener noreferrer"
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
      cell: ({ row }) => <div className={`max-w-[300px] truncate text-[12px] ${backgroundStyles.cellText}`}>{row.getValue('assetdescription')}</div>,
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
        return formatCurrency(value);
      }
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
      }
    },
    ...(options?.includeActions
      ? [
          {
            id: 'actions',
            header: () => <span className={backgroundStyles.textColor}>Actions</span>,
            cell: ({ row }: { row: { original: Equipment } }) => (
              <div className="flex flex-wrap gap-2 text-[12px]">
                <Link
                  href={`/asset/${row.original.assetnumber}#custody`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${backgroundStyles.linkColor} font-medium transition-colors`}
                >
                  Custody
                </Link>
                <Link
                  href={`/asset/${row.original.assetnumber}#calibration`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${backgroundStyles.linkColor} font-medium transition-colors`}
                >
                  Calibration
                </Link>
              </div>
            ),
          } as ColumnDef<Equipment>,
        ]
      : [
          {
            id: 'qrcode',
            header: () => <span className={backgroundStyles.textColor}>QR Code</span>,
            cell: ({ row }: { row: { original: Equipment } }) => (
              <AssetQRCode assetNumber={row.original.assetnumber} assetType="mme" />
            ),
          } as ColumnDef<Equipment>,
        ]),
  ];

  const columns = buildAssetColumns();
  const landingColumns = buildAssetColumns({ includeActions: true });

  return (
    <div className={backgroundStyles.container}>
      {/* Animated background canvas for glassmorphic theme only */}
      {theme === 'glassmorphic' && (
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      )}
      
      {/* Main content */}
      <div className={`relative ${theme === 'glassmorphic' ? 'z-20' : 'z-10'} flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 min-h-screen`}>
        {/* Header Section */}
        <div className="mb-8">
          <div className={`${backgroundStyles.headerBg} rounded-3xl p-8 ${backgroundStyles.headerHover} transition-all duration-300`}>
            <h1 className={`text-2xl md:text-3xl font-bold mb-4 ${backgroundStyles.headerTitle}`}>
              MME Equipment
            </h1>
            <p className={`${backgroundStyles.headerSubtitle} text-lg`}>Search and manage MME equipment</p>
          </div>
        </div>
        
        {/* Search Section */}
        <div className={`mb-6 p-6 ${backgroundStyles.searchBg} rounded-xl shadow-lg`}>
          <div className="flex flex-wrap gap-4">
            <div className={`flex w-full max-w-sm items-center gap-3 rounded-xl px-3 py-2.5 ${backgroundStyles.inputBg} focus-within:ring-2 focus-within:ring-teal-400/50`}>
              <Search
                className={`h-4 w-4 shrink-0 ${theme === 'light' ? 'text-gray-400' : 'text-white/60'}`}
                aria-hidden
              />
              <input
                type="text"
                value={assetNumberSearch}
                onChange={(e) => setAssetNumberSearch(e.target.value)}
                placeholder="Search by asset number..."
                className={`min-w-0 flex-1 border-0 bg-transparent outline-none ${theme === 'light' ? 'text-gray-900 placeholder:text-gray-500' : 'text-white placeholder:text-white/60'}`}
              />
            </div>
            <div className={`flex w-full max-w-sm items-center gap-3 rounded-xl px-3 py-2.5 ${backgroundStyles.inputBg} focus-within:ring-2 focus-within:ring-teal-400/50`}>
              <Search
                className={`h-4 w-4 shrink-0 ${theme === 'light' ? 'text-gray-400' : 'text-white/60'}`}
                aria-hidden
              />
              <input
                type="text"
                value={assetNameSearch}
                onChange={(e) => setAssetNameSearch(e.target.value)}
                placeholder="Search by asset description..."
                className={`min-w-0 flex-1 border-0 bg-transparent outline-none ${theme === 'light' ? 'text-gray-900 placeholder:text-gray-500' : 'text-white placeholder:text-white/60'}`}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                resetBulkState();
                setShowBulkInsertModal(true);
              }}
              className={`px-4 py-3 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
            >
              Bulk Insert
            </button>
          </div>
        </div>

        {/* Search Results Section */}
        {isSearchActive && (
          <div className={`mb-6 rounded-xl ${backgroundStyles.resultsBg} shadow-xl`}>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
              </div>
            ) : data.length === 0 ? (
              <div className={`text-center py-8 ${backgroundStyles.emptyText}`}>
                No assets match your search criteria
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* Landing: recently acquired top assets */}
        <div className={`rounded-xl ${backgroundStyles.resultsBg} shadow-xl`}>
          <div className={`border-b px-6 py-4 flex flex-wrap items-start justify-between gap-4 ${theme === 'light' ? 'border-blue-200' : 'border-white/20'}`}>
            <div>
              <h2 className={`text-lg font-semibold ${backgroundStyles.textColor}`}>
                Latest Acquired Assets
              </h2>
              <p className={`mt-1 text-sm ${backgroundStyles.headerSubtitle}`}>
                {excludeCustody
                  ? 'Top 100 most recently acquired MME assets without custody, ranked by value'
                  : 'Top 100 most recently acquired MME assets, ranked by value'}
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className={`text-sm ${backgroundStyles.headerSubtitle}`}>Only without custody</span>
              <button
                type="button"
                role="switch"
                aria-checked={excludeCustody}
                onClick={() => setExcludeCustody((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  excludeCustody
                    ? 'bg-teal-500'
                    : theme === 'light'
                      ? 'bg-gray-300'
                      : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    excludeCustody ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
          {landingLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${backgroundStyles.spinnerColor}`}></div>
            </div>
          ) : recentAcquisitions.length === 0 ? (
            <div className={`text-center py-8 ${backgroundStyles.emptyText}`}>
              {excludeCustody
                ? 'All recent assets have custody records'
                : 'No recent acquisitions found'}
            </div>
          ) : (
            <div className={theme === 'default' ? 'dark' : undefined}>
              <ResponsiveTanStackTable
                data={recentAcquisitions}
                columns={landingColumns}
                sorting={landingSorting}
                setSorting={setLandingSorting}
                columnFilters={landingColumnFilters}
                setColumnFilters={setLandingColumnFilters}
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
          )}
        </div>

        {showBulkInsertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${backgroundStyles.searchBg} w-full max-w-4xl rounded-2xl p-6 shadow-xl`}>
              <h3 className={`mb-4 text-2xl font-semibold ${backgroundStyles.textColor}`}>Bulk Insert MME Assets</h3>
              <p className={`mb-4 text-sm ${backgroundStyles.headerSubtitle}`}>
                Download template, fill rows, validate to skip existing asset numbers, then insert only new rows.
              </p>

              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Download Template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileSelect}
                  className={`text-sm ${backgroundStyles.textColor}`}
                />
              </div>

              {bulkFileName && (
                <p className={`mb-3 text-sm ${backgroundStyles.headerSubtitle}`}>
                  Selected file: {bulkFileName} ({bulkRows.length} rows detected)
                </p>
              )}

              {validationSummary && (
                <div className={`mb-4 rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={backgroundStyles.textColor}>{validationMessage}</p>
                  <p className={`mt-2 text-sm ${backgroundStyles.headerSubtitle}`}>
                    Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert} |
                    Existing skipped: {validationSummary.skippedExisting.length}
                  </p>
                  {validationSummary.skippedExisting.length > 0 && (
                    <div className={`mt-2 max-h-24 overflow-auto text-xs ${backgroundStyles.headerSubtitle}`}>
                      {validationSummary.skippedExisting.map((item, idx) => (
                        <div key={`${item.assetnumber}-${idx}`}>
                          Existing assetnumber skipped: {item.assetnumber}
                          {item.sourceRow ? ` (row ${item.sourceRow})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {validatedRows.length > 0 && (
                <div className={`mb-4 rounded-xl border p-4 ${backgroundStyles.inputBg}`}>
                  <p className={`mb-3 text-sm font-medium ${backgroundStyles.textColor}`}>
                    Preview of rows ready to insert ({validatedRows.length})
                  </p>
                  <div className="max-h-64 overflow-auto rounded-lg border border-white/20">
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-black/20">
                        <tr>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Asset No</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Description</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Category</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Status</th>
                          <th className={`px-3 py-2 ${backgroundStyles.textColor}`}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedRows.map((row, idx) => (
                          <tr key={`${row.assetnumber}-${idx}`} className="border-t border-white/10">
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetnumber}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetdescription}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetcategory || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>{row.assetstatus || '-'}</td>
                            <td className={`px-3 py-2 ${backgroundStyles.headerSubtitle}`}>
                              {row.acquiredvalue !== undefined ? row.acquiredvalue : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkInsertModal(false);
                    resetBulkState();
                  }}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidateBulk}
                  disabled={bulkLoading || bulkRows.length === 0}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg} disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing...' : 'Validate'}
                </button>
                <button
                  type="button"
                  onClick={handleInsertBulk}
                  disabled={bulkLoading || validatedRows.length === 0}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg} disabled:opacity-50`}
                >
                  {bulkLoading ? 'Processing...' : 'Insert'}
                </button>
              </div>
            </div>
          </div>
        )}

        {errorModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`${backgroundStyles.searchBg} w-full max-w-2xl rounded-2xl p-6 shadow-xl`}>
              <h3 className={`mb-3 text-xl font-semibold ${backgroundStyles.textColor}`}>{errorModalTitle}</h3>
              <div className={`max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border p-4 text-sm ${backgroundStyles.inputBg}`}>
                {errorModalContent}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setErrorModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-all ${backgroundStyles.inputBg}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
