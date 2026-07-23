'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/types/ppe';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface SearchableEmployeeSelectProps {
  value: string;
  /** When editing, pass the stored name so the control can show "empno - name" before search. */
  initialEmpName?: string;
  onChange: (empNumber: string, empName: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SearchableEmployeeSelect({
  value,
  initialEmpName,
  onChange,
  placeholder = "Search employee by name or number...",
  required = false,
  disabled = false
}: SearchableEmployeeSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useAppTheme();

  const isGlassmorphic = theme === 'glassmorphic';
  const isLight = theme === 'light';

  const inputStyles = isGlassmorphic
    ? 'bg-white/10 backdrop-blur-md border-white/20 text-white placeholder-white/70 focus:ring-teal-400'
    : isLight
    ? 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
    : 'bg-slate-800/90 border border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-teal-400 focus:border-teal-400';

  const dropdownContainerStyles = isGlassmorphic
    ? 'bg-white/10 backdrop-blur-lg border border-white/20'
    : isLight
    ? 'bg-white border border-blue-200 shadow-lg'
    : 'bg-slate-900 border border-slate-700';

  const dropdownTextStyles = isGlassmorphic
    ? 'text-white/80'
    : isLight
    ? 'text-gray-700'
    : 'text-slate-200';

  const dropdownItemTitleStyles = isGlassmorphic
    ? 'font-medium text-white'
    : isLight
    ? 'font-medium text-gray-900'
    : 'font-medium text-slate-100';

  const dropdownItemSubtitleStyles = isGlassmorphic
    ? 'text-sm text-white/70'
    : isLight
    ? 'text-sm text-gray-600'
    : 'text-sm text-slate-300';

  // Fetch employees based on search term
  const fetchEmployees = async (search: string) => {
    if (search.length < 2) {
      setEmployees([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/employees?search=${encodeURIComponent(search)}&limit=10`);
      const result = await response.json();
      
      if (result.success) {
        setEmployees(result.data.records.filter((emp: Employee) => emp.active !== 'N'));
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync controlled selection when parent loads edit data (empno + name)
  useEffect(() => {
    if (value && initialEmpName) {
      setSelectedEmployee({ empno: value, empname: initialEmpName } as Employee);
      setSearchTerm(`${value} - ${initialEmpName}`);
    } else if (!value) {
      setSelectedEmployee(null);
      setSearchTerm('');
    }
  }, [value, initialEmpName]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        // Only search if we don't have a selected employee or if the search term is different from the selected employee's display text
        const selectedDisplayText = selectedEmployee ? `${selectedEmployee.empno} - ${selectedEmployee.empname}` : '';
        if (!selectedEmployee || searchTerm !== selectedDisplayText) {
          fetchEmployees(searchTerm);
          setIsOpen(true);
        }
      } else {
        setEmployees([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedEmployee]);

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(`${employee.empno} - ${employee.empname}`);
    setIsOpen(false);
    onChange(employee.empno, employee.empname);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // If user clears the input, clear selection
    if (!newValue) {
      setSelectedEmployee(null);
      onChange('', '');
    } else {
      // If user starts typing and it's different from the selected employee's display text, clear selection
      const selectedDisplayText = selectedEmployee ? `${selectedEmployee.empno} - ${selectedEmployee.empname}` : '';
      if (selectedEmployee && newValue !== selectedDisplayText) {
        setSelectedEmployee(null);
        onChange('', '');
      }
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm && employees.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Clear selection
  const handleClear = () => {
    setSearchTerm('');
    setSelectedEmployee(null);
    setEmployees([]);
    setIsOpen(false);
    onChange('', '');
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            'pr-20',
            inputStyles
          )}
        />
        {selectedEmployee && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-2 rounded-xl shadow-2xl max-h-60 overflow-auto',
            dropdownContainerStyles
          )}
        >
          {loading ? (
            <div className={cn('p-3 text-center', dropdownTextStyles)}>
              Searching...
            </div>
          ) : employees.length > 0 ? (
            <div className="py-1">
              {employees.map((employee) => (
                <button
                  key={employee.empno}
                  type="button"
                  onClick={() => handleEmployeeSelect(employee)}
                  className={cn(
                    'w-full px-4 py-3 text-left focus:outline-none transition-colors border-b last:border-b-0',
                    isGlassmorphic
                      ? 'hover:bg-white/10 focus:bg-white/10 border-white/5'
                      : isLight
                      ? 'hover:bg-blue-50 focus:bg-blue-50 border-blue-100'
                      : 'hover:bg-slate-800 focus:bg-slate-800 border-slate-700'
                  )}
                >
                  <div className="flex flex-col">
                    <span className={dropdownItemTitleStyles}>
                      {employee.empno} - {employee.empname}
                    </span>
                    {employee.department && (
                      <span className={dropdownItemSubtitleStyles}>
                        {employee.department}
                        {employee.designation && ` • ${employee.designation}`}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 && !selectedEmployee ? (
            <div className={cn('p-3 text-center', dropdownTextStyles)}>
              No employees found
            </div>
          ) : searchTerm.length < 2 ? (
            <div className={cn('p-3 text-center', dropdownTextStyles)}>
              Type at least 2 characters to search
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
