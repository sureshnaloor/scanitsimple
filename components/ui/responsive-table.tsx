'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: any) => void;
  className?: string;
  variant?: 'default' | 'glassmorphic' | 'light';
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  sortField,
  sortOrder,
  onSort,
  className,
  variant = 'default'
}) => {
  const isGlassmorphic = variant === 'glassmorphic';
  const isLight = variant === 'light';
  const toggleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-xs">
            <thead className={cn("[&_tr]:border-b", isGlassmorphic ? "border-white/10" : isLight ? "border-blue-200" : "")}>
              <tr className={cn(
                "border-b transition-colors",
                isGlassmorphic 
                  ? "border-white/10 bg-white/5 backdrop-blur-md"
                  : isLight
                  ? "bg-blue-50/80 border-blue-200"
                  : "bg-slate-50/50 dark:bg-slate-800/50"
              )}>
                {columns.map((column, colIndex) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-xs",
                      isGlassmorphic 
                        ? cn(
                            "h-12 font-semibold text-white/90 uppercase tracking-wider",
                            colIndex % 2 === 0 
                              ? "bg-white/5 backdrop-blur-sm" 
                              : "bg-white/10 backdrop-blur-sm"
                          )
                        : isLight
                        ? cn(
                            "h-10 text-gray-800",
                            colIndex % 2 === 0 
                              ? "bg-blue-100/60" 
                              : "bg-white/80"
                          )
                        : cn(
                            "h-10 text-slate-700 dark:text-slate-300",
                            colIndex % 2 === 0 
                              ? "bg-slate-100/60 dark:bg-slate-700/60" 
                              : "bg-slate-50/80 dark:bg-slate-800/80"
                          ),
                      column.className
                    )}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "flex items-center gap-1 h-auto p-0 font-medium transition-colors text-xs",
                          isGlassmorphic
                            ? "font-semibold text-white/90 hover:text-teal-400 uppercase tracking-wider hover:bg-white/10 rounded-lg px-2 py-1 gap-2"
                            : isLight
                            ? "text-gray-800 hover:text-blue-700"
                            : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {column.label}
                        <ArrowUpDown className={cn(isGlassmorphic ? "h-3.5 w-3.5" : "h-3 w-3")} />
                      </Button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b transition-all duration-200 data-[state=selected]:bg-muted",
                    isGlassmorphic
                      ? cn(
                          "border-white/5 hover:bg-white/10 hover:backdrop-blur-sm",
                          index % 2 === 0 
                            ? "bg-white/5 backdrop-blur-sm" 
                            : "bg-white/10 backdrop-blur-sm"
                        )
                      : isLight
                      ? cn(
                          "hover:bg-blue-50/80 border-blue-100",
                          index % 2 === 0 
                            ? "bg-white" 
                            : "bg-blue-50/30"
                        )
                      : cn(
                          "hover:bg-slate-100/80 dark:hover:bg-slate-700/50",
                          index % 2 === 0 
                            ? "bg-white dark:bg-slate-900" 
                            : "bg-slate-50/30 dark:bg-slate-800/30"
                        )
                  )}
                >
                  {columns.map((column, colIndex) => {
                    const columnId = column.key;
                    const cellValue = item[column.key];
                    
                    // Determine cell styling based on column type and content
                    const getCellStyling = () => {
                      // Asset Number - Bold, monospace font
                      if (columnId.includes('assetnumber') || columnId.includes('number')) {
                        return isGlassmorphic 
                          ? "font-mono font-bold text-white text-xs"
                          : isLight
                          ? "font-mono font-bold text-gray-900 text-xs"
                          : "font-mono font-bold text-slate-900 dark:text-slate-100 text-xs";
                      }
                      // Description - Italic, slightly larger
                      if (columnId.includes('description') || columnId.includes('name')) {
                        return isGlassmorphic
                          ? "font-medium italic text-white text-xs"
                          : isLight
                          ? "font-medium italic text-gray-700 text-xs"
                          : "font-medium italic text-slate-700 dark:text-slate-300 text-xs";
                      }
                      // Status - Colored badge style
                      if (columnId.includes('status') || columnId.includes('condition')) {
                        return "font-semibold text-xs uppercase tracking-wide";
                      }
                      // Category/Subcategory - Light weight, smaller
                      if (columnId.includes('category') || columnId.includes('subcategory')) {
                        return isGlassmorphic
                          ? "font-light text-white/90 text-xs"
                          : isLight
                          ? "font-light text-gray-600 text-xs"
                          : "font-light text-slate-600 dark:text-slate-400 text-xs";
                      }
                      // Value/Price - Bold, monospace, colored
                      if (columnId.includes('value') || columnId.includes('price') || columnId.includes('cost')) {
                        return isGlassmorphic
                          ? "font-mono font-bold text-teal-400 text-xs"
                          : isLight
                          ? "font-mono font-bold text-green-700 text-xs"
                          : "font-mono font-bold text-green-700 dark:text-green-400 text-xs";
                      }
                      // Date - Light weight, smaller
                      if (columnId.includes('date') || columnId.includes('time')) {
                        return isGlassmorphic
                          ? "font-light text-white/80 text-xs"
                          : isLight
                          ? "font-light text-gray-600 text-xs"
                          : "font-light text-slate-500 dark:text-slate-500 text-xs";
                      }
                      // Manufacturer/Model - Medium weight
                      if (columnId.includes('manufacturer') || columnId.includes('model') || columnId.includes('brand')) {
                        return isGlassmorphic
                          ? "font-medium text-white text-xs"
                          : isLight
                          ? "font-medium text-gray-700 text-xs"
                          : "font-medium text-slate-700 dark:text-slate-300 text-xs";
                      }
                      // Serial Number - Monospace, smaller
                      if (columnId.includes('serial') || columnId.includes('id')) {
                        return isGlassmorphic
                          ? "font-mono font-medium text-white/90 text-xs"
                          : isLight
                          ? "font-mono font-medium text-gray-600 text-xs"
                          : "font-mono font-medium text-slate-600 dark:text-slate-400 text-xs";
                      }
                      // Location - Italic, smaller
                      if (columnId.includes('location') || columnId.includes('place')) {
                        return isGlassmorphic
                          ? "font-light italic text-white/80 text-xs"
                          : isLight
                          ? "font-light italic text-gray-600 text-xs"
                          : "font-light italic text-slate-500 dark:text-slate-500 text-xs";
                      }
                      // Default styling
                      return isGlassmorphic
                        ? "font-normal text-white text-xs"
                        : isLight
                        ? "font-normal text-gray-700 text-xs"
                        : "font-normal text-slate-700 dark:text-slate-300 text-xs";
                    };

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "px-3 py-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                          isGlassmorphic
                            ? cn(
                                "px-4 py-3",
                                colIndex % 2 === 0 
                                  ? "bg-white/5 backdrop-blur-sm" 
                                  : "bg-white/10 backdrop-blur-sm"
                              )
                            : isLight
                            ? cn(
                                colIndex % 2 === 0 
                                  ? "bg-blue-50/40" 
                                  : "bg-white/60"
                              )
                            : cn(
                                colIndex % 2 === 0 
                                  ? "bg-slate-50/40 dark:bg-slate-800/40" 
                                  : "bg-white/60 dark:bg-slate-900/60"
                              )
                        )}
                      >
                        <div className={getCellStyling()}>
                          {cellValue}
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
      <div className={cn("lg:hidden", isGlassmorphic ? "space-y-4" : "space-y-3")}>
        {data.map((item, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-4 shadow-sm transition-all duration-200",
              isGlassmorphic
                ? cn(
                    "border-white/20 rounded-2xl p-5 backdrop-blur-lg shadow-xl hover:bg-white/15 hover:shadow-2xl",
                    index % 2 === 0 
                      ? "bg-white/10 backdrop-blur-lg" 
                      : "bg-white/15 backdrop-blur-lg"
                  )
                : isLight
                ? cn(
                    "hover:shadow-md",
                    index % 2 === 0 
                      ? "bg-white border-blue-200" 
                      : "bg-blue-50/50 border-blue-200/50"
                  )
                : cn(
                    "hover:shadow-md",
                    index % 2 === 0 
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" 
                      : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
                  )
            )}
          >
            <div className="space-y-3">
              {columns.map((column, colIndex) => (
                <div
                  key={column.key}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center",
                    colIndex === 0 && (isGlassmorphic ? "border-b border-white/10 pb-3 mb-3" : "border-b pb-2 mb-2")
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium sm:w-1/3 sm:pr-4",
                    isGlassmorphic
                      ? "font-semibold text-white/70 uppercase tracking-wider"
                      : isLight
                      ? "font-semibold text-gray-700"
                      : "text-muted-foreground"
                  )}>
                    {column.label}:
                  </div>
                  <div className={cn(
                    "text-xs sm:w-2/3 sm:pl-4",
                    // Apply similar styling logic for mobile cards
                    column.key.includes('assetnumber') || column.key.includes('number') 
                      ? isGlassmorphic
                        ? "font-mono font-bold text-white"
                        : isLight
                        ? "font-mono font-bold text-gray-900"
                        : "font-mono font-bold text-slate-900 dark:text-slate-100"
                      : column.key.includes('description') || column.key.includes('name')
                      ? isGlassmorphic
                        ? "font-medium italic text-white"
                        : isLight
                        ? "font-medium italic text-gray-700"
                        : "font-medium italic text-slate-700 dark:text-slate-300"
                      : column.key.includes('status') || column.key.includes('condition')
                      ? "font-semibold text-xs uppercase tracking-wide"
                      : column.key.includes('category') || column.key.includes('subcategory')
                      ? isGlassmorphic
                        ? "font-light text-white/90 text-xs"
                        : isLight
                        ? "font-light text-gray-600 text-xs"
                        : "font-light text-slate-600 dark:text-slate-400 text-xs"
                      : column.key.includes('value') || column.key.includes('price') || column.key.includes('cost')
                      ? isGlassmorphic
                        ? "font-mono font-bold text-teal-400"
                        : isLight
                        ? "font-mono font-bold text-green-700"
                        : "font-mono font-bold text-green-700 dark:text-green-400"
                      : column.key.includes('date') || column.key.includes('time')
                      ? isGlassmorphic
                        ? "font-light text-white/80 text-xs"
                        : isLight
                        ? "font-light text-gray-600 text-xs"
                        : "font-light text-slate-500 dark:text-slate-500 text-xs"
                      : column.key.includes('manufacturer') || column.key.includes('model') || column.key.includes('brand')
                      ? isGlassmorphic
                        ? "font-medium text-white"
                        : isLight
                        ? "font-medium text-gray-700"
                        : "font-medium text-slate-700 dark:text-slate-300"
                      : column.key.includes('serial') || column.key.includes('id')
                      ? isGlassmorphic
                        ? "font-mono font-medium text-white/90 text-xs"
                        : isLight
                        ? "font-mono font-medium text-gray-600 text-xs"
                        : "font-mono font-medium text-slate-600 dark:text-slate-400 text-xs"
                      : column.key.includes('location') || column.key.includes('place')
                      ? isGlassmorphic
                        ? "font-light italic text-white/80 text-xs"
                        : isLight
                        ? "font-light italic text-gray-600 text-xs"
                        : "font-light italic text-slate-500 dark:text-slate-500 text-xs"
                      : isGlassmorphic
                        ? "font-normal text-white"
                        : isLight
                        ? "font-normal text-gray-700"
                        : "font-normal text-slate-700 dark:text-slate-300"
                  )}>
                    {item[column.key]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
