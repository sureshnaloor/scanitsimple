'use client';
import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Custody, Employee, Project } from '@/types/custody';
import DatePicker from 'react-datepicker';
import AsyncSelect from 'react-select/async';
import Link from 'next/link';

import type { Theme } from '@/app/components/AssetDetails';
import CustodyLocationFields from '@/app/components/CustodyLocationFields';
import type { CustodyLocationType } from '@/lib/custodyLocation';
import { displayCustodyLocationType, normalizeCustodyLocationType } from '@/lib/custodyLocation';

interface CustodyDetailsProps {
  currentCustody: Custody | null;
  custodyHistory: Custody[];
  onUpdate: (updatedCustody: Custody | null) => void;
  assetnumber: string;
  theme?: Theme;
  /** Full URL path for “new custody” page; default is fixed-asset flow */
  custodyNewHref?: string;
}

function custodyCityDisplay(c: Custody): string {
  const t = String(c.locationType || '');
  if (c.custodyCity?.trim()) return c.custodyCity.trim();
  if (t === 'warehouse' && c.warehouseCity) return String(c.warehouseCity);
  if ((t === 'department' || t === 'camp/office' || t === 'project_site') && c.departmentLocation) {
    return String(c.departmentLocation);
  }
  return '—';
}

function premisesDisplay(c: Custody): string {
  if (c.premisesLabel?.trim()) return c.premisesLabel.trim();
  if (c.location?.trim()) return c.location.trim();
  if (c.locationType === 'warehouse' && c.warehouseLocation?.trim()) return c.warehouseLocation.trim();
  return '—';
}

function floorRoomDisplay(c: Custody): string {
  if (c.floorRoom?.trim()) return c.floorRoom.trim();
  if (c.locationType === 'camp/office' && c.campOfficeLocation?.trim()) return c.campOfficeLocation.trim();
  return '—';
}

function warehouseRackDisplay(c: Custody): string {
  if (c.rackBinPallet?.trim()) return c.rackBinPallet.trim();
  if (c.locationType === 'warehouse' && c.warehouseLocation?.trim()) return c.warehouseLocation.trim();
  return '—';
}

function warehouseShedDisplay(c: Custody): string {
  if (c.shedRoomNumber?.trim()) return c.shedRoomNumber.trim();
  return '—';
}

function parseLegacyProjectField(project?: string): { wbs: string; name: string } {
  if (!project?.trim()) return { wbs: '', name: '' };
  const s = project.trim();
  const idx = s.indexOf(' - ');
  if (idx === -1) return { wbs: s, name: '' };
  return { wbs: s.slice(0, idx).trim(), name: s.slice(idx + 3).trim() };
}

export default function CustodyDetails({
  currentCustody,
  custodyHistory,
  onUpdate,
  assetnumber,
  theme = 'default',
  custodyNewHref,
}: CustodyDetailsProps) {
  const newCustodyLink = custodyNewHref ?? `/fixedasset/${assetnumber}/custody/new`;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showErrorCorrectionModal, setShowErrorCorrectionModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [warehouseCityNames, setWarehouseCityNames] = useState<string[]>([]);
  const [departmentCityNames, setDepartmentCityNames] = useState<string[]>([]);
  const [locationCitiesLoaded, setLocationCitiesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/location-cities')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setWarehouseCityNames((data.warehouse || []).map((x: { name: string }) => x.name));
        setDepartmentCityNames((data.department || []).map((x: { name: string }) => x.name));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLocationCitiesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Theme-based style helpers
  const getContainerStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl';
      case 'light':
        return 'bg-white border-2 border-blue-200 rounded-xl shadow-lg';
      default:
        return 'bg-stone-100/90 dark:bg-stone-800/30 backdrop-blur-sm rounded-lg shadow-lg border border-stone-200 dark:border-stone-700/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]';
    }
  };

  const getFieldStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          container: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-xl',
          label: 'text-white/80',
          text: 'text-white'
        };
      case 'light':
        return {
          container: 'bg-blue-50 border border-blue-200 rounded-lg',
          label: 'text-blue-900 font-medium',
          text: 'text-gray-900'
        };
      default:
        return {
          container: 'bg-gray-200 dark:bg-slate-700/50 rounded-md',
          label: 'text-gray-600 dark:text-gray-300',
          text: 'text-gray-900 dark:text-white'
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

  const getButtonStyles = (color: 'blue') => {
    const baseStyles = 'p-1 transition-colors';
    switch (theme) {
      case 'glassmorphic':
        return `${baseStyles} text-teal-400 hover:text-teal-300`;
      case 'light':
        return `${baseStyles} text-blue-600 hover:text-blue-700`;
      default:
        return `${baseStyles} text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300`;
    }
  };

  const fieldStyles = getFieldStyles();

  // Simple Edit Modal Component
  const EditCustodyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !currentCustody) return null;

    const getModalStyles = () => {
      switch (theme) {
        case 'glassmorphic':
          return {
            container: 'bg-white/10 backdrop-blur-lg border border-white/20',
            text: 'text-white',
            textSecondary: 'text-white/80',
            input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
            buttonPrimary: 'bg-teal-500 hover:bg-teal-600',
            buttonSecondary: 'bg-white/10 hover:bg-white/20 border border-white/20'
          };
        case 'light':
          return {
            container: 'bg-white border-2 border-blue-200',
            text: 'text-gray-900',
            textSecondary: 'text-gray-700',
            input: 'bg-white border-2 border-blue-300 text-gray-900',
            buttonPrimary: 'bg-blue-500 hover:bg-blue-600',
            buttonSecondary: 'bg-gray-200 hover:bg-gray-300'
          };
        default:
          return {
            container: 'bg-slate-800',
            text: 'text-zinc-100',
            textSecondary: 'text-zinc-300',
            input: 'bg-slate-700/50 text-zinc-100 border-0 ring-1 ring-slate-600',
            buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
            buttonSecondary: 'bg-slate-600 hover:bg-slate-700'
          };
      }
    };

    const modalStyles = getModalStyles();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
        <div className={`${modalStyles.container} rounded-lg shadow-xl p-6 max-w-md w-full mx-4`}>
          <h3 className={`text-lg font-semibold ${modalStyles.text} mb-4`}>End Current Custody</h3>
          
          {error && (
            <div className={`${theme === 'glassmorphic' ? 'bg-red-500/20 text-red-300' : theme === 'light' ? 'bg-red-50 text-red-700' : 'bg-red-500/20 text-red-100'} px-4 py-2 rounded-lg text-sm mb-4`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${modalStyles.textSecondary} mb-1`}>
                End Date <span className={theme === 'glassmorphic' ? 'text-red-400' : theme === 'light' ? 'text-red-600' : 'text-red-400'}>*</span>
              </label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                className={`w-full text-sm rounded-xl p-2 ${modalStyles.input}`}
                dateFormat="yyyy-MM-dd"
                minDate={new Date(currentCustody.custodyfrom)}
                maxDate={new Date()}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={async () => {
                try {
                  if (!endDate) {
                    setError('End date is required');
                    return;
                  }
                  setIsSaving(true);
                  
                  const response = await fetch(`/api/custody/${assetnumber}/${currentCustody._id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      ...currentCustody,
                      custodyto: endDate
                    }),
                  });

                  if (!response.ok) throw new Error('Failed to update custody record');
                  
                  const updatedCustody = await response.json();
                  onUpdate(updatedCustody);
                  onClose();
                } catch (error) {
                  console.error('Error updating custody:', error);
                  setError('Failed to update custody record');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className={`flex-1 ${modalStyles.buttonPrimary} disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`flex-1 ${modalStyles.buttonSecondary} disabled:opacity-50 ${theme === 'glassmorphic' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'} px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error-correction modal: city + premises from master; floor/occupant/remark free text
  const ErrorCorrectionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [locationType, setLocationType] = useState<CustodyLocationType>('warehouse');
    const [custodyCity, setCustodyCity] = useState('');
    const [premisesId, setPremisesId] = useState('');
    const [premisesLabel, setPremisesLabel] = useState('');
    const [floorRoom, setFloorRoom] = useState('');
    const [occupant, setOccupant] = useState('');
    const [custodyRemark, setCustodyRemark] = useState('');
    const [rackBinPallet, setRackBinPallet] = useState('');
    const [shedRoomNumber, setShedRoomNumber] = useState('');
    const [custodianDetail, setCustodianDetail] = useState('');
    const [containerNumberRack, setContainerNumberRack] = useState('');
    const [projectWbs, setProjectWbs] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const onPremisesChange = useCallback((id: string, label: string) => {
      setPremisesId(id);
      setPremisesLabel(label);
    }, []);

    useEffect(() => {
      if (!isOpen || !currentCustody) return;
      const lt = normalizeCustodyLocationType(currentCustody.locationType);
      setLocationType(lt);
      const cityRaw =
        currentCustody.custodyCity?.trim() ||
        (String(currentCustody.locationType) === 'warehouse'
          ? currentCustody.warehouseCity
          : currentCustody.departmentLocation);
      setCustodyCity(cityRaw ? String(cityRaw) : '');
      setPremisesId(currentCustody.premisesId ?? '');
      setPremisesLabel(currentCustody.premisesLabel ?? '');
      setFloorRoom(currentCustody.floorRoom ?? '');
      setOccupant(currentCustody.occupant ?? '');
      setCustodyRemark(currentCustody.custodyRemark ?? '');
      setRackBinPallet(currentCustody.rackBinPallet ?? '');
      setShedRoomNumber(currentCustody.shedRoomNumber ?? '');
      setCustodianDetail(currentCustody.custodianDetail ?? '');
      setContainerNumberRack(currentCustody.containerNumberRack ?? '');
      const parsed = parseLegacyProjectField(currentCustody.project);
      setProjectWbs(parsed.wbs);
      setProjectName(currentCustody.projectname ?? parsed.name);
      setErr(null);
    }, [isOpen, currentCustody]);

    useEffect(() => {
      if (isOpen) {
        fetch('/api/projects')
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => setProjects(Array.isArray(data) ? data : []))
          .catch(() => setProjects([]));
      }
    }, [isOpen]);

    const handleLocationTypeChange = (t: CustodyLocationType) => {
      setLocationType(t);
      const list = t === 'warehouse' ? warehouseCityNames : departmentCityNames;
      const nextCity =
        custodyCity && list.includes(custodyCity) ? custodyCity : (list[0] ?? '');
      setCustodyCity(nextCity);
      setPremisesId('');
      setPremisesLabel('');
      setFloorRoom('');
      setOccupant('');
      setCustodyRemark('');
      setRackBinPallet('');
      setShedRoomNumber('');
      setCustodianDetail('');
      setContainerNumberRack('');
      setProjectWbs('');
      setProjectName('');
    };

    if (!isOpen || !currentCustody || !currentCustody._id) return null;

    const getModalStyles = () => {
      switch (theme) {
        case 'glassmorphic':
          return {
            container: 'bg-white/10 backdrop-blur-lg border border-white/20',
            text: 'text-white',
            textSecondary: 'text-white/80',
            input: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
            select: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
            buttonPrimary: 'bg-teal-500 hover:bg-teal-600',
            buttonSecondary: 'bg-white/10 hover:bg-white/20 border border-white/20',
          };
        case 'light':
          return {
            container: 'bg-white border-2 border-blue-200',
            text: 'text-gray-900',
            textSecondary: 'text-gray-700',
            input: 'bg-white border-2 border-blue-300 text-gray-900',
            select: 'bg-white border-2 border-blue-300 text-gray-900',
            buttonPrimary: 'bg-blue-500 hover:bg-blue-600',
            buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
          };
        default:
          return {
            container: 'bg-slate-800',
            text: 'text-zinc-100',
            textSecondary: 'text-zinc-300',
            input: 'bg-slate-700/50 text-zinc-100 border-0 ring-1 ring-slate-600',
            select: 'bg-slate-700/50 text-zinc-100 border-0 ring-1 ring-slate-600',
            buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
            buttonSecondary: 'bg-slate-600 hover:bg-slate-700',
          };
      }
    };

    const modalStyles = getModalStyles();

    const locFieldClassNames =
      theme === 'light'
        ? {
            input: 'w-full text-sm rounded-xl p-2 bg-white border-2 border-blue-300 text-gray-900',
            label: `block text-sm font-medium ${modalStyles.textSecondary} mb-1`,
            hint: 'text-sm text-gray-600',
          }
        : theme === 'glassmorphic'
          ? {
              input:
                'w-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm rounded-xl p-2 placeholder-white/50',
              label: `block text-sm font-medium ${modalStyles.textSecondary} mb-1`,
              hint: 'text-sm text-white/70',
            }
          : undefined;

    const handleSave = async () => {
      setErr(null);
      if (locationType !== 'project_site' && !custodyCity.trim()) {
        setErr('City is required');
        return;
      }
      if (
        (locationType === 'warehouse' || locationType === 'camp/office') &&
        !premisesId.trim()
      ) {
        setErr('Select a premises location from the master list');
        return;
      }
      if (locationType === 'project_site' && !projectWbs.trim()) {
        setErr('Project is required for project site');
        return;
      }

      setIsSaving(true);
      try {
        const payload: Record<string, unknown> = {
          locationType,
          custodyCity: custodyCity.trim() || null,
          premisesId: locationType === 'project_site' ? null : premisesId || null,
          premisesLabel:
            locationType === 'project_site' ? null : premisesLabel.trim() || null,
          floorRoom: locationType === 'camp/office' ? floorRoom.trim() || null : null,
          occupant: locationType === 'camp/office' ? occupant.trim() || null : null,
          custodyRemark:
            locationType === 'camp/office' || locationType === 'project_site'
              ? custodyRemark.trim() || null
              : null,
          rackBinPallet: locationType === 'warehouse' ? rackBinPallet.trim() || null : null,
          shedRoomNumber: locationType === 'warehouse' ? shedRoomNumber.trim() || null : null,
          custodianDetail: locationType === 'project_site' ? custodianDetail.trim() || null : null,
          containerNumberRack: locationType === 'project_site' ? containerNumberRack.trim() || null : null,
          warehouseCity: locationType === 'warehouse' ? custodyCity.trim() : null,
          warehouseLocation: null,
          departmentLocation: null,
          campOfficeLocation: null,
          location:
            locationType === 'project_site' ? null : premisesLabel.trim() || null,
          project:
            locationType === 'project_site'
              ? [projectWbs, projectName].filter(Boolean).join(' - ') || null
              : null,
          projectname: locationType === 'project_site' ? projectName.trim() || null : null,
        };

        const response = await fetch(`/api/custody/${assetnumber}/${currentCustody._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update custody record');
        const updated = await response.json();
        onUpdate(updated);
        onClose();
      } catch (e) {
        console.error(e);
        setErr('Failed to update custody record');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div
          className={`${modalStyles.container} rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
        >
          <h3 className={`text-lg font-semibold ${modalStyles.text} mb-4`}>
            Correct location (error correction)
          </h3>
          {err && (
            <div
              className={`${
                theme === 'glassmorphic'
                  ? 'bg-red-500/20 text-red-300'
                  : theme === 'light'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-red-500/20 text-red-100'
              } px-4 py-2 rounded-lg text-sm mb-4`}
            >
              {err}
            </div>
          )}

          <CustodyLocationFields
            variant={theme === 'glassmorphic' ? 'page' : 'modal'}
            classNames={locFieldClassNames}
            locationType={locationType}
            onLocationTypeChange={handleLocationTypeChange}
            custodyCity={custodyCity}
            onCustodyCityChange={setCustodyCity}
            premisesId={premisesId}
            onPremisesChange={onPremisesChange}
            floorRoom={floorRoom}
            onFloorRoomChange={setFloorRoom}
            occupant={occupant}
            onOccupantChange={setOccupant}
            custodyRemark={custodyRemark}
            onCustodyRemarkChange={setCustodyRemark}
            rackBinPallet={rackBinPallet}
            onRackBinPalletChange={setRackBinPallet}
            shedRoomNumber={shedRoomNumber}
            onShedRoomNumberChange={setShedRoomNumber}
            custodianDetail={custodianDetail}
            onCustodianDetailChange={setCustodianDetail}
            containerNumberRack={containerNumberRack}
            onContainerNumberRackChange={setContainerNumberRack}
            warehouseCityNames={warehouseCityNames}
            departmentCityNames={departmentCityNames}
            locationCitiesLoaded={locationCitiesLoaded}
            projects={projects}
            projectWbs={projectWbs}
            projectName={projectName}
            onProjectChange={(wbs, pname) => {
              setProjectWbs(wbs);
              setProjectName(pname);
            }}
          />

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 ${modalStyles.buttonPrimary} disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`flex-1 ${modalStyles.buttonSecondary} disabled:opacity-50 ${
                theme === 'glassmorphic' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
              } px-4 py-2 rounded-xl text-sm font-medium transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Check if new custody can be created
  const canCreateNewCustody = !currentCustody || currentCustody.custodyto !== null;

  return (
    <div className={`${getContainerStyles()} p-3 w-full max-w-4xl relative`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-sm font-semibold ${getTextStyles()}`}>Current Custody</h2>
        <div className="flex gap-2">
          {canCreateNewCustody && (
            <Link
              href={newCustodyLink}
              className={getButtonStyles('blue')}
              title="New Custody Record"
            >
              <PlusIcon className="h-5 w-5" />
            </Link>
          )}
          {currentCustody && !currentCustody.custodyto && (
            <>
              <button
                onClick={() => setShowErrorCorrectionModal(true)}
                className={getButtonStyles('blue')}
                title="Correct location (error correction)"
              >
                <WrenchScrewdriverIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className={getButtonStyles('blue')}
                title="End Current Custody"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Display Current Custody */}
      {currentCustody && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Employee */}
          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>Employee</label>
            <div className={`text-sm ${fieldStyles.text}`}>
              {currentCustody.employeename} ({currentCustody.employeenumber})
            </div>
          </div>

          {/* Location Type */}
          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>Location Type</label>
            <div className={`text-sm ${fieldStyles.text}`}>
              {displayCustodyLocationType(currentCustody.locationType)}
            </div>
          </div>

          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>
              {normalizeCustodyLocationType(currentCustody.locationType) === 'project_site'
                ? 'City (record)'
                : 'City'}
            </label>
            <div className={`text-sm ${fieldStyles.text}`}>{custodyCityDisplay(currentCustody)}</div>
          </div>

          {normalizeCustodyLocationType(currentCustody.locationType) !== 'project_site' && (
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Location (premises)</label>
              <div className={`text-sm ${fieldStyles.text}`}>{premisesDisplay(currentCustody)}</div>
            </div>
          )}

          {(normalizeCustodyLocationType(currentCustody.locationType) === 'project_site' ||
            currentCustody.locationType === 'department') && (
            <div className={`${fieldStyles.container} p-2`}>
              <label className={`block text-xs font-medium ${fieldStyles.label}`}>Project</label>
              <div className={`text-sm ${fieldStyles.text}`}>
                {currentCustody.project || '—'}
                {currentCustody.projectname ? ` (${currentCustody.projectname})` : ''}
              </div>
            </div>
          )}

          {normalizeCustodyLocationType(currentCustody.locationType) === 'warehouse' && (
            <>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Rack / bin / pallet</label>
                <div className={`text-sm ${fieldStyles.text}`}>{warehouseRackDisplay(currentCustody)}</div>
              </div>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Shed / room number</label>
                <div className={`text-sm ${fieldStyles.text}`}>{warehouseShedDisplay(currentCustody)}</div>
              </div>
            </>
          )}

          {normalizeCustodyLocationType(currentCustody.locationType) === 'camp/office' && (
            <>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Floor / room</label>
                <div className={`text-sm ${fieldStyles.text}`}>{floorRoomDisplay(currentCustody)}</div>
              </div>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Occupant</label>
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCustody.occupant?.trim() ? currentCustody.occupant : '—'}
                </div>
              </div>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Remark</label>
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCustody.custodyRemark?.trim() ? currentCustody.custodyRemark : '—'}
                </div>
              </div>
            </>
          )}

          {normalizeCustodyLocationType(currentCustody.locationType) === 'project_site' && (
            <>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Custodian detail</label>
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCustody.custodianDetail?.trim() ? currentCustody.custodianDetail : '—'}
                </div>
              </div>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Container number / rack</label>
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCustody.containerNumberRack?.trim() ? currentCustody.containerNumberRack : '—'}
                </div>
              </div>
              <div className={`${fieldStyles.container} p-2`}>
                <label className={`block text-xs font-medium ${fieldStyles.label}`}>Purpose / remarks</label>
                <div className={`text-sm ${fieldStyles.text}`}>
                  {currentCustody.custodyRemark?.trim() ? currentCustody.custodyRemark : '—'}
                </div>
              </div>
            </>
          )}

          {/* Custody From Date */}
          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>From Date</label>
            <div className={`text-sm ${fieldStyles.text}`}>
              {new Date(currentCustody.custodyfrom).toLocaleDateString()}
            </div>
          </div>

          {/* Custody To Date */}
          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>To Date</label>
            <div className={`text-sm ${fieldStyles.text}`}>
              {currentCustody.custodyto ? new Date(currentCustody.custodyto).toLocaleDateString() : 'Current'}
            </div>
          </div>

          {/* Gatepass Document */}
          <div className={`${fieldStyles.container} p-2`}>
            <label className={`block text-xs font-medium ${fieldStyles.label}`}>Gatepass Document</label>
            <div className={`text-sm ${fieldStyles.text}`}>
              {currentCustody.documentnumber || 'Not specified'}
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className={`mt-6 border-t ${theme === 'glassmorphic' ? 'border-white/20' : theme === 'light' ? 'border-blue-200' : 'border-gray-200 dark:border-slate-600/80'} pt-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${getTextStyles()}`}>Custody History</h3>
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
            {showHistory ? 'Hide History' : `Show History (${custodyHistory?.length || 0} records)`}
          </button>
        </div>

        {showHistory && custodyHistory.length > 0 && (
          <div className="space-y-3">
            {custodyHistory.map((record) => (
              <div 
                key={record._id}
                className={`${fieldStyles.container} p-3`}
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Employee */}
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Employee</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.employeename} ({record.employeenumber})
                    </div>
                  </div>

                  {/* Location Type */}
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Location Type</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {displayCustodyLocationType(record.locationType)}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>
                      {normalizeCustodyLocationType(record.locationType) === 'project_site'
                        ? 'City (record)'
                        : 'City'}
                    </label>
                    <div className={`text-sm ${fieldStyles.text}`}>{custodyCityDisplay(record)}</div>
                  </div>

                  {normalizeCustodyLocationType(record.locationType) !== 'project_site' && (
                    <div>
                      <label className={`block text-xs font-medium ${fieldStyles.label}`}>Location (premises)</label>
                      <div className={`text-sm ${fieldStyles.text}`}>{premisesDisplay(record)}</div>
                    </div>
                  )}

                  {(normalizeCustodyLocationType(record.locationType) === 'project_site' ||
                    record.locationType === 'department') && (
                    <div>
                      <label className={`block text-xs font-medium ${fieldStyles.label}`}>Project</label>
                      <div className={`text-sm ${fieldStyles.text}`}>
                        {record.project || '—'}
                        {record.projectname ? ` (${record.projectname})` : ''}
                      </div>
                    </div>
                  )}

                  {normalizeCustodyLocationType(record.locationType) === 'warehouse' && (
                    <>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Rack / bin / pallet</label>
                        <div className={`text-sm ${fieldStyles.text}`}>{warehouseRackDisplay(record)}</div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Shed / room number</label>
                        <div className={`text-sm ${fieldStyles.text}`}>{warehouseShedDisplay(record)}</div>
                      </div>
                    </>
                  )}

                  {normalizeCustodyLocationType(record.locationType) === 'camp/office' && (
                    <>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Floor / room</label>
                        <div className={`text-sm ${fieldStyles.text}`}>{floorRoomDisplay(record)}</div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Occupant</label>
                        <div className={`text-sm ${fieldStyles.text}`}>
                          {record.occupant?.trim() ? record.occupant : '—'}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Remark</label>
                        <div className={`text-sm ${fieldStyles.text}`}>
                          {record.custodyRemark?.trim() ? record.custodyRemark : '—'}
                        </div>
                      </div>
                    </>
                  )}

                  {normalizeCustodyLocationType(record.locationType) === 'project_site' && (
                    <>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Custodian detail</label>
                        <div className={`text-sm ${fieldStyles.text}`}>
                          {record.custodianDetail?.trim() ? record.custodianDetail : '—'}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Container number / rack</label>
                        <div className={`text-sm ${fieldStyles.text}`}>
                          {record.containerNumberRack?.trim() ? record.containerNumberRack : '—'}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${fieldStyles.label}`}>Purpose / remarks</label>
                        <div className={`text-sm ${fieldStyles.text}`}>
                          {record.custodyRemark?.trim() ? record.custodyRemark : '—'}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Dates */}
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>From Date</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {new Date(record.custodyfrom).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>To Date</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.custodyto ? new Date(record.custodyto).toLocaleDateString() : 'Current'}
                    </div>
                  </div>

                  {/* Gatepass Document */}
                  <div>
                    <label className={`block text-xs font-medium ${fieldStyles.label}`}>Gatepass Document</label>
                    <div className={`text-sm ${fieldStyles.text}`}>
                      {record.documentnumber || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal (End Custody) */}
      <EditCustodyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Error-correction Modal (patch location fields only) */}
      <ErrorCorrectionModal
        isOpen={showErrorCorrectionModal}
        onClose={() => setShowErrorCorrectionModal(false)}
      />
    </div>
  );
} 