'use client';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ProjectReturnMaterialRequestFormProps {
  materialId: string;
  materialDescription: string;
  availableQuantity: number;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSaving?: boolean;
}

export default function ProjectReturnMaterialRequestForm({ 
  materialId, 
  materialDescription, 
  availableQuantity, 
  onClose, 
  onSubmit,
  isSaving
}: ProjectReturnMaterialRequestFormProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    budgetedWBS: '',
    requestorEmpNumber: '',
    requestorName: '',
    qtyRequested: 0,
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.qtyRequested > availableQuantity) {
      alert('Requested quantity cannot exceed available quantity');
      return;
    }

    if (formData.qtyRequested <= 0) {
      alert('Requested quantity must be greater than 0');
      return;
    }

    onSubmit({
      materialid: materialId,
      ...formData,
      requestDate: new Date()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Request Project Return Material
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Material:</strong> {materialDescription}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Available Quantity:</strong> {availableQuantity.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budgeted WBS *
              </label>
              <input
                type="text"
                required
                value={formData.budgetedWBS}
                onChange={(e) => setFormData({ ...formData, budgetedWBS: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter budgeted WBS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Requestor Employee Number *
              </label>
              <input
                type="text"
                required
                value={formData.requestorEmpNumber}
                onChange={(e) => setFormData({ ...formData, requestorEmpNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter employee number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Requestor Name *
              </label>
              <input
                type="text"
                required
                value={formData.requestorName}
                onChange={(e) => setFormData({ ...formData, requestorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter requestor name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity Requested *
              </label>
              <input
                type="number"
                required
                min="0.01"
                max={availableQuantity}
                step="0.01"
                value={formData.qtyRequested}
                onChange={(e) => setFormData({ ...formData, qtyRequested: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter quantity"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum: {availableQuantity.toLocaleString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter any additional remarks"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
