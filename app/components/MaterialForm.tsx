// components/MaterialForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { fap } from '@/lib/fixedAssetPageDesign';
import { useToast } from '@/components/ui/toaster';
import type { Material } from '@/types/material';

interface MaterialFormProps {
  initial?: Material | null;
  onClose: () => void;
  onSubmit: (material: Material) => void;
  loading?: boolean;
}

export default function MaterialForm({ initial, onClose, onSubmit, loading }: MaterialFormProps) {
  const { show } = useToast();
  const [material, setMaterial] = useState<Material>(
    initial ?? {
      code: '',
      description: '',
      baseUOM: '',
      orderUOM: '',
      skuUOM: '',
      longText: '',
      materialType: '',
      materialGroup: '',
      mrpRelevant: false,
      specialStock: false,
      remarks: '',
      status: 'stock',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const val = type === 'checkbox' ? target.checked : value;
    setMaterial(prev => ({ ...prev, [name]: val } as Material));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!material.code || !material.description) {
      show({ title: 'Validation', description: 'Code and Description are required' });
      return;
    }
    onSubmit(material);
  };

  const isEdit = Boolean(initial?._id);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit' : 'Create'} Material Master</h2>

        <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <legend className="text-sm font-medium px-2">Material Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                name="code"
                value={material.code}
                onChange={handleChange}
                maxLength={12}
                required
                disabled={isEdit} // Do not allow editing material code once created
                className={`w-full ${fap.input}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <input
                name="description"
                value={material.description}
                onChange={handleChange}
                maxLength={40}
                required
                className={`w-full ${fap.input}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base UOM</label>
              <input name="baseUOM" value={material.baseUOM} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order UOM</label>
              <input name="orderUOM" value={material.orderUOM} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU UOM</label>
              <input name="skuUOM" value={material.skuUOM} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Material Type</label>
              <input name="materialType" value={material.materialType} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Material Group</label>
              <input name="materialGroup" value={material.materialGroup} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" value={material.status} onChange={handleChange} className={`w-full ${fap.input}`}>
                <option value="stock">Stock</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="mrpRelevant" checked={material.mrpRelevant} onChange={handleChange} />
              <span className="text-sm">MRP Relevant</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="specialStock" checked={material.specialStock} onChange={handleChange} />
              <span className="text-sm">Special Stock</span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Long Text</label>
              <textarea
                name="longText"
                value={material.longText}
                onChange={handleChange}
                maxLength={400}
                rows={2}
                className={`w-full ${fap.input}`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <input name="remarks" value={material.remarks || ''} onChange={handleChange} className={`w-full ${fap.input}`} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" onClick={onClose} className={fap.btnSecondary} disabled={loading}>Cancel</button>
          <button type="submit" className={fap.btnPrimary} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
