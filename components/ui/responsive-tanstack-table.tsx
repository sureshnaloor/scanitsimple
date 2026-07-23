'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  OnChangeFn
} from '@tanstack/react-table';

interface ResponsiveTanStackTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  globalFilter?: string;
  setGlobalFilter?: OnChangeFn<string>;
  className?: string;
  getRowId?: (row: TData) => string;
  variant?: 'default' | 'glassmorphic' | 'light' | 'smarttags';
}

function ResponsiveTanStackTable<TData>({
  data,
  columns,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
  globalFilter,
  setGlobalFilter,
  className,
  getRowId,
  variant = 'default'
}: ResponsiveTanStackTableProps<TData>) {
  const isGlassmorphic = variant === 'glassmorphic';
  const isLight = variant === 'light';
  const isSmartTags = variant === 'smarttags';
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    getRowId,
  });

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className={cn("[&_tr]:border-b", isGlassmorphic ? "border-white/10" : isLight ? "border-blue-200" : isSmartTags ? "border-slate-200 dark:border-[#2A3B4C]/50" : "")}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={cn(
                  "border-b transition-colors",
                  isGlassmorphic 
                    ? "border-white/10 bg-white/5 backdrop-blur-md"
                    : isLight
                    ? "bg-blue-50/80 border-blue-200"
                    : isSmartTags
                    ? "border-slate-200 bg-slate-100 dark:border-[#2A3B4C]/50 dark:bg-[#2A3B4C]"
                    : "bg-slate-50/50 dark:bg-slate-800/50"
                )}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "h-12 px-4 text-left align-middle font-medium uppercase tracking-wider [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                        isGlassmorphic 
                          ? "text-white/90"
                          : isLight
                          ? "text-gray-800"
                          : isSmartTags
                          ? "text-xs font-semibold text-[#475569] dark:text-[#94A3B8]"
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b transition-all duration-200 data-[state=selected]:bg-muted",
                    isGlassmorphic
                      ? cn(
                          "border-white/10",
                          index % 2 === 0 
                            ? "bg-white/5 backdrop-blur-sm hover:bg-white/10" 
                            : "bg-white/10 backdrop-blur-sm hover:bg-white/15"
                        )
                      : isLight
                      ? cn(
                          "border-blue-200",
                          index % 2 === 0 
                            ? "bg-white hover:bg-blue-50/50" 
                            : "bg-blue-50/30 hover:bg-blue-100/50"
                        )
                      : isSmartTags
                      ? cn(
                          "border-slate-200/70 dark:border-[#2A3B4C]/30",
                          index % 2 === 0
                            ? "bg-white hover:bg-cyan-50/60 dark:bg-[#111827] dark:hover:bg-[rgba(0,180,216,0.05)]"
                            : "bg-slate-50 hover:bg-cyan-50/60 dark:bg-[#1E293B] dark:hover:bg-[rgba(0,180,216,0.05)]"
                        )
                      : cn(
                          "hover:bg-slate-100/80 dark:hover:bg-slate-700/50",
                          index % 2 === 0 
                            ? "bg-white dark:bg-slate-900" 
                            : "bg-slate-50/30 dark:bg-slate-800/30"
                        )
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const columnId = cell.column.id;
                    const cellValue = cell.getValue();
                    
                    // Determine cell styling based on column type and content
                    const getCellStyling = () => {
                      // Asset Number - Bold, monospace font
                      if (columnId.includes('assetnumber') || columnId.includes('number')) {
                        return isGlassmorphic 
                          ? "font-mono font-bold text-white text-sm"
                          : isLight
                          ? "font-mono font-bold text-gray-900 text-sm"
                          : "font-mono font-bold text-slate-900 dark:text-slate-100 text-sm";
                      }
                      // Description - Italic, slightly larger
                      if (columnId.includes('description') || columnId.includes('name')) {
                        return isGlassmorphic 
                          ? "font-medium italic text-white/90 text-sm"
                          : isLight
                          ? "font-medium italic text-gray-700 text-sm"
                          : "font-medium italic text-slate-700 dark:text-slate-300 text-sm";
                      }
                      // Status - Colored badge style
                      if (columnId.includes('status') || columnId.includes('condition')) {
                        return "font-semibold text-xs uppercase tracking-wide";
                      }
                      // Category/Subcategory - Light weight, smaller
                      if (columnId.includes('category') || columnId.includes('subcategory')) {
                        return isGlassmorphic 
                          ? "font-light text-white/80 text-xs"
                          : isLight
                          ? "font-light text-gray-600 text-xs"
                          : "font-light text-slate-600 dark:text-slate-400 text-xs";
                      }
                      // Value/Price - Bold, monospace, colored
                      if (columnId.includes('value') || columnId.includes('price') || columnId.includes('cost')) {
                        return isGlassmorphic 
                          ? "font-mono font-bold text-teal-400 text-sm"
                          : isLight
                          ? "font-mono font-bold text-green-700 text-sm"
                          : "font-mono font-bold text-green-700 dark:text-green-400 text-sm";
                      }
                      // Date - Light weight, smaller
                      if (columnId.includes('date') || columnId.includes('time')) {
                        return isGlassmorphic 
                          ? "font-light text-white/70 text-xs"
                          : isLight
                          ? "font-light text-gray-500 text-xs"
                          : "font-light text-slate-500 dark:text-slate-500 text-xs";
                      }
                      // Manufacturer/Model - Medium weight
                      if (columnId.includes('manufacturer') || columnId.includes('model') || columnId.includes('brand')) {
                        return isGlassmorphic 
                          ? "font-medium text-white/90 text-sm"
                          : isLight
                          ? "font-medium text-gray-700 text-sm"
                          : "font-medium text-slate-700 dark:text-slate-300 text-sm";
                      }
                      // Serial Number - Monospace, smaller
                      if (columnId.includes('serial') || columnId.includes('id')) {
                        return isGlassmorphic 
                          ? "font-mono font-medium text-white/80 text-xs"
                          : isLight
                          ? "font-mono font-medium text-gray-600 text-xs"
                          : "font-mono font-medium text-slate-600 dark:text-slate-400 text-xs";
                      }
                      // Location - Italic, smaller
                      if (columnId.includes('location') || columnId.includes('place')) {
                        return isGlassmorphic 
                          ? "font-light italic text-white/70 text-xs"
                          : isLight
                          ? "font-light italic text-gray-500 text-xs"
                          : "font-light italic text-slate-500 dark:text-slate-500 text-xs";
                      }
                      // Default styling
                      return isGlassmorphic 
                        ? "font-normal text-white/90 text-sm"
                        : isLight
                        ? "font-normal text-gray-700 text-sm"
                        : "font-normal text-slate-700 dark:text-slate-300 text-sm";
                    };

                    return (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                      >
                        <div className={getCellStyling()}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {table.getRowModel().rows.map((row, index) => (
          <div
            key={row.id}
            className={cn(
              "border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md",
              isGlassmorphic
                ? cn(
                    "border-white/10",
                    index % 2 === 0 
                      ? "bg-white/5 backdrop-blur-sm border-white/10" 
                      : "bg-white/10 backdrop-blur-sm border-white/20"
                  )
                : isLight
                ? cn(
                    "border-blue-200",
                    index % 2 === 0 
                      ? "bg-white border-blue-200" 
                      : "bg-blue-50/50 border-blue-200"
                  )
                : cn(
                    index % 2 === 0 
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
                      : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
                  )
            )}
          >
            <div className="space-y-3">
              {row.getVisibleCells().map((cell, index) => {
                const column = cell.column;
                const columnDef = column.columnDef;
                const columnId = column.id;
                
                // Get the header from the table's header groups
                const headerGroup = table.getHeaderGroups()[0];
                const header = headerGroup?.headers.find(h => h.column.id === column.id);
                const headerContent = header ? flexRender(header.column.columnDef.header, header.getContext()) : (typeof columnDef.header === 'string' ? columnDef.header : '');
                
                return (
                  <div
                    key={cell.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center",
                      index === 0 && "border-b pb-2 mb-2"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium sm:w-1/3 sm:pr-4",
                      isGlassmorphic 
                        ? "text-white/80"
                        : isLight
                        ? "text-gray-600"
                        : "text-muted-foreground"
                    )}>
                      {headerContent}:
                    </div>
                    <div className={cn(
                      "text-sm sm:w-2/3 sm:pl-4",
                      // Apply similar styling logic for mobile cards
                      columnId.includes('assetnumber') || columnId.includes('number') 
                        ? isGlassmorphic 
                          ? "font-mono font-bold text-white" 
                          : isLight
                          ? "font-mono font-bold text-gray-900"
                          : "font-mono font-bold text-slate-900 dark:text-slate-100"
                        : columnId.includes('description') || columnId.includes('name')
                        ? isGlassmorphic 
                          ? "font-medium italic text-white/90"
                          : isLight
                          ? "font-medium italic text-gray-700"
                          : "font-medium italic text-slate-700 dark:text-slate-300"
                        : columnId.includes('status') || columnId.includes('condition')
                        ? "font-semibold text-xs uppercase tracking-wide"
                        : columnId.includes('category') || columnId.includes('subcategory')
                        ? isGlassmorphic 
                          ? "font-light text-white/80 text-xs"
                          : isLight
                          ? "font-light text-gray-600 text-xs"
                          : "font-light text-slate-600 dark:text-slate-400 text-xs"
                        : columnId.includes('value') || columnId.includes('price') || columnId.includes('cost')
                        ? isGlassmorphic 
                          ? "font-mono font-bold text-teal-400"
                          : isLight
                          ? "font-mono font-bold text-green-700"
                          : "font-mono font-bold text-green-700 dark:text-green-400"
                        : columnId.includes('date') || columnId.includes('time')
                        ? isGlassmorphic 
                          ? "font-light text-white/70 text-xs"
                          : isLight
                          ? "font-light text-gray-500 text-xs"
                          : "font-light text-slate-500 dark:text-slate-500 text-xs"
                        : columnId.includes('manufacturer') || columnId.includes('model') || columnId.includes('brand')
                        ? isGlassmorphic 
                          ? "font-medium text-white/90"
                          : isLight
                          ? "font-medium text-gray-700"
                          : "font-medium text-slate-700 dark:text-slate-300"
                        : columnId.includes('serial') || columnId.includes('id')
                        ? isGlassmorphic 
                          ? "font-mono font-medium text-white/80 text-xs"
                          : isLight
                          ? "font-mono font-medium text-gray-600 text-xs"
                          : "font-mono font-medium text-slate-600 dark:text-slate-400 text-xs"
                        : columnId.includes('location') || columnId.includes('place')
                        ? isGlassmorphic 
                          ? "font-light italic text-white/70 text-xs"
                          : isLight
                          ? "font-light italic text-gray-500 text-xs"
                          : "font-light italic text-slate-500 dark:text-slate-500 text-xs"
                        : isGlassmorphic 
                          ? "font-normal text-white/90"
                          : isLight
                          ? "font-normal text-gray-700"
                          : "font-normal text-slate-700 dark:text-slate-300"
                    )}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTanStackTable;
