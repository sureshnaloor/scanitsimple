'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fap } from '@/lib/fixedAssetPageDesign';

export type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
};

/**
 * Search input with icon inside the field — flex layout prevents text/icon overlap.
 */
export function SearchField({
  containerClassName,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn(fap.searchField, containerClassName)}>
      <Search
        className="h-4 w-4 shrink-0 text-[#64748B] dark:text-[#94A3B8]"
        aria-hidden
      />
      <input className={cn(fap.searchFieldInput, className)} {...props} />
    </div>
  );
}
