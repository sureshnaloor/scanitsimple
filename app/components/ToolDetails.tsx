'use client';
import { useState } from 'react';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ToolData } from '@/types/tools';

interface ToolDetailsProps {
  tool: ToolData;
  onUpdate: (updatedTool: Partial<ToolData>) => Promise<void>;
}

const TOOL_CATEGORIES = [
  'Select Category',
  'Hand Tools',
  'Power Tools',
  'Measuring Tools',
  'Safety Equipment',
  'Specialized Tools',
  'Maintenance Tools',
];

const TOOL_SUBCATEGORIES: { [key: string]: string[] } = {
  'Hand Tools': ['Wrenches', 'Screwdrivers', 'Pliers', 'Hammers'],
  'Power Tools': ['Drills', 'Saws', 'Grinders', 'Sanders'],
  'Measuring Tools': ['Tape Measures', 'Calipers', 'Levels', 'Rulers'],
  'Safety Equipment': ['Hard Hats', 'Safety Glasses', 'Gloves', 'Vests'],
  'Specialized Tools': ['Welding Tools', 'Plumbing Tools', 'Electrical Tools'],
  'Maintenance Tools': ['Lubrication Tools', 'Cleaning Tools', 'Inspection Tools'],
};

const TOOL_STATUSES = [
  'Select Status',
  'Available',
  'In Use',
  'Maintenance',
  'Retired',
];

const TOOL_LOCATIONS = [
  'Select Location',
  'Warehouse',
  'Project Site',
  'Maintenance',
];

const TOOL_CONDITIONS = [
  'Select Condition',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Damaged',
];

export default function ToolDetails({ tool, onUpdate }: ToolDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTool, setEditedTool] = useState<Partial<ToolData>>(tool);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdate(editedTool);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTool(tool);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof ToolData, value: string | number) => {
    setEditedTool(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (
    label: string,
    field: keyof ToolData,
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' = 'text',
    options?: string[]
  ) => {
    const value = isEditing ? editedTool[field] : tool[field];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
        {isEditing ? (
          type === 'select' && options ? (
            <select
              value={value as string || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {options.map(option => (
                <option key={option} value={option === options[0] ? '' : option}>
                  {option}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={value as string || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <input
              type={type}
              value={value as string || ''}
              onChange={(e) => handleInputChange(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )
        ) : (
          <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 min-h-[40px] flex items-center">
            {value instanceof Date ? value.toLocaleDateString() : value || 'Not specified'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Tool Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {renderField('Tool ID', 'assetnumber', 'text')}
          {renderField('Tool Description', 'toolDescription', 'text')}
          {renderField('Serial Number', 'serialNumber', 'text')}
          {renderField('Manufacturer', 'manufacturer', 'text')}
          {renderField('Model Number', 'modelNumber', 'text')}
          {renderField('Tool Cost', 'toolCost', 'number')}
        </div>
        
        <div>
          {renderField('Purchase Date', 'purchasedDate', 'date')}
          {renderField('Purchase PO Number', 'purchasePONumber', 'text')}
          {renderField('Purchase Supplier', 'purchaseSupplier', 'text')}
          {renderField('Tool Category', 'toolCategory', 'select', TOOL_CATEGORIES)}
          {renderField('Tool Subcategory', 'toolSubcategory', 'select', 
            tool.toolCategory && TOOL_SUBCATEGORIES[tool.toolCategory] 
              ? ['Select Subcategory', ...TOOL_SUBCATEGORIES[tool.toolCategory]]
              : ['Select Subcategory']
          )}
          {renderField('Tool Status', 'toolStatus', 'select', TOOL_STATUSES)}
          {renderField('Tool Location', 'toolLocation', 'select', TOOL_LOCATIONS)}
          {renderField('Tool Condition', 'toolCondition', 'select', TOOL_CONDITIONS)}
        </div>
      </div>

      <div className="mt-6">
        {renderField('Accessories', 'accessories', 'text')}
        {renderField('Notes', 'toolNotes', 'textarea')}
      </div>
    </div>
  );
}
