import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border border-primary-light bg-primary-slate px-3 py-2 transition-all duration-200 focus-within:border-accent-teal focus-within:shadow-glow-teal',
          containerClassName
        )}
      >
        <Search
          className={cn(
            'size-4 shrink-0 transition-colors duration-200',
            focused ? 'text-accent-teal' : 'text-text-muted'
          )}
          aria-hidden
        />
        <input
          ref={ref}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted md:text-sm',
            className
          )}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
