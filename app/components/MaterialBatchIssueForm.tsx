// components/MaterialBatchIssueForm.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import SearchableEmployeeSelect from '@/components/SearchableEmployeeSelect';
import type { StorageLocation } from '@/types/material';

interface MaterialBatchIssueFormProps {
  batch: {
    _id: string;
    materialId: string;
    materialCode: string;
    materialDescription: string;
    currentQuantity: number;
    transactionPO: string;
  };
  onClose: () => void;
  onSubmit: (issueData: any) => void;
  loading?: boolean;
}

export default function MaterialBatchIssueForm({ batch, onClose, onSubmit, loading }: MaterialBatchIssueFormProps) {
  const { show } = useToast();
  const [quantity, setQuantity] = useState('');
  
  // Format current date/time to local ISO format for datetime-local input
  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const [issueDate, setIssueDate] = useState(getLocalDateTimeString());
  const [issuedByEmpNo, setIssuedByEmpNo] = useState('');
  const [issuedByEmpName, setIssuedByEmpName] = useState('');
  const [receivedByEmpNo, setReceivedByEmpNo] = useState('');
  const [receivedByEmpName, setReceivedByEmpName] = useState('');
  const [transportMode, setTransportMode] = useState('by hand');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [usageLocation, setUsageLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  // Destination storage location options
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [destinationStorageLocationId, setDestinationStorageLocationId] = useState('');
  const [destinationRack, setDestinationRack] = useState('');
  const [destinationBin, setDestinationBin] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/storage-locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(Array.isArray(data) ? data : []);
        }
      } catch {
        show({ title: 'Error', description: 'Failed to load storage locations list', variant: 'destructive' });
      }
    };
    fetchLocations();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      show({ title: 'Validation', description: 'Please enter a positive issue quantity', variant: 'destructive' });
      return;
    }

    if (qty > batch.currentQuantity) {
      show({
        title: 'Validation',
        description: `Issue quantity (${qty}) cannot exceed available batch quantity (${batch.currentQuantity})`,
        variant: 'destructive',
      });
      return;
    }

    if (!issuedByEmpNo || !receivedByEmpNo) {
      show({ title: 'Validation', description: 'Please select both issuing and receiving employees', variant: 'destructive' });
      return;
    }

    onSubmit({
      batchId: batch._id,
      quantity: qty,
      issueDate: new Date(issueDate),
      issuedBy: `${issuedByEmpNo} - ${issuedByEmpName}`,
      receivedBy: `${receivedByEmpNo} - ${receivedByEmpName}`,
      transportMode,
      drawingNumber,
      usageLocation,
      remarks,
      destinationStorageLocationId,
      destinationRack,
      destinationBin,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl space-y-4 max-h-[95vh] overflow-y-auto mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Issue Material from Batch
        </h2>

        {/* Batch Overview */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
          <div>
            <span className="text-gray-400">Material:</span> {batch.materialCode} - {batch.materialDescription}
          </div>
          <div>
            <span className="text-gray-400">Transaction:</span> {batch.transactionPO}
          </div>
          <div className="col-span-2 border-t border-blue-200/40 dark:border-blue-900/40 pt-2 font-semibold flex justify-between">
            <span>Available Quantity:</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">{batch.currentQuantity}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-1">Quantity to Issue *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0.001"
                step="any"
                placeholder="Enter quantity"
                className={`w-full ${fap.input}`}
              />
            </div>

            {/* Issue Date/Time */}
            <div>
              <label className="block text-sm font-medium mb-1">Issue Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className={`w-full ${fap.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person Who Issued */}
            <div>
              <label className="block text-sm font-medium mb-1">Person Who Issued *</label>
              <SearchableEmployeeSelect
                value={issuedByEmpNo}
                initialEmpName={issuedByEmpName}
                onChange={(empNumber, empName) => {
                  setIssuedByEmpNo(empNumber);
                  setIssuedByEmpName(empName);
                }}
                placeholder="Search issuer..."
                required
              />
            </div>

            {/* Person Who Received */}
            <div>
              <label className="block text-sm font-medium mb-1">Person Who Received *</label>
              <SearchableEmployeeSelect
                value={receivedByEmpNo}
                initialEmpName={receivedByEmpName}
                onChange={(empNumber, empName) => {
                  setReceivedByEmpNo(empNumber);
                  setReceivedByEmpName(empName);
                }}
                placeholder="Search receiver..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode of Transport */}
            <div>
              <label className="block text-sm font-medium mb-1">Mode of Transport</label>
              <select
                value={transportMode}
                onChange={e => setTransportMode(e.target.value)}
                className={`w-full ${fap.input}`}
              >
                <option value="by hand">by hand</option>
                <option value="trailer">trailer</option>
                <option value="pickup">pickup</option>
                <option value="forklift">forklift</option>
              </select>
            </div>

            {/* Drawing Number */}
            <div>
              <label className="block text-sm font-medium mb-1">Drawing #</label>
              <input
                value={drawingNumber}
                onChange={e => setDrawingNumber(e.target.value)}
                placeholder="Enter drawing number"
                className={`w-full ${fap.input}`}
              />
            </div>
          </div>

          {/* Destination Storage location fields */}
          <fieldset className="border border-slate-350 dark:border-slate-700 rounded-lg p-4 space-y-4">
            <legend className="text-xs font-bold uppercase tracking-wider px-2 text-indigo-600 dark:text-indigo-400">
              Site Destination (Creates Receipt Batch)
            </legend>
            
            <div>
              <label className="block text-sm font-medium mb-1">Destination Warehouse</label>
              <select
                value={destinationStorageLocationId}
                onChange={e => setDestinationStorageLocationId(e.target.value)}
                className={`w-full ${fap.input}`}
              >
                <option value="">-- Select Destination Site Warehouse --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} {loc.incharge ? `(Incharge: ${loc.incharge})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destination Rack</label>
                <input
                  value={destinationRack}
                  onChange={e => setDestinationRack(e.target.value)}
                  placeholder="e.g. Rack B"
                  className={`w-full ${fap.input}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Destination Bin</label>
                <input
                  value={destinationBin}
                  onChange={e => setDestinationBin(e.target.value)}
                  placeholder="e.g. Bin 10"
                  className={`w-full ${fap.input}`}
                />
              </div>
            </div>
          </fieldset>

          {/* Room / Project-Equipment Usage location */}
          <div>
            <label className="block text-sm font-medium mb-1">Project-Equipment or Room where used</label>
            <input
              value={usageLocation}
              onChange={e => setUsageLocation(e.target.value)}
              placeholder="e.g. Room 204 or Boiler-03"
              className={`w-full ${fap.input}`}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              rows={2}
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
            {loading ? 'Processing...' : 'Issue Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
