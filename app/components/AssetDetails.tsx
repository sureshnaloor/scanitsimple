'use client';
import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { PencilIcon, XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AssetData } from '@/types/asset';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export type Theme = 'default' | 'glassmorphic' | 'light';

const ASSET_STATUSES = [
  'Select Status',   // Default option
  'Active',
  'In Calibration',
  'Under Repair',
  'Retired',
  'Disposed'
];

interface AssetDetailsProps {
  asset: AssetData;
  onUpdate: (updatedAsset: Partial<AssetData>) => Promise<void>;
  theme?: Theme;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
  changes: {
    category?: string;
    subcategory?: string;
    status?: string;
    notes?: boolean;
  };
}

function LoadingSpinner() {
  return (
    <svg 
      className="animate-spin h-5 w-5 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ConfirmationModal({ isOpen, onConfirm, onCancel, isSaving, changes, theme = 'default' }: ConfirmationModalProps & { theme?: Theme }) {
  if (!isOpen) return null;

  const getModalStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'bg-white/10 backdrop-blur-lg border border-white/20',
          text: 'text-white',
          textSecondary: 'text-white/80',
          buttonPrimary: 'bg-teal-500 hover:bg-teal-600',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 border border-white/20'
        };
      case 'light':
        return {
          container: 'bg-white border-2 border-blue-200',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          buttonPrimary: 'bg-blue-500 hover:bg-blue-600',
          buttonSecondary: 'bg-gray-200 hover:bg-gray-300'
        };
      default:
        return {
          container: 'bg-slate-800',
          text: 'text-zinc-100',
          textSecondary: 'text-zinc-300',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
          buttonSecondary: 'bg-slate-600 hover:bg-slate-700'
        };
    }
  };

  const modalStyles = getModalStyles();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`${modalStyles.container} rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}>
        <div className="flex items-start gap-4">
          <ExclamationTriangleIcon className={`h-6 w-6 ${theme === 'glassmorphic' ? 'text-yellow-400' : theme === 'light' ? 'text-yellow-600' : 'text-yellow-500'} mt-1`} />
          <div>
            <h3 className={`text-lg font-semibold ${modalStyles.text} mb-2`}>Confirm Changes</h3>
            <div className={`text-sm ${modalStyles.textSecondary} space-y-2`}>
              <p>Are you sure you want to save the following changes?</p>
              <ul className={`list-disc list-inside space-y-1 ${theme === 'glassmorphic' ? 'text-white/70' : theme === 'light' ? 'text-gray-600' : 'text-zinc-400'}`}>
                {changes.category && (
                  <li>Category: {changes.category}</li>
                )}
                {changes.subcategory && (
                  <li>Subcategory: {changes.subcategory}</li>
                )}
                {changes.status && (
                  <li>Status: {changes.status}</li>
                )}
                {changes.notes && (
                  <li>Notes have been modified</li>
                )}
              </ul>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className={`flex-1 ${modalStyles.buttonPrimary} disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2`}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isSaving}
                className={`flex-1 ${modalStyles.buttonSecondary} disabled:opacity-50 ${theme === 'glassmorphic' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'} px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Category {
  _id: string;
  name: string;
}

interface Subcategory {
  _id: string;
  category: string;
  name: string;
}

interface Manufacturer {
  _id: string;
  name: string;
}

export default function AssetDetails({ asset, onUpdate, theme = 'default' }: AssetDetailsProps) {
  const pathname = usePathname();
  const isFixedAsset = pathname?.includes('/fixedasset/') ?? false;
  const { data: session, status } = useSession();

  // Theme-based style helpers
  const getContainerStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl';
      case 'light':
        return 'bg-white border-2 border-blue-200 rounded-xl shadow-lg';
      default:
        return 'bg-white dark:bg-slate-800/20 backdrop-blur-sm rounded-lg shadow-lg';
    }
  };

  const getFieldStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl',
          label: 'text-white/80',
          text: 'text-white',
          input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400'
        };
      case 'light':
        return {
          container: 'bg-blue-50 border border-blue-200 rounded-lg',
          label: 'text-blue-900 font-medium',
          text: 'text-gray-900',
          input: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        };
      default:
        return {
          container: 'bg-gray-200 dark:bg-slate-700/50 rounded-md',
          label: 'text-gray-600 dark:text-gray-300',
          text: 'text-gray-900 dark:text-white',
          input: 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-500 focus:ring-2 focus:ring-blue-500'
        };
    }
  };

  const fieldStyles = getFieldStyles();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState<AssetData>(asset);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          isFixedAsset ? '/api/categories/fixedasset' : '/api/categories/mme'
        );
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories([{ _id: '0', name: 'Select Category' }, ...data]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isFixedAsset]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!editedAsset.assetcategory || editedAsset.assetcategory === 'Select Category') {
        setSubcategories([]);
        return;
      }

      try {
        const response = await fetch(
          `${isFixedAsset ? '/api/subcategories/fixedasset' : '/api/subcategories/mme'}?category=${encodeURIComponent(editedAsset.assetcategory)}`
        );
        if (!response.ok) throw new Error('Failed to fetch subcategories');
        const data = await response.json();
        setSubcategories([{ _id: '0', category: editedAsset.assetcategory, name: 'Select Subcategory' }, ...data]);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setError('Failed to load subcategories');
      }
    };
    fetchSubcategories();
  }, [editedAsset?.assetcategory, isFixedAsset]);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const endpoint = isFixedAsset ? '/api/manufacturers/fixedasset' : '/api/manufacturers/mme';
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch manufacturers');
        const data = await response.json();
        setManufacturers([{ _id: '0', name: 'Select Manufacturer' }, ...data]);
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
        setError('Failed to load manufacturers');
      }
    };

    fetchManufacturers();
  }, [isFixedAsset]);

  const [isSaving, setIsSaving] = useState(false);
  const [editorContent, setEditorContent] = useState(asset.assetnotes);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: editorContent,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none',
      },
    },
  }, [isEditing]); // Recreate editor when isEditing changes

  // Update editor content when asset changes
  useEffect(() => {
    if (editor && !isEditing) {
      editor.commands.setContent(asset.assetnotes || '');
    }
  }, [asset.assetnotes, editor, isEditing]);

  // Update editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedAsset({
      ...asset,
      assetcategory: asset.assetcategory || 'Select Category',
      assetsubcategory: asset.assetsubcategory || 'Select Subcategory',
      assetstatus: asset.assetstatus || 'Select Status'
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedAsset(asset);
    setEditorContent(asset.assetnotes || '');
    editor?.commands.setContent(asset.assetnotes || '');
  };

  const handleSave = async () => {
    try {
      // Validation
      if (editedAsset.assetcategory === 'Select Category') {
        setError('Please select a category');
        return;
      }
      if (editedAsset.assetsubcategory === 'Select Subcategory') {
        setError('Please select a subcategory');
        return;
      }
      if (editedAsset.assetstatus === 'Select Status') {
        setError('Please select a status');
        return;
      }

      // Update the payload to include new fields
      const updatePayload = {
        assetcategory: editedAsset.assetcategory,
        assetsubcategory: editedAsset.assetsubcategory,
        assetstatus: editedAsset.assetstatus,
        assetnotes: editorContent,
        // Add new fields
        assetmodel: editedAsset.assetmodel,
        assetmanufacturer: editedAsset.assetmanufacturer,
        assetserialnumber: editedAsset.assetserialnumber,
        accessories: editedAsset.accessories,
        legacyassetnumber: editedAsset.legacyassetnumber,
        anyotheridentifier: editedAsset.anyotheridentifier,
      };

      // Store payload for confirmation
      setPendingChanges(updatePayload);
      setShowConfirmation(true);

    } catch (error) {
      console.error('Failed to prepare update:', error);
      setError(error instanceof Error ? error.message : 'Failed to prepare update');
    }
  };

  const handleConfirmedSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onUpdate(pendingChanges);
      setShowConfirmation(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
      setError(error instanceof Error ? error.message : 'Failed to update asset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setEditedAsset(prev => ({
      ...prev,
      assetcategory: newCategory,
      assetsubcategory: 'Select Subcategory' // Reset subcategory when category changes
    }));
  };

  const accessoriesEditor = useEditor({
    extensions: [StarterKit],
    content: asset.accessories || '',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      setEditedAsset(prev => ({
        ...prev,
        accessories: editor.getHTML()
      }));
    },
  }, [isEditing]); // Recreate editor when isEditing changes

  // Update editor content when asset changes
  useEffect(() => {
    if (accessoriesEditor && !isEditing) {
      accessoriesEditor.commands.setContent(asset.accessories || '');
    }
  }, [asset.accessories, accessoriesEditor, isEditing]);

  // Update editor editable state
  useEffect(() => {
    if (accessoriesEditor) {
      accessoriesEditor.setEditable(isEditing);
    }
  }, [accessoriesEditor, isEditing]);

  const getButtonStyles = (color: 'blue' | 'red' | 'green') => {
    const baseStyles = 'p-1 transition-colors';
    switch (theme) {
      case 'glassmorphic':
        return {
          blue: `${baseStyles} text-teal-400 hover:text-teal-300`,
          red: `${baseStyles} text-red-400 hover:text-red-300`,
          green: `${baseStyles} text-green-400 hover:text-green-300`
        }[color];
      case 'light':
        return {
          blue: `${baseStyles} text-blue-600 hover:text-blue-700`,
          red: `${baseStyles} text-red-600 hover:text-red-700`,
          green: `${baseStyles} text-green-600 hover:text-green-700`
        }[color];
      default:
        return {
          blue: `${baseStyles} text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300`,
          red: `${baseStyles} text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300`,
          green: `${baseStyles} text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300`
        }[color];
    }
  };

  const getErrorStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return 'bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300';
      case 'light':
        return 'bg-red-50 border border-red-200 text-red-700';
      default:
        return 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-200';
    }
  };

  return (
    <div className={`${getContainerStyles()} p-3 w-full max-w-4xl relative`}>
      {error && (
        <div className={`absolute top-0 left-0 right-0 ${getErrorStyles()} px-4 py-2 rounded-t-lg text-sm`}>
          {error}
        </div>
      )}

      {/* Edit/Save/Cancel buttons */}
      <div className="absolute top-3 right-3 flex gap-2">
        {session && (
          !isEditing ? (
            <button
              onClick={handleEdit}
              className={getButtonStyles('blue')}
              title="Edit Asset Details"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className={getButtonStyles('red')}
                title="Cancel Editing"
                disabled={isSaving}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleSave}
                className={getButtonStyles('green')}
                title="Save Changes"
                disabled={isSaving}
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </>
          )
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Non-editable fields */}
        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Asset Number</label>
          <div className={`text-sm font-bold ${fieldStyles.text}`}>
            {asset.assetnumber}
          </div>
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Asset Description</label>
          <div className={`text-sm font-bold ${fieldStyles.text}`}>
            {asset.assetdescription}
          </div>
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Acquisition Date</label>
          <div className={`text-[12px] ${fieldStyles.text}`}>
            {asset.acquireddate ? new Date(asset.acquireddate).toLocaleDateString() : '-'}
          </div>
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Acquisition Value</label>
          <div className={`text-[12px] ${fieldStyles.text}`}>
            {session ? (
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'SAR'
              }).format(asset.acquiredvalue ?? 0)
            ) : (
              'SAR *******'
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Asset Category</label>
          {isEditing ? (
            <select
              value={editedAsset.assetcategory}
              onChange={handleCategoryChange}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            >
              {categories.map(category => (
                <option key={category._id} value={category.name} className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>{category.name}</option>
              ))}
            </select>
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetcategory}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Asset Subcategory</label>
          {isEditing ? (
            <select
              value={editedAsset.assetsubcategory}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                assetsubcategory: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
              disabled={editedAsset.assetcategory === 'Select Category'}
            >
              {subcategories.map(subcategory => (
                <option key={subcategory._id} value={subcategory.name} className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>{subcategory.name}</option>
              ))}
            </select>
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetsubcategory}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Asset Status</label>
          {isEditing ? (
            <select
              value={editedAsset.assetstatus}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                assetstatus: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            >
              {ASSET_STATUSES.map(status => (
                <option key={status} value={status} className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>{status}</option>
              ))}
            </select>
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetstatus}</div>
          )}
        </div>

        {/* Rich text notes field */}
        <div className={`col-span-2 ${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label} mb-1`}>
            Asset Notes
          </label>
          <div className={`${
            isEditing 
              ? theme === 'glassmorphic'
                ? 'bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20'
                : theme === 'light'
                ? 'bg-white rounded-lg p-2 border-2 border-blue-300'
                : 'bg-white dark:bg-slate-600 rounded-md p-2 border border-gray-200 dark:border-slate-500'
              : ''
          }`}>
            <EditorContent 
              editor={editor} 
              className={`prose prose-sm ${theme === 'glassmorphic' ? 'prose-invert' : theme === 'light' ? '' : 'dark:prose-invert'} max-w-none ${
                isEditing 
                  ? 'min-h-[100px] focus:outline-none cursor-text' 
                  : 'cursor-default'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Model</label>
          {isEditing ? (
            <input
              type="text"
              value={editedAsset.assetmodel || ''}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                assetmodel: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            />
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetmodel}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Manufacturer</label>
          {isEditing ? (
            <select
              value={editedAsset.assetmanufacturer || 'Select Manufacturer'}
              onChange={(e) =>
                setEditedAsset((prev) => ({
                  ...prev,
                  assetmanufacturer:
                    e.target.value === 'Select Manufacturer' ? '' : e.target.value
                }))
              }
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            >
              {manufacturers.map((manufacturer) => (
                <option
                  key={manufacturer._id}
                  value={manufacturer.name}
                  className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}
                >
                  {manufacturer.name}
                </option>
              ))}
              {editedAsset.assetmanufacturer &&
                !manufacturers.some(
                  (manufacturer) => manufacturer.name === editedAsset.assetmanufacturer
                ) && (
                  <option value={editedAsset.assetmanufacturer}>{editedAsset.assetmanufacturer}</option>
                )}
            </select>
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetmanufacturer}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Serial Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedAsset.assetserialnumber || ''}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                assetserialnumber: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            />
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.assetserialnumber}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Accessories</label>
          {isEditing ? (
            <div className={theme === 'glassmorphic' ? 'bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20' : theme === 'light' ? 'bg-white rounded-lg p-2 border-2 border-blue-300' : 'bg-white dark:bg-slate-600 rounded-md p-2'}>
              <EditorContent 
                editor={accessoriesEditor} 
                className={`prose prose-sm ${theme === 'glassmorphic' ? 'prose-invert' : theme === 'light' ? '' : 'dark:prose-invert'} max-w-none`}
              />
            </div>
          ) : (
            <div 
              className={`text-[12px] ${fieldStyles.text} prose prose-sm ${theme === 'glassmorphic' ? 'prose-invert' : theme === 'light' ? '' : 'dark:prose-invert'} max-w-none`}
              dangerouslySetInnerHTML={{ __html: asset.accessories || '' }}
            />
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Legacy Asset Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedAsset.legacyassetnumber || ''}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                legacyassetnumber: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            />
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.legacyassetnumber || '-'}</div>
          )}
        </div>

        <div className={`${fieldStyles.container} p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Any Other Identifier</label>
          {isEditing ? (
            <input
              type="text"
              value={editedAsset.anyotheridentifier || ''}
              onChange={(e) => setEditedAsset(prev => ({
                ...prev,
                anyotheridentifier: e.target.value
              }))}
              className={`w-full text-sm rounded-xl p-2 ${fieldStyles.input}`}
            />
          ) : (
            <div className={`text-[12px] ${fieldStyles.text}`}>{asset.anyotheridentifier || '-'}</div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmedSave}
        onCancel={() => setShowConfirmation(false)}
        isSaving={isSaving}
        theme={theme}
        changes={{
          category: pendingChanges?.assetcategory !== asset.assetcategory ? pendingChanges?.assetcategory : undefined,
          subcategory: pendingChanges?.assetsubcategory !== asset.assetsubcategory ? pendingChanges?.assetsubcategory : undefined,
          status: pendingChanges?.assetstatus !== asset.assetstatus ? pendingChanges?.assetstatus : undefined,
          notes: pendingChanges?.assetnotes !== asset.assetnotes,
        }}
      />
    </div>
  );
}
