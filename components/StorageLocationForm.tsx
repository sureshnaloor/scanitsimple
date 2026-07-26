// components/StorageLocationForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import type { StorageLocation } from '@/types/material';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';

interface StorageLocationFormProps {
  initial?: StorageLocation | null;
  onClose: () => void;
  onSubmit: (location: StorageLocation) => void;
  loading?: boolean;
}

export default function StorageLocationForm({ initial, onClose, onSubmit, loading }: StorageLocationFormProps) {
  const { show } = useToast();
  const [name, setName] = useState(initial?.name || '');
  
  // Format initial incharge string to extract empNo & name if possible
  const getInitialEmpNoAndName = () => {
    if (!initial?.incharge) return { no: '', name: '' };
    const parts = initial.incharge.split(' - ');
    if (parts.length > 1) {
      return { no: parts[0], name: parts.slice(1).join(' - ') };
    }
    return { no: '', name: initial.incharge };
  };

  const initialEmp = getInitialEmpNoAndName();
  const [inchargeEmpNo, setInchargeEmpNo] = useState(initialEmp.no);
  const [inchargeEmpName, setInchargeEmpName] = useState(initialEmp.name);
  const [remarks, setRemarks] = useState(initial?.remarks || '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      show({ title: 'Validation', description: 'Warehouse name is required', variant: 'destructive' });
      return;
    }
    if (!inchargeEmpNo) {
      show({ title: 'Validation', description: 'Warehouse incharge person is required', variant: 'destructive' });
      return;
    }

    const payload: StorageLocation = {
      _id: initial?._id,
      name: name.trim(),
      incharge: `${inchargeEmpNo} - ${inchargeEmpName}`,
      remarks: remarks.trim(),
      createdAt: initial?.createdAt ? new Date(initial.createdAt) : new Date(),
    };

    onSubmit(payload);
  };

  const isEdit = Boolean(initial?._id);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-lg space-y-4 mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit' : 'Create'} Storage Location Master
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Storage Location Name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Central Warehouse or Site Warehouse"
              className={`w-full ${fap.input}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Warehouse Incharge Person *</label>
            <SearchableEmployeeSelect
              value={inchargeEmpNo}
              initialEmpName={inchargeEmpName}
              onChange={(empNumber, empName) => {
                setInchargeEmpNo(empNumber);
                setInchargeEmpName(empName);
              }}
              placeholder="Search incharge person..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter remarks"
              className={`w-full ${fap.input}`}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button type="button" onClick={onClose} className={fap.btnSecondary} disabled={loading}>Cancel</button>
          <button type="submit" className={fap.btnPrimary} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
