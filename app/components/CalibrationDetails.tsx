'use client';
import { useState, useEffect, useRef } from 'react';
import { PencilIcon, XMarkIcon, CheckIcon, ExclamationTriangleIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Calibration } from '@/types/asset';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useSession } from 'next-auth/react';

interface CalibrationCompany {
  _id: string;
  name: string;
}

import type { Theme } from '@/app/components/AssetDetails';
import { useToast } from '@/components/ui/toaster';

interface CalibrationDetailsProps {
  currentCalibration: Calibration | null;
  calibrationHistory: Calibration[];
  onUpdate: (updatedCalibration: Calibration | null) => void;
  assetnumber: string;
  theme?: Theme;
}

const VALIDITY_PERIODS = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
  { label: '24 Months', months: 24 },
];

function parseCalibrationDate(d: unknown): Date | null {
  if (d === null || d === undefined || d === '') return null;
  const x = d instanceof Date ? d : new Date(d as string);
  return Number.isNaN(x.getTime()) ? null : x;
}

function isTodayInIdleWindow(from: unknown, to: unknown): boolean {
  const start = parseCalibrationDate(from);
  const end = parseCalibrationDate(to);
  if (!start || !end) return false;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  return today >= s && today <= e;
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

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
  changes: {
    calibrationRequired?: string;
    idleCalibrationDuration?: string;
    idlePeriod?: string;
    calibratedby?: string;
    calibrationdate?: string;
    validityPeriod?: string;
    calibrationpo?: string;
    calibfile?: string;
    calibcertificate?: string;
  };
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
          textTertiary: 'text-white/70',
          buttonPrimary: 'bg-teal-500 hover:bg-teal-600',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 border border-white/20'
        };
      case 'light':
        return {
          container: 'bg-white border-2 border-blue-200',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          textTertiary: 'text-gray-600',
          buttonPrimary: 'bg-blue-500 hover:bg-blue-600',
          buttonSecondary: 'bg-gray-200 hover:bg-gray-300'
        };
      default:
        return {
          container: 'bg-slate-800',
          text: 'text-zinc-100',
          textSecondary: 'text-zinc-300',
          textTertiary: 'text-zinc-400',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
          buttonSecondary: 'bg-slate-600 hover:bg-slate-700'
        };
    }
  };

  const modalStyles = getModalStyles();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center pt-4 sm:pt-8 px-4 overflow-y-auto">
      <div className={`${modalStyles.container} rounded-lg shadow-xl p-6 max-w-2xl w-full mb-4`}>
        <div className="flex items-start gap-4">
          <ExclamationTriangleIcon className={`h-6 w-6 ${theme === 'glassmorphic' ? 'text-yellow-400' : theme === 'light' ? 'text-yellow-600' : 'text-yellow-500'} mt-1`} />
          <div>
            <h3 className={`text-lg font-semibold ${modalStyles.text} mb-2`}>Confirm Calibration Changes</h3>
            <div className={`text-sm ${modalStyles.textSecondary} space-y-2`}>
              <p>Are you sure you want to save the following changes?</p>
              <ul className={`list-disc list-inside space-y-1 ${modalStyles.textTertiary}`}>
                {Object.entries(changes).map(([key, value]) => 
                  value ? (
                    <li key={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                    </li>
                  ) : null
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

interface ArchivedCalibration extends Calibration {
  archivedAt: Date;
  archivedBy: string;
  reason: string;
}

interface CalibrationAlertProps {
  calibrationToDate: Date | null;
  calibrationRequired?: 'Required' | 'Not Required';
  idlePeriodFrom?: unknown;
  idlePeriodTo?: unknown;
  onAcknowledge: () => void;
  showAlert: boolean;
}

function CalibrationAlert({
  calibrationToDate,
  calibrationRequired,
  idlePeriodFrom,
  idlePeriodTo,
  onAcknowledge,
  showAlert,
}: CalibrationAlertProps) {
  if (!showAlert) return null;
  if (calibrationRequired === 'Not Required') {
    return (
      <div className="bg-blue-500/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckIcon className="h-6 w-6" />
          <span className="font-medium">Calibration is marked as not required for this equipment</span>
        </div>
        <button
          onClick={onAcknowledge}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Acknowledge
        </button>
      </div>
    );
  }

  if (
    calibrationRequired === 'Required' &&
    isTodayInIdleWindow(idlePeriodFrom, idlePeriodTo)
  ) {
    return (
      <div className="bg-cyan-600/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckIcon className="h-6 w-6" />
          <span className="font-medium">
            Calibration not required in this time window (equipment idle / not in service)
          </span>
        </div>
        <button
          onClick={onAcknowledge}
          className="bg-cyan-700 hover:bg-cyan-800 px-3 py-1 rounded text-sm"
        >
          Acknowledge
        </button>
      </div>
    );
  }

  // If there's no calibration record at all
  if (!calibrationToDate) {
    return (
      <div className="animate-pulse bg-red-500/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <span className="font-medium">This equipment is not CALIBRATED, DO NOT USE UNLESS TESTED AND CALIBRATED</span>
        </div>
        <button
          onClick={onAcknowledge}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Acknowledge
        </button>
      </div>
    );
  }

  const today = new Date();
  const daysUntilExpiry = Math.ceil((calibrationToDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    return (
      <div className="animate-pulse bg-red-500/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <span className="font-medium">Expired calibration - DO NOT USE unless calibrated</span>
        </div>
        <button
          onClick={onAcknowledge}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Acknowledge
        </button>
      </div>
    );
  }

  if (daysUntilExpiry <= 15) {
    return (
      <div className="animate-pulse bg-yellow-500/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <span className="font-medium">
            Calibration about to expire - Please arrange to renew calibration ({daysUntilExpiry} days remaining)
          </span>
        </div>
        <button
          onClick={onAcknowledge}
          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
        >
          Acknowledge
        </button>
      </div>
    );
  }

  // New green alert for properly calibrated equipment
  return (
    <div className="animate-pulse bg-green-500/90 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <CheckIcon className="h-6 w-6" />
        <span className="font-medium">
          Equipment is properly calibrated and fit to use ({daysUntilExpiry} days until next calibration)
        </span>
      </div>
      <button
        onClick={onAcknowledge}
        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
      >
        Acknowledge
      </button>
    </div>
  );
}

export default function CalibrationDetails({ currentCalibration, calibrationHistory, onUpdate, assetnumber, theme = 'default' }: CalibrationDetailsProps) {
  const [showNewCalibrationModal, setShowNewCalibrationModal] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibrationCompanies, setCalibrationCompanies] = useState<CalibrationCompany[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Calibration> | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showNewConfirmation, setShowNewConfirmation] = useState(false);
  const [pendingNewCalibration, setPendingNewCalibration] = useState<Partial<Calibration> | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const { show: showToast } = useToast();
  const { data: session } = useSession();
  const createdBy = session?.user?.email ?? session?.user?.name ?? '';
  const idleToastKeyRef = useRef<string | null>(null);

  // Theme-based style helpers
  const getContainerStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl';
      case 'light':
        return 'bg-white border-2 border-blue-200 rounded-xl shadow-lg';
      default:
        return 'bg-gradient-to-r from-zinc-100/90 to-zinc-300/90 dark:from-zinc-800/30 dark:to-zinc-700/40 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700/50';
    }
  };

  const getFieldStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl',
          label: 'text-white/80',
          text: 'text-white',
          input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-teal-400 rounded-xl'
        };
      case 'light':
        return {
          container: 'bg-blue-50 border border-blue-200 rounded-lg',
          label: 'text-blue-900 font-medium',
          text: 'text-gray-900',
          input: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg'
        };
      default:
        return {
          container: 'bg-gray-200 dark:bg-slate-700/50 rounded-md',
          label: 'text-gray-600 dark:text-gray-300',
          text: 'text-gray-900 dark:text-white',
          input: 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-500 focus:ring-2 focus:ring-blue-500 rounded-md'
        };
    }
  };

  const getTextStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return 'text-white';
      case 'light':
        return 'text-gray-900';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  };

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

  const fieldStyles = getFieldStyles();
  
  const [editedCalibration, setEditedCalibration] = useState<Calibration>(() => {
    return {
      calibrationRequired: 'Required',
      idleCalibrationDuration: '',
      idlePeriodFrom: null,
      idlePeriodTo: null,
      calibratedby: '',
      calibrationdate: null as Date | null,
      calibrationtodate: null as Date | null,
      calibrationpo: '',
      calibfile: '',
      calibcertificate: '',
      assetnumber: currentCalibration?.assetnumber ?? '',
      createdby: createdBy,
      createdat: new Date(),
    } as Calibration;
  });

  useEffect(() => {
    if (isEditing && currentCalibration) {
      setEditedCalibration({
        ...currentCalibration,
        calibrationRequired: currentCalibration.calibrationRequired || 'Required',
        idleCalibrationDuration: currentCalibration.idleCalibrationDuration || '',
        idlePeriodFrom: parseCalibrationDate(currentCalibration.idlePeriodFrom),
        idlePeriodTo: parseCalibrationDate(currentCalibration.idlePeriodTo),
        calibrationdate: currentCalibration.calibrationdate 
          ? new Date(currentCalibration.calibrationdate)
          : null,
        calibrationtodate: currentCalibration.calibrationtodate
          ? new Date(currentCalibration.calibrationtodate)
          : null
      });
    }
  }, [isEditing, currentCalibration]);

  useEffect(() => {
    if (isNewMode) {
      setEditedCalibration({
        calibrationRequired: 'Required',
        idleCalibrationDuration: '',
        idlePeriodFrom: null,
        idlePeriodTo: null,
        calibratedby: '',
        calibrationdate: null as Date | null,
        calibrationtodate: null as Date | null,
        calibrationpo: '',
        calibfile: '',
        calibcertificate: '',
        assetnumber: currentCalibration?.assetnumber ?? '',
        createdby: createdBy,
        createdat: new Date(),
      } as Calibration);
      setSelectedValidityPeriod(12);
    }
  }, [isNewMode, currentCalibration?.assetnumber, createdBy]);

  const [selectedValidityPeriod, setSelectedValidityPeriod] = useState(12);

  useEffect(() => {
    fetchCalibrationCompanies();
  }, []);

  useEffect(() => {
    setShowAlert(true);
  }, [currentCalibration?.calibrationtodate]);

  useEffect(() => {
    idleToastKeyRef.current = null;
  }, [assetnumber]);

  useEffect(() => {
    if (!currentCalibration) return;
    const req = currentCalibration.calibrationRequired || 'Required';
    if (req !== 'Required') return;
    if (!isTodayInIdleWindow(currentCalibration.idlePeriodFrom, currentCalibration.idlePeriodTo)) return;
    const key = `${assetnumber}-${String(currentCalibration._id ?? '')}-${String(currentCalibration.idlePeriodFrom)}-${String(currentCalibration.idlePeriodTo)}`;
    if (idleToastKeyRef.current === key) return;
    idleToastKeyRef.current = key;
    showToast({
      title: 'Idle window',
      description: 'Calibration not required in this time window',
      variant: 'success',
    });
  }, [
    assetnumber,
    currentCalibration?._id,
    currentCalibration?.calibrationRequired,
    currentCalibration?.idlePeriodFrom,
    currentCalibration?.idlePeriodTo,
    showToast,
  ]);

  const fetchCalibrationCompanies = async () => {
    try {
      const response = await fetch('/api/calibration-companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const companies = await response.json();
      setCalibrationCompanies(companies);
    } catch (error) {
      console.error('Error fetching calibration companies:', error);
      setError('Failed to load calibration companies');
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not specified';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const calculateValidUntil = (calibrationDate: Date, months: number) => {
    const validUntil = new Date(calibrationDate);
    validUntil.setMonth(validUntil.getMonth() + months);
    return validUntil;
  };
  const handleCalibrationDateChange = (date: Date | null) => {
    setEditedCalibration(prev => {
      const updates = {
        ...prev,
        calibrationdate: date,
        calibrationtodate: date ? calculateValidUntil(date, selectedValidityPeriod) : null
      };
      return updates;
    });
  };

  const handleValidityPeriodChange = (months: number) => {
    setSelectedValidityPeriod(months);
    if (editedCalibration.calibrationdate) {
      setEditedCalibration(prev => ({
        ...prev,
        calibrationtodate: editedCalibration.calibrationdate ? calculateValidUntil(editedCalibration.calibrationdate, months) : null
      }));
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      // Partial saves are allowed: e.g. Required + idle window only, or requirement flag without company/date yet.

      // Calculate changes
      const currentCal = currentCalibration || {} as Calibration;
      const changes = {
        calibrationRequired: editedCalibration.calibrationRequired !== currentCal.calibrationRequired
          ? editedCalibration.calibrationRequired
          : undefined,
        idleCalibrationDuration: editedCalibration.idleCalibrationDuration !== currentCal.idleCalibrationDuration
          ? editedCalibration.idleCalibrationDuration
          : undefined,
        idlePeriod:
          editedCalibration.idlePeriodFrom !== currentCal.idlePeriodFrom ||
          editedCalibration.idlePeriodTo !== currentCal.idlePeriodTo
            ? `${formatDate(editedCalibration.idlePeriodFrom ?? null)} → ${formatDate(editedCalibration.idlePeriodTo ?? null)}`
            : undefined,
        calibratedby: editedCalibration.calibratedby !== currentCal.calibratedby 
          ? editedCalibration.calibratedby 
          : undefined,
        calibrationdate: editedCalibration.calibrationdate !== currentCal.calibrationdate 
          ? formatDate(editedCalibration.calibrationdate)
          : undefined,
        validityPeriod: selectedValidityPeriod !== 12 
          ? `${selectedValidityPeriod} Months`
          : undefined,
        calibrationpo: editedCalibration.calibrationpo !== currentCal.calibrationpo 
          ? editedCalibration.calibrationpo 
          : undefined,
        calibfile: editedCalibration.calibfile !== currentCal.calibfile 
          ? editedCalibration.calibfile 
          : undefined,
        calibcertificate: editedCalibration.calibcertificate !== currentCal.calibcertificate 
          ? editedCalibration.calibcertificate 
          : undefined,
      };
      // Store the changes and show confirmation
      setPendingChanges({
        ...editedCalibration,
        idleCalibrationDuration: editedCalibration.idleCalibrationDuration || '',
        calibrationdate: editedCalibration.calibrationdate || undefined,
        calibrationtodate: editedCalibration.calibrationtodate || undefined
      });
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
      const response = await fetch(`/api/calibrations/${currentCalibration?.assetnumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCalibration),
      });

      if (!response.ok) {
        throw new Error('Failed to update calibration');
      }

      const updatedCalibration = await response.json();
      
      onUpdate(updatedCalibration);
      
      setIsEditing(false);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Failed to update calibration:', error);
      setError(error instanceof Error ? error.message : 'Failed to update calibration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    setIsEditing(false);
    setIsNewMode(true);
  };

  const handleConfirmedNew = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch(`/api/calibrations/${currentCalibration?.assetnumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCalibration),
      });

      if (!response.ok) {
        throw new Error('Failed to create calibration');
      }

      const newCalibration = await response.json();
      onUpdate(newCalibration);
      setIsEditing(false);
      setShowNewConfirmation(false);
      setShowNewForm(false);
    } catch (error) {
      console.error('Failed to create calibration:', error);
      setError(error instanceof Error ? error.message : 'Failed to create calibration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const responsearchive = await fetch(`/api/calibrations/${currentCalibration?.assetnumber}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calibration: currentCalibration,
          reason: archiveReason,
          archivedBy: createdBy,
        }),
      });      

      const responsedelete = await fetch(`/api/calibrations/${currentCalibration?.assetnumber}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calibration: currentCalibration,
          // Replace with actual user
        }),
      }); 

      if (!responsearchive.ok) {
        throw new Error('Failed to archive calibration');
      }

      if (!responsedelete.ok) {
        throw new Error('Failed to delete calibration');
      }

      onUpdate(null); // Clear the calibration from parent
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error('Failed to archive calibration:', error);
      setError(error instanceof Error ? error.message : 'Failed to archive calibration');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEditedCalibration({
      calibrationRequired: 'Required',
      idleCalibrationDuration: '',
      idlePeriodFrom: null,
      idlePeriodTo: null,
      calibratedby: '',
      calibrationdate: null as Date | null,
      calibrationtodate: null as Date | null,
      calibrationpo: '',
      calibfile: '',
      calibcertificate: '',
      assetnumber: currentCalibration?.assetnumber ?? '',
      createdby: createdBy,
      createdat: new Date(),
    } as Calibration);
  };

  console.log('Main component currentCalibration:', currentCalibration);

  // Add this to get asset number from either current calibration or history
  const assetNumber = currentCalibration?.assetnumber || calibrationHistory[0]?.assetnumber || '';

  const handleAlertAcknowledge = () => {
    setShowAlert(false);
  };

  const requirementForLayout =
    isEditing || isNewMode
      ? editedCalibration.calibrationRequired || 'Required'
      : currentCalibration?.calibrationRequired || 'Required';
  const showCalibrationDetailFields = requirementForLayout !== 'Not Required';

  return (
    <div className={`${getContainerStyles()} p-3 w-full max-w-4xl relative`}>
      {/* Always show the alert, even if currentCalibration is null */}
      <CalibrationAlert
        calibrationToDate={currentCalibration?.calibrationtodate ? new Date(currentCalibration.calibrationtodate) : null}
        calibrationRequired={currentCalibration?.calibrationRequired || 'Required'}
        idlePeriodFrom={currentCalibration?.idlePeriodFrom}
        idlePeriodTo={currentCalibration?.idlePeriodTo}
        onAcknowledge={handleAlertAcknowledge}
        showAlert={showAlert}
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-sm font-semibold ${getTextStyles()}`}>
          {isNewMode ? 'New Calibration' : 'Current Calibration'}
        </h2>
        
        <div className="flex gap-2">
          {!isEditing && !isNewMode && (
            <>
              <button
                onClick={() => setShowNewCalibrationModal(true)}
                className={getButtonStyles('blue')}
                title="New Calibration"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              {currentCalibration && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={getButtonStyles('blue')}
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
            </>
          )}
          
          {(isEditing || isNewMode) && (
            <>
              <button
                onClick={() => {
                  if (isNewMode) {
                    setIsNewMode(false);
                  } else {
                    setIsEditing(false);
                  }
                  resetForm();
                }}
                className={getButtonStyles('red')}
                disabled={isSaving}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (isNewMode) {
                    setPendingNewCalibration({
                      ...editedCalibration,
                      calibrationdate: editedCalibration.calibrationdate || undefined,
                      calibrationtodate: editedCalibration.calibrationtodate || undefined
                    });
                    setShowNewConfirmation(true);
                  } else {
                    handleSave();
                  }
                }}
                className={getButtonStyles('green')}
                disabled={isSaving}
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={`absolute top-0 left-0 right-0 ${getErrorStyles()} px-4 py-2 rounded-t-lg text-sm`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className={`${fieldStyles.container} col-span-2 p-2`}>
          <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration Requirement</label>
          {isEditing ? (
            <select
              value={editedCalibration.calibrationRequired || 'Required'}
              onChange={(e) =>
                setEditedCalibration((prev) => {
                  const requirement = e.target.value as 'Required' | 'Not Required';
                  return {
                    ...prev,
                    calibrationRequired: requirement,
                    ...(requirement === 'Not Required'
                      ? {
                          calibratedby: '',
                          calibrationdate: null,
                          calibrationtodate: null,
                          calibrationpo: '',
                          calibfile: '',
                          calibcertificate: '',
                          idlePeriodFrom: null,
                          idlePeriodTo: null,
                          idleCalibrationDuration: ''
                        }
                      : {})
                  };
                })
              }
              className={`w-full text-xs p-2 ${fieldStyles.input}`}
            >
              <option value="Required" className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>Required</option>
              <option value="Not Required" className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>Not Required</option>
            </select>
          ) : (
            <div className={`text-sm ${fieldStyles.text}`}>
              {currentCalibration?.calibrationRequired || 'Required'}
            </div>
          )}
        </div>

        {!showCalibrationDetailFields && (
          <p className={`col-span-2 text-xs ${fieldStyles.label}`}>
            Calibration details are hidden while requirement is &quot;Not Required&quot;. Change requirement to enter certificate data.
          </p>
        )}

        {showCalibrationDetailFields && (
          <>
            <div className={`${fieldStyles.container} col-span-2 p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>
                Idle period (optional) — calibration not expected during this window
              </label>
              {isEditing ? (
                <DatePicker
                  selectsRange
                  startDate={parseCalibrationDate(editedCalibration.idlePeriodFrom) ?? undefined}
                  endDate={parseCalibrationDate(editedCalibration.idlePeriodTo) ?? undefined}
                  onChange={(update) => {
                    if (Array.isArray(update)) {
                      const [start, end] = update;
                      setEditedCalibration((prev) => ({
                        ...prev,
                        idlePeriodFrom: start,
                        idlePeriodTo: end
                      }));
                    }
                  }}
                  isClearable
                  monthsShown={2}
                  placeholderText="Click and drag range (from → to)"
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                  wrapperClassName="w-full"
                  dateFormat="yyyy-MM-dd"
                />
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {(() => {
                    const from = parseCalibrationDate(currentCalibration?.idlePeriodFrom);
                    const to = parseCalibrationDate(currentCalibration?.idlePeriodTo);
                    if (from && to) {
                      return `${from.toLocaleDateString()} → ${to.toLocaleDateString()}`;
                    }
                    if (currentCalibration?.idleCalibrationDuration) {
                      return currentCalibration.idleCalibrationDuration;
                    }
                    return 'Not set';
                  })()}
                </div>
              )}
            </div>

            {/* Calibrated By */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibrated By</label>
              {isEditing ? (
                <select
                  value={editedCalibration.calibratedby || ''}
                  onChange={(e) => setEditedCalibration(prev => ({
                    ...prev,
                    calibratedby: e.target.value
                  }))}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                >
                  <option value="" className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>Select Company</option>
                  {calibrationCompanies.map(company => (
                    <option key={company._id} value={company.name} className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>
                      {company.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCalibration?.calibratedby || 'Not specified'}
                </div>
              )}
            </div>

            {/* Calibration Date */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration Date</label>
              {isEditing ? (
                <DatePicker
                  selected={editedCalibration.calibrationdate}
                  onChange={handleCalibrationDateChange}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                  dateFormat="yyyy-MM-dd"
                />
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {formatDate(currentCalibration?.calibrationdate ?? null)}
                </div>
              )}
            </div>

            {/* Validity Period */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Validity Period</label>
              {isEditing ? (
                <select
                  value={selectedValidityPeriod}
                  onChange={(e) => handleValidityPeriodChange(Number(e.target.value))}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                >
                  {VALIDITY_PERIODS.map(period => (
                    <option key={period.months} value={period.months} className={theme === 'glassmorphic' ? 'bg-[#1a2332]' : ''}>
                      {period.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {`${selectedValidityPeriod} Months`}
                </div>
              )}
            </div>

            {/* Valid Until */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Valid Until</label>
              <div className={`text-sm ${fieldStyles.text}`}>
                {currentCalibration?.calibrationtodate 
                  ? new Date(currentCalibration.calibrationtodate).toLocaleDateString() 
                  : '-'}
              </div>
            </div>

            {/* Calibration PO */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration PO</label>
              {isEditing ? (  
                <input
                  type="text"
                  value={editedCalibration.calibrationpo || ''}
                  onChange={(e) => setEditedCalibration(prev => ({
                    ...prev,
                    calibrationpo: e.target.value
                  }))}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                />
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCalibration?.calibrationpo || 'Not specified'}
                </div>
              )}
            </div>

            {/* Calibration File */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration File</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCalibration.calibfile || ''}
                  onChange={(e) => setEditedCalibration(prev => ({
                    ...prev,
                    calibfile: e.target.value
                  }))}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                />
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCalibration?.calibfile || 'Not specified'}
                </div>
              )}
            </div>

            {/* Calibration certificate */}
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration Certificate</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedCalibration.calibcertificate || ''}
                  onChange={(e) => setEditedCalibration(prev => ({
                    ...prev,
                    calibcertificate: e.target.value
                  }))}
                  className={`w-full text-xs p-2 ${fieldStyles.input}`}
                />
              ) : (
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCalibration?.calibcertificate || 'Not specified'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* History Section */}
      <div className={`mt-6 border-t ${theme === 'glassmorphic' ? 'border-white/20' : theme === 'light' ? 'border-blue-200' : 'border-gray-200 dark:border-slate-600/80'} pt-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-semibold ${getTextStyles()}`}>Calibration History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs transition-colors ${
              theme === 'glassmorphic'
                ? 'text-teal-400 hover:text-teal-300'
                : theme === 'light'
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
          >
            {showHistory ? 'Hide History' : `Show History (${calibrationHistory.length} previous records)`}
          </button>
        </div>

        {showHistory && calibrationHistory.length > 0 && (
          <div className="space-y-2">
            {calibrationHistory.map((record) => (
              <div 
                key={record._id}
                className={`${fieldStyles.container} p-2 shadow-md`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibrated By</label>
                    <div className={`text-sm ${fieldStyles.text}`}>{record.calibratedby}</div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Calibration Date</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.calibrationdate ? new Date(record.calibrationdate).toLocaleDateString() : '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Valid Until</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.calibrationtodate ? new Date(record.calibrationtodate).toLocaleDateString() : '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>PO Number</label>
                    <div className={`text-sm ${fieldStyles.text}`}>{record.calibrationpo || '-'}</div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Certificate</label>
                    <div className={`text-sm ${fieldStyles.text}`}>{record.calibcertificate || '-'}</div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>File Reference</label>
                    <div className={`text-sm ${fieldStyles.text}`}>{record.calibfile || '-'}</div>
                  </div>

                  <div className="col-span-2">
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Created By</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.createdby}
                      <span className={`text-xs ml-2 ${theme === 'glassmorphic' ? 'text-white/60' : theme === 'light' ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        on {new Date(record.createdat).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmedSave}
        onCancel={() => setShowConfirmation(false)}
        isSaving={isSaving}
        theme={theme}
        changes={{
          calibrationRequired: pendingChanges?.calibrationRequired !== currentCalibration?.calibrationRequired
            ? pendingChanges?.calibrationRequired
            : undefined,
          idleCalibrationDuration: pendingChanges?.idleCalibrationDuration !== currentCalibration?.idleCalibrationDuration
            ? pendingChanges?.idleCalibrationDuration
            : undefined,
          idlePeriod:
            pendingChanges?.idlePeriodFrom !== currentCalibration?.idlePeriodFrom ||
            pendingChanges?.idlePeriodTo !== currentCalibration?.idlePeriodTo
              ? `${formatDate(pendingChanges?.idlePeriodFrom ?? null)} → ${formatDate(pendingChanges?.idlePeriodTo ?? null)}`
              : undefined,
          calibratedby: pendingChanges?.calibratedby !== currentCalibration?.calibratedby 
            ? pendingChanges?.calibratedby 
            : undefined,
          calibrationdate: pendingChanges?.calibrationdate !== currentCalibration?.calibrationdate 
            ? pendingChanges?.calibrationdate?.toISOString()
            : undefined,
          validityPeriod: selectedValidityPeriod !== 12 
            ? `${selectedValidityPeriod} Months`
            : undefined,
          calibrationpo: pendingChanges?.calibrationpo !== currentCalibration?.calibrationpo 
            ? pendingChanges?.calibrationpo 
            : undefined,
          calibfile: pendingChanges?.calibfile !== currentCalibration?.calibfile 
            ? pendingChanges?.calibfile 
            : undefined,
          calibcertificate: pendingChanges?.calibcertificate !== currentCalibration?.calibcertificate 
            ? pendingChanges?.calibcertificate 
            : undefined,
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (() => {
        const getDeleteModalStyles = () => {
          switch (theme) {
            case 'glassmorphic':
              return {
                container: 'bg-white/10 backdrop-blur-lg border border-white/20',
                text: 'text-white',
                textSecondary: 'text-white/80',
                input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70',
                buttonPrimary: 'bg-red-500 hover:bg-red-600',
                buttonSecondary: 'bg-white/10 hover:bg-white/20 border border-white/20'
              };
            case 'light':
              return {
                container: 'bg-white border-2 border-blue-200',
                text: 'text-gray-900',
                textSecondary: 'text-gray-700',
                input: 'bg-white border-2 border-blue-300 text-gray-900 placeholder-gray-500',
                buttonPrimary: 'bg-red-500 hover:bg-red-600',
                buttonSecondary: 'bg-gray-200 hover:bg-gray-300'
              };
            default:
              return {
                container: 'bg-slate-800',
                text: 'text-zinc-100',
                textSecondary: 'text-zinc-300',
                input: 'bg-slate-700/50 text-zinc-100 border-0 ring-1 ring-slate-600',
                buttonPrimary: 'bg-red-600 hover:bg-red-700',
                buttonSecondary: 'bg-slate-600 hover:bg-slate-700'
              };
          }
        };
        const deleteModalStyles = getDeleteModalStyles();
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center pt-4 sm:pt-8 px-4 overflow-y-auto">
            <div className={`${deleteModalStyles.container} rounded-lg shadow-xl p-6 max-w-2xl w-full mb-4`}>
              <h3 className={`text-lg font-semibold ${deleteModalStyles.text} mb-4`}>Delete Calibration Record</h3>
              <p className={`text-sm ${deleteModalStyles.textSecondary} mb-4`}>
                This action will archive the calibration record. Please provide a reason:
              </p>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className={`w-full text-sm rounded-xl p-2 mb-4 ${deleteModalStyles.input}`}
                placeholder="Reason for deletion..."
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={!archiveReason.trim() || isSaving}
                  className={`flex-1 ${deleteModalStyles.buttonPrimary} disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
                >
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isSaving}
                  className={`flex-1 ${deleteModalStyles.buttonSecondary} disabled:opacity-50 ${theme === 'glassmorphic' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'} px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add New Confirmation Modal */}
      <NewCalibrationModal
        isOpen={showNewConfirmation}
        onConfirm={handleConfirmedNew}
        onCancel={() => setShowNewConfirmation(false)}
        isSaving={isSaving}
        calibration={pendingNewCalibration}
      />

      {/* New Calibration Modal */}
      <NewCalibrationFormModal
        isOpen={showNewCalibrationModal}
        onClose={() => setShowNewCalibrationModal(false)}
        onSave={(newCalibration) => {
          console.log('Opening modal with asset number:', assetnumber);
          onUpdate(newCalibration);
          setShowNewCalibrationModal(false);
        }}
        assetnumber={assetnumber}
      />
    </div>
  );
}

function NewCalibrationModal({ isOpen, onConfirm, onCancel, isSaving, calibration }: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
  calibration: Partial<Calibration> | null;
}) {
  if (!isOpen || !calibration) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center pt-4 sm:pt-8 px-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mb-4">
        <div className="flex items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Add New Calibration</h3>
            <div className="text-sm text-zinc-300 space-y-2">
              <p>Are you sure you want to add this calibration?</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li>Calibration Requirement: {calibration.calibrationRequired || 'Required'}</li>
                {(calibration.idlePeriodFrom || calibration.idlePeriodTo) && (
                  <li>
                    Idle window:{' '}
                    {calibration.idlePeriodFrom instanceof Date
                      ? calibration.idlePeriodFrom.toLocaleDateString()
                      : String(calibration.idlePeriodFrom ?? '')}{' '}
                    →{' '}
                    {calibration.idlePeriodTo instanceof Date
                      ? calibration.idlePeriodTo.toLocaleDateString()
                      : String(calibration.idlePeriodTo ?? '')}
                  </li>
                )}
                <li>Calibrated By: {calibration.calibratedby}</li>
                <li>Date: {calibration.calibrationdate?.toLocaleDateString()}</li>
                <li>Valid Until: {calibration.calibrationtodate?.toLocaleDateString()}</li>
                {calibration.calibrationpo && <li>PO: {calibration.calibrationpo}</li>}
              </ul>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner />
                    <span>Adding...</span>
                  </>
                ) : (
                  'Add Calibration'
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isSaving}
                className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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

interface NewCalibrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (calibration: Calibration) => void;
  assetnumber: string;
}

function NewCalibrationFormModal({ isOpen, onClose, onSave, assetnumber }: NewCalibrationFormModalProps) {
  console.log('Modal received assetnumber:', assetnumber);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibrationCompanies, setCalibrationCompanies] = useState<CalibrationCompany[]>([]);
  const [selectedValidityPeriod, setSelectedValidityPeriod] = useState(12);
  const [newCalibration, setNewCalibration] = useState<Calibration>(() => ({
    calibrationRequired: 'Required',
    idleCalibrationDuration: '',
    idlePeriodFrom: null,
    idlePeriodTo: null,
    calibratedby: '',
    calibrationdate: null,
    calibrationtodate: null,
    calibrationpo: '',
    calibfile: '',
    calibcertificate: '',
    assetnumber: assetnumber,
    createdby: '',
    createdat: new Date(),
  } as Calibration));

  const showModalDetailFields = newCalibration.calibrationRequired !== 'Not Required';

  useEffect(() => {
    console.log('Asset number changed in modal:', assetnumber);
    setNewCalibration(prev => ({
      ...prev,
      assetnumber: assetnumber
    }));
  }, [assetnumber]);

  const { data: session } = useSession();
  const createdBy = session?.user?.email ?? session?.user?.name ?? '';

  useEffect(() => {
    setNewCalibration((prev) => ({
      ...prev,
      createdby: createdBy,
    }));
  }, [createdBy]);

  useEffect(() => {
    if (isOpen) {
      fetchCalibrationCompanies();
    }
  }, [isOpen]);

  const fetchCalibrationCompanies = async () => {
    try {
      const response = await fetch('/api/calibration-companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const companies = await response.json();
      setCalibrationCompanies(companies);
    } catch (error) {
      console.error('Error fetching calibration companies:', error);
      setError('Failed to load calibration companies');
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving calibration with assetnumber:', newCalibration.assetnumber);
      setError(null);

      const normalizedCalibration = {
        ...newCalibration,
        calibratedby: newCalibration.calibrationRequired === 'Not Required' ? '' : (newCalibration.calibratedby ?? ''),
        calibrationdate: newCalibration.calibrationRequired === 'Not Required' ? null : newCalibration.calibrationdate,
        calibrationtodate: newCalibration.calibrationRequired === 'Not Required' ? null : newCalibration.calibrationtodate,
        calibrationpo: newCalibration.calibrationRequired === 'Not Required' ? '' : newCalibration.calibrationpo,
        calibfile: newCalibration.calibrationRequired === 'Not Required' ? '' : newCalibration.calibfile,
        calibcertificate: newCalibration.calibrationRequired === 'Not Required' ? '' : newCalibration.calibcertificate,
        idlePeriodFrom: newCalibration.calibrationRequired === 'Not Required' ? null : newCalibration.idlePeriodFrom,
        idlePeriodTo: newCalibration.calibrationRequired === 'Not Required' ? null : newCalibration.idlePeriodTo,
        idleCalibrationDuration:
          newCalibration.calibrationRequired === 'Not Required' ? '' : newCalibration.idleCalibrationDuration
      };

      const calibrationWithAssetNumber = {
        ...normalizedCalibration,
        assetnumber: normalizedCalibration.assetnumber
      };

      console.log('Final payload:', calibrationWithAssetNumber);

      setIsSaving(true);
      const response = await fetch(`/api/calibrations/${newCalibration.assetnumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calibrationWithAssetNumber),
      });

      if (!response.ok) {
        throw new Error('Failed to create calibration');
      }

      const savedCalibration = await response.json();
      onSave(savedCalibration);
    } catch (error) {
      console.error('Failed to create calibration:', error);
      setError(error instanceof Error ? error.message : 'Failed to create calibration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center pt-4 sm:pt-8 px-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mb-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">New Calibration</h3>
        
        {error && (
          <div className="bg-red-500/20 text-red-100 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Calibration Requirement
            </label>
            <select
              value={newCalibration.calibrationRequired || 'Required'}
              onChange={(e) => {
                const v = e.target.value as 'Required' | 'Not Required';
                setNewCalibration((prev) => ({
                  ...prev,
                  calibrationRequired: v,
                  ...(v === 'Not Required'
                    ? {
                        calibratedby: '',
                        calibrationdate: null,
                        calibrationtodate: null,
                        calibrationpo: '',
                        calibfile: '',
                        calibcertificate: '',
                        idlePeriodFrom: null,
                        idlePeriodTo: null,
                        idleCalibrationDuration: ''
                      }
                    : {})
                }));
              }}
              className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
            >
              <option value="Required">Required</option>
              <option value="Not Required">Not Required</option>
            </select>
          </div>

          {!showModalDetailFields && (
            <p className="text-xs text-zinc-400">
              Other calibration fields are hidden while requirement is &quot;Not Required&quot;.
            </p>
          )}

          {showModalDetailFields && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Idle period (optional) — click range (from → to)
                </label>
                <DatePicker
                  selectsRange
                  startDate={parseCalibrationDate(newCalibration.idlePeriodFrom) ?? undefined}
                  endDate={parseCalibrationDate(newCalibration.idlePeriodTo) ?? undefined}
                  onChange={(update) => {
                    if (Array.isArray(update)) {
                      const [start, end] = update;
                      setNewCalibration((prev) => ({
                        ...prev,
                        idlePeriodFrom: start,
                        idlePeriodTo: end
                      }));
                    }
                  }}
                  isClearable
                  monthsShown={2}
                  placeholderText="Select idle window"
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                  wrapperClassName="w-full"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Calibrated By
                </label>
                <select
                  value={newCalibration.calibratedby}
                  onChange={(e) => setNewCalibration(prev => ({
                    ...prev,
                    calibratedby: e.target.value
                  }))}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                >
                  <option value="">Select Company</option>
                  {calibrationCompanies.map(company => (
                    <option key={company._id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Calibration Date
                </label>
                <DatePicker
                  selected={newCalibration.calibrationdate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const validUntil = new Date(date);
                      validUntil.setMonth(validUntil.getMonth() + selectedValidityPeriod);
                      setNewCalibration(prev => ({
                        ...prev,
                        calibrationdate: date,
                        calibrationtodate: validUntil
                      }));
                    }
                  }}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Validity Period
                </label>
                <select
                  value={selectedValidityPeriod}
                  onChange={(e) => {
                    const months = Number(e.target.value);
                    setSelectedValidityPeriod(months);
                    if (newCalibration.calibrationdate) {
                      const validUntil = new Date(newCalibration.calibrationdate);
                      validUntil.setMonth(validUntil.getMonth() + months);
                      setNewCalibration(prev => ({
                        ...prev,
                        calibrationtodate: validUntil
                      }));
                    }
                  }}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                >
                  {VALIDITY_PERIODS.map(period => (
                    <option key={period.months} value={period.months}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Valid Until
                </label>
                <DatePicker
                  selected={newCalibration.calibrationtodate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setNewCalibration(prev => ({
                        ...prev,
                        calibrationtodate: date
                      }));
                    }
                  }}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                  dateFormat="yyyy-MM-dd"
                  minDate={newCalibration.calibrationdate || undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Calibration PO
                </label>
                <input
                  type="text"
                  value={newCalibration.calibrationpo}
                  onChange={(e) => setNewCalibration(prev => ({
                    ...prev,
                    calibrationpo: e.target.value
                  }))}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Calibration Certificate
                </label>
                <input
                  type="text"
                  value={newCalibration.calibcertificate}
                  onChange={(e) => setNewCalibration(prev => ({
                    ...prev,
                    calibcertificate: e.target.value
                  }))}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                  placeholder="Enter certificate number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Calibration File
                </label>
                <input
                  type="text"
                  value={newCalibration.calibfile}
                  onChange={(e) => setNewCalibration(prev => ({
                    ...prev,
                    calibfile: e.target.value
                  }))}
                  className="w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2"
                  placeholder="Enter file reference"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                <span>Saving...</span>
              </>
            ) : (
              'Save'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}