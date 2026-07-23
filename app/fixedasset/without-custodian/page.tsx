'use client';
import { useState, useEffect } from 'react';
import { 
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { AssetQRCode } from '@/components/AssetQRCode';
import ResponsiveTanStackTable from '@/components/ui/responsive-tanstack-table';
import ThemedPageShell from '@/app/components/ThemedPageShell';
import { useThemeSurfaces } from '@/lib/themePageStyles';
import { fap } from '@/lib/fixedAssetPageDesign';

interface FixedAsset {
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

export default function FixedAssetWithoutCustodianPage() {
  const s = useThemeSurfaces();
  const [data, setData] = useState<FixedAsset[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Filter states
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1000000);
  const [minDate, setMinDate] = useState<Date | null>(null);
  const [maxDate, setMaxDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/fixedasset/categories');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch categories');
        }
        const data = await response.json();
        console.log('Categories fetched:', data);
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (minValue > 0) params.append('minValue', minValue.toString());
      if (maxValue < 1000000) params.append('maxValue', maxValue.toString());
      if (minDate) params.append('minDate', minDate.toISOString().split('T')[0]);
      if (maxDate) params.append('maxDate', maxDate.toISOString().split('T')[0]);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/fixedasset/without-custodian?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch fixed assets');
      const result = await response.json();
      console.log('API Response:', result);
      // Handle both array and object with data property
      const assetData = Array.isArray(result) ? result : (result.data || []);
      setData(assetData);
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Mouse event handlers for slider dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sliderContainer = document.querySelector('.slider-container-fixedasset') as HTMLElement;
      if (!sliderContainer) return;
      
      const rect = sliderContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newValue = Math.round(percentage * 1000000 / 10000) * 10000;
      
      if (isDragging === 'min' && newValue <= maxValue) {
        setMinValue(newValue);
      } else if (isDragging === 'max' && newValue >= minValue) {
        setMaxValue(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minValue, maxValue]);
  
  const columns: ColumnDef<FixedAsset>[] = [
    {
      accessorKey: 'assetnumber',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Asset Number
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <Link 
          href={`/fixedasset/${row.original.assetnumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className={fap.link}
        >
          {row.original.assetnumber}
        </Link>
      ),
    },
    {
      accessorKey: 'assetdescription',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => <div className="max-w-[300px] truncate text-[12px]">{row.getValue('assetdescription')}</div>,
    },
    {
      accessorKey: 'assetcategory',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
    },
    {
      accessorKey: 'assetsubcategory',
      header: 'Subcategory',
    },
    {
      accessorKey: 'assetstatus',
      header: 'Status',
    },
    {
      accessorKey: 'acquiredvalue',
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
        const value = row.getValue('acquiredvalue');
        return typeof value === 'number' ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'SAR'
        }).format(value) : 'N/A';
      }
    },
    {
      accessorKey: 'acquireddate',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Acquiring Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('acquireddate') as string;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    },
    {
      header: 'QR Code',
      cell: ({ row }) => <AssetQRCode assetNumber={row.original.assetnumber} assetType="fixedasset" />
    }
  ];

  return (
    <ThemedPageShell>
      <div className="flex flex-col gap-6">
        <div className={`${s.card} ${s.cardPadding}`}>
          <h1 className={s.heroTitle}>Fixed Assets Without Custodian</h1>
          <p className={`mt-2 ${s.heroSubtitle}`}>
            Search for fixed assets without custodian information
          </p>
        </div>

        {!hasSearched && (
          <div className={`${s.card} p-4`}>
            <p className={`text-sm ${s.textSecondary}`}>
              Please set your filters (acquisition value range, date range, and category) and click Search to view
              fixed assets without custodian information.
            </p>
          </div>
        )}

        <div className={`${s.card} p-6`}>
          <div className="space-y-4">
            <div>
              <label className={`mb-3 block text-sm font-medium ${s.textPrimary}`}>
                Acquisition Value Range: {minValue.toLocaleString()} - {maxValue.toLocaleString()} SAR
              </label>
              <div className="slider-container-fixedasset relative h-8" style={{ zIndex: 10 }}>
                <div className="pointer-events-none absolute left-0 right-0 top-4 h-2 rounded-lg bg-slate-200 dark:bg-[#2A3B4C]/50" />
                <div
                  className="pointer-events-none absolute top-4 h-2 rounded-lg bg-[#00B4D8]"
                  style={{
                    left: `${(minValue / 1000000) * 100}%`,
                    width: `${((maxValue - minValue) / 1000000) * 100}%`,
                  }}
                />
              
              {/* Track click handler */}
              <div 
                className="absolute top-0 left-0 right-0 h-8 cursor-pointer z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  const newValue = Math.round(percentage * 1000000 / 10000) * 10000;
                  
                  // Determine which thumb to move based on which is closer
                  const minDistance = Math.abs(newValue - minValue);
                  const maxDistance = Math.abs(newValue - maxValue);
                  
                  if (minDistance < maxDistance) {
                    if (newValue <= maxValue) {
                      setMinValue(newValue);
                    }
                  } else {
                    if (newValue >= minValue) {
                      setMaxValue(newValue);
                    }
                  }
                }}
              ></div>
              
              {/* Min value thumb */}
              <div
                className="absolute top-2 z-30 h-4 w-4 cursor-pointer rounded-full border-2 border-white bg-[#00B4D8] shadow-lg transition-colors hover:bg-[#0891B2]"
                style={{ left: `calc(${(minValue / 1000000) * 100}% - 8px)`, pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDragging('min');
                }}
              ></div>
              
              {/* Max value thumb */}
              <div
                className="absolute top-2 z-30 h-4 w-4 cursor-pointer rounded-full border-2 border-white bg-[#00B4D8] shadow-lg transition-colors hover:bg-[#0891B2]"
                style={{ left: `calc(${(maxValue / 1000000) * 100}% - 8px)`, pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDragging('max');
                }}
              ></div>
            </div>
            <div className={`mt-1 flex justify-between text-xs ${s.textMuted}`}>
              <span>0 SAR</span>
              <span>1,000,000 SAR</span>
            </div>
          </div>

          {/* Date Range and Category */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-[200px]">
              <label className={`mb-2 block text-sm font-medium ${s.textPrimary}`}>
                From Date
              </label>
              <div className="relative" style={{ zIndex: 1000 }}>
              <DatePicker
                selected={minDate}
                onChange={(date: Date | null) => setMinDate(date)}
                selectsStart
                startDate={minDate || undefined}
                endDate={maxDate || undefined}
                maxDate={maxDate || undefined}
                  className={s.input}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  placeholderText="Select start date"
                  popperClassName="react-datepicker-popper"
                />
              </div>
            </div>
            <div className="flex-1 max-w-[200px]">
              <label className={`mb-2 block text-sm font-medium ${s.textPrimary}`}>
                To Date
              </label>
              <div className="relative" style={{ zIndex: 1000 }}>
              <DatePicker
                selected={maxDate}
                onChange={(date: Date | null) => setMaxDate(date)}
                selectsEnd
                startDate={minDate || undefined}
                endDate={maxDate || undefined}
                minDate={minDate || undefined}
                  className={s.input}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  placeholderText="Select end date"
                  popperClassName="react-datepicker-popper"
                />
              </div>
            </div>
            <div className="flex-1 max-w-[200px]">
              <label className={`mb-2 block text-sm font-medium ${s.textPrimary}`}>
                Asset Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={s.input}
                disabled={loadingCategories}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 max-w-[150px]">
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`w-full px-6 py-2 ${fap.btnPrimary} disabled:cursor-not-allowed`}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className={s.spinner} />
          </div>
        ) : !hasSearched ? (
          <div className={`py-8 text-center ${s.textMuted}`}>
            No search performed yet. Use the filters above to search for fixed assets.
          </div>
        ) : data.length === 0 ? (
          <div className={`py-8 text-center ${s.textMuted}`}>
            No fixed assets found without custodian information matching the selected filters
          </div>
        ) : (
          <>
            <div className={`border-b p-4 ${s.tableSummaryBorder}`}>
              <p className={`text-sm ${s.textSecondary}`}>
                Found {data.length} fixed asset{data.length !== 1 ? 's' : ''} without custodian information
              </p>
            </div>
            <ResponsiveTanStackTable
              data={data}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              getRowId={(row) => row._id}
              variant="smarttags"
            />
          </>
        )}
      </div>
      </div>
    </ThemedPageShell>
  );
}

