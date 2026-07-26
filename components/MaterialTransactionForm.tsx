// components/MaterialTransactionForm.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import type { Material, MaterialTransaction, StorageLocation } from '@/types/material';

interface MaterialTransactionFormProps {
  initial?: MaterialTransaction | null;
  onClose: () => void;
  onSubmit: (transaction: MaterialTransaction) => void;
  loading?: boolean;
}

export default function MaterialTransactionForm({ initial, onClose, onSubmit, loading }: MaterialTransactionFormProps) {
  const { show } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);

  const [materialId, setMaterialId] = useState(initial?.materialId || '');
  const [costElement, setCostElement] = useState(initial?.costElement || '');
  const [poNumber, setPoNumber] = useState(initial?.poNumber || '');
  const [poLineItem, setPoLineItem] = useState(initial?.poLineItem || '');
  const [receivedQuantity, setReceivedQuantity] = useState(
    initial?.receivedQuantity ? String(initial.receivedQuantity) : ''
  );
  const [batchNumber, setBatchNumber] = useState(initial?.batchNumber || '');
  
  // Storage fields inside Transaction Form
  const [storageLocationId, setStorageLocationId] = useState(initial?.storageLocationId || '');
  const [rackNumber, setRackNumber] = useState(initial?.rackNumber || '');
  const [binNumber, setBinNumber] = useState(initial?.binNumber || '');
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber || '');
  const [palletNumber, setPalletNumber] = useState(initial?.palletNumber || '');
  const [yardNumber, setYardNumber] = useState(initial?.yardNumber || '');
  const [remarks, setRemarks] = useState(initial?.remarks || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, locRes] = await Promise.all([
          fetch('/api/materials'),
          fetch('/api/storage-locations')
        ]);
        if (matRes.ok && locRes.ok) {
          const matData = await matRes.json();
          const locData = await locRes.json();
          setMaterials(Array.isArray(matData) ? matData : []);
          setLocations(Array.isArray(locData) ? locData : []);
        }
      } catch {
        show({ title: 'Error', description: 'Failed to load master lists', variant: 'destructive' });
      }
    };
    fetchData();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!materialId || !poNumber || !poLineItem || !costElement) {
      show({ title: 'Validation', description: 'Material, PO Number, Line Item, and Cost Element are required' });
      return;
    }

    if (storageLocationId && (!rackNumber || !binNumber)) {
      show({ title: 'Validation', description: 'Rack and Bin numbers are required when a Storage Location is selected' });
      return;
    }

    const payload: MaterialTransaction = {
      _id: initial?._id,
      materialId,
      costElement,
      poNumber,
      poLineItem,
      receivedQuantity: Number(receivedQuantity) || 0,
      batchNumber,
      storageLocationId,
      rackNumber,
      binNumber,
      roomNumber,
      palletNumber,
      yardNumber,
      remarks,
      createdAt: initial?.createdAt ? new Date(initial.createdAt) : new Date(),
    };

    onSubmit(payload);
  };

  const isEdit = Boolean(initial?._id);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto mx-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit' : 'Record'} Material Receipt
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Material Master *</label>
            <select
              value={materialId}
              onChange={e => setMaterialId(e.target.value)}
              required
              disabled={isEdit}
              className={`w-full ${fap.input}`}
            >
              <option value="">-- Select Material --</option>
              {materials.map(m => (
                <option key={m._id} value={m._id}>
                  {m.code} - {m.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">PO Number *</label>
              <input
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                required
                className={`w-full ${fap.input}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PO Line Item *</label>
              <input
                value={poLineItem}
                onChange={e => setPoLineItem(e.target.value)}
                required
                className={`w-full ${fap.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cost Element *</label>
              <input
                value={costElement}
                onChange={e => setCostElement(e.target.value)}
                required
                className={`w-full ${fap.input}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Received Quantity *</label>
              <input
                type="number"
                required
                value={receivedQuantity}
                onChange={e => setReceivedQuantity(e.target.value)}
                className={`w-full ${fap.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batch Number (Optional)</label>
              <input
                placeholder="Leave blank to auto-generate"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className={`w-full ${fap.input}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Storage Location (Warehouse)</label>
              <select
                value={storageLocationId}
                onChange={e => setStorageLocationId(e.target.value)}
                className={`w-full ${fap.input}`}
              >
                <option value="">-- Choose Warehouse --</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} {loc.incharge ? `(Incharge: ${loc.incharge})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditionally show Rack, Bin, etc. if Storage Location is selected */}
          {storageLocationId && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Storage Details Map
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Rack Number *</label>
                  <input
                    value={rackNumber}
                    onChange={e => setRackNumber(e.target.value)}
                    required
                    placeholder="e.g. Rack A"
                    className={`w-full ${fap.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Bin Number *</label>
                  <input
                    value={binNumber}
                    onChange={e => setBinNumber(e.target.value)}
                    required
                    placeholder="e.g. Bin 10"
                    className={`w-full ${fap.input}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Room Number</label>
                  <input
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className={`w-full ${fap.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Pallet Number</label>
                  <input
                    value={palletNumber}
                    onChange={e => setPalletNumber(e.target.value)}
                    className={`w-full ${fap.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Yard Number</label>
                  <input
                    value={yardNumber}
                    onChange={e => setYardNumber(e.target.value)}
                    className={`w-full ${fap.input}`}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
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
