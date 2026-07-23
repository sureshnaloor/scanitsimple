'use client';
import { useState } from 'react';
import { PencilIcon, XMarkIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ToolCustody } from '@/types/tools';

interface ToolCustodyDetailsProps {
  currentCustody: ToolCustody | null;
  custodyHistory: ToolCustody[];
  onUpdate: (updatedCustody: ToolCustody | null) => Promise<void>;
  assetnumber: string;
}

export default function ToolCustodyDetails({ 
  currentCustody, 
  custodyHistory, 
  onUpdate, 
  assetnumber 
}: ToolCustodyDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editedCustody, setEditedCustody] = useState<Partial<ToolCustody>>({
    location: 'in use',
    name: '',
    custodyFrom: new Date().toISOString().split('T')[0],
    projectName: '',
    projectLocation: '',
    department: '',
    employeeNumber: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdate(editedCustody as ToolCustody);
      setIsEditing(false);
      setIsAdding(false);
      setEditedCustody({
        location: 'in use',
        name: '',
        custodyFrom: new Date().toISOString().split('T')[0],
        projectName: '',
        projectLocation: '',
        department: '',
        employeeNumber: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error updating custody:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAdding(false);
    setEditedCustody({
      location: 'in use',
      name: '',
      custodyFrom: new Date().toISOString().split('T')[0],
      projectName: '',
      projectLocation: '',
      department: '',
      employeeNumber: '',
      notes: '',
    });
  };

  const handleInputChange = (field: keyof ToolCustody, value: string) => {
    setEditedCustody(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (
    label: string,
    field: keyof ToolCustody,
    type: 'text' | 'date' | 'select' | 'textarea' = 'text',
    options?: string[]
  ) => {
    const value = isEditing || isAdding ? editedCustody[field] : currentCustody?.[field];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
        {isEditing || isAdding ? (
          type === 'select' && options ? (
            <select
              value={value as string || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {options.map(option => (
                <option key={option} value={option}>
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
              onChange={(e) => handleInputChange(field, e.target.value)}
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
        <h2 className="text-xl font-semibold text-white">Custody Information</h2>
        {!isEditing && !isAdding ? (
          <div className="flex gap-2">
            {currentCustody ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedCustody(currentCustody);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add Custody
              </button>
            )}
          </div>
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

      {currentCustody || isEditing || isAdding ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderField('Custodian Name', 'name', 'text')}
            {renderField('Location', 'location', 'select', ['warehouse', 'in use'])}
            {renderField('Custody From', 'custodyFrom', 'date')}
            {renderField('Custody To', 'custodyTo', 'date')}
            {renderField('Project Name', 'projectName', 'text')}
          </div>
          
          <div>
            {renderField('Project Location', 'projectLocation', 'text')}
            {renderField('Department', 'department', 'text')}
            {renderField('Employee Number', 'employeeNumber', 'text')}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No custody information available</p>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors mx-auto"
          >
            <PlusIcon className="h-4 w-4" />
            Add Custody Information
          </button>
        </div>
      )}

      {renderField('Notes', 'notes', 'textarea')}

      {/* Custody History */}
      {custodyHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Custody History</h3>
          <div className="space-y-4">
            {custodyHistory.map((record, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Custodian:</span>
                    <span className="text-white ml-2">{record.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{record.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">From:</span>
                    <span className="text-white ml-2">
                      {record.custodyFrom ? new Date(record.custodyFrom).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {record.custodyTo && (
                    <div>
                      <span className="text-gray-400">To:</span>
                      <span className="text-white ml-2">
                        {new Date(record.custodyTo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {record.projectName && (
                    <div>
                      <span className="text-gray-400">Project:</span>
                      <span className="text-white ml-2">{record.projectName}</span>
                    </div>
                  )}
                  {record.department && (
                    <div>
                      <span className="text-gray-400">Department:</span>
                      <span className="text-white ml-2">{record.department}</span>
                    </div>
                  )}
                </div>
                {record.notes && (
                  <div className="mt-2">
                    <span className="text-gray-400">Notes:</span>
                    <span className="text-white ml-2">{record.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
