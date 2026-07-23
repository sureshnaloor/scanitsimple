'use client';

import { useState, useEffect, useRef } from 'react';
import { PPEMaster } from '@/types/ppe';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/app/contexts/ThemeContext';

interface SearchablePPESelectProps {
  value: string;
  onChange: (ppeId: string, ppeName: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SearchablePPESelect({
  value,
  onChange,
  placeholder = "Search PPE by name or ID...",
  required = false,
  disabled = false
}: SearchablePPESelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ppeItems, setPPEItems] = useState<PPEMaster[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPPE, setSelectedPPE] = useState<PPEMaster | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useAppTheme();

  const isLight = theme === 'light';
  /** Same frosted-on-dark treatment as /mme for both default and glassmorphic */
  const isFrostedDark = theme === 'glassmorphic' || theme === 'default';

  const inputStyles = isFrostedDark
    ? 'bg-white/10 backdrop-blur-md border-white/20 text-white placeholder-white/70 focus:ring-teal-400'
    : 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';

  const dropdownContainerStyles = isFrostedDark
    ? 'bg-white/10 backdrop-blur-lg border border-white/20'
    : 'bg-white border border-blue-200 shadow-lg';

  const dropdownTextStyles = isFrostedDark
    ? 'text-white/80'
    : 'text-gray-700';

  const dropdownItemTitleStyles = isFrostedDark
    ? 'font-medium text-white'
    : 'font-medium text-gray-900';

  const dropdownItemSubtitleStyles = isFrostedDark
    ? 'text-sm text-white/70'
    : 'text-sm text-gray-600';

  // Fetch PPE items based on search term
  const fetchPPEItems = async (search: string) => {
    if (search.length < 2) {
      setPPEItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/ppe-master?search=${encodeURIComponent(search)}&limit=10`);
      const result = await response.json();
      
      if (result.success) {
        setPPEItems(result.data.records.filter((ppe: PPEMaster) => ppe.isActive));
      } else {
        setPPEItems([]);
      }
    } catch (error) {
      console.error('Error fetching PPE items:', error);
      setPPEItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        // Only search if we don't have a selected PPE or if the search term is different from the selected PPE's display text
        const selectedDisplayText = selectedPPE ? `${selectedPPE.ppeId} - ${selectedPPE.ppeName}` : '';
        if (!selectedPPE || searchTerm !== selectedDisplayText) {
          fetchPPEItems(searchTerm);
          setIsOpen(true);
        }
      } else {
        setPPEItems([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedPPE]);

  // Handle PPE selection
  const handlePPESelect = (ppe: PPEMaster) => {
    setSelectedPPE(ppe);
    setSearchTerm(`${ppe.ppeId} - ${ppe.ppeName}`);
    setIsOpen(false);
    onChange(ppe.ppeId, ppe.ppeName);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // If user clears the input, clear selection
    if (!newValue) {
      setSelectedPPE(null);
      onChange('', '');
    } else {
      // If user starts typing and it's different from the selected PPE's display text, clear selection
      const selectedDisplayText = selectedPPE ? `${selectedPPE.ppeId} - ${selectedPPE.ppeName}` : '';
      if (selectedPPE && newValue !== selectedDisplayText) {
        setSelectedPPE(null);
        onChange('', '');
      }
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm && ppeItems.length > 0) {
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
    setSelectedPPE(null);
    setPPEItems([]);
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
        {selectedPPE && (
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
          ) : ppeItems.length > 0 ? (
            <div className="py-1">
              {ppeItems.map((ppe) => (
                <button
                  key={ppe.ppeId}
                  type="button"
                  onClick={() => handlePPESelect(ppe)}
                  className={cn(
                    'w-full px-4 py-3 text-left focus:outline-none transition-colors border-b last:border-b-0',
                    isFrostedDark
                      ? 'hover:bg-white/10 focus:bg-white/10 border-white/5'
                      : 'hover:bg-blue-50 focus:bg-blue-50 border-blue-100'
                  )}
                >
                  <div className="flex flex-col">
                    <span className={dropdownItemTitleStyles}>
                      {ppe.ppeId} - {ppe.ppeName}
                    </span>
                    <div className={dropdownItemSubtitleStyles}>
                      <span>Material: {ppe.materialCode}</span>
                      {ppe.category && <span> • Category: {ppe.category}</span>}
                      <span> • Life: {ppe.life} {ppe.lifeUOM}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 && !selectedPPE ? (
            <div className={cn('p-3 text-center', dropdownTextStyles)}>
              No PPE items found
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
