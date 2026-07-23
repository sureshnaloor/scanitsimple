'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import LocationCitiesTab from './LocationCitiesTab';
import PremisesLocationMap from '@/app/components/PremisesLocationMap';
import type { PremisesKind } from '@/lib/premisesTownCity';
import * as XLSX from 'xlsx';

interface Location {
  _id: string;
  locationName: string;
  townCity: string;
  buildingTower: string;
  premisesKind?: PremisesKind;
  remarks?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

type PremisesForm = {
  premisesKind: PremisesKind;
  locationName: string;
  townCity: string;
  buildingTower: string;
  remarks: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyPremisesForm = (): PremisesForm => ({
  premisesKind: 'department',
  locationName: '',
  townCity: '',
  buildingTower: '',
  remarks: '',
  landmark: '',
  latitude: null,
  longitude: null,
});

interface BulkLocationRow {
  premisesKind: string;
  locationName: string;
  townCity: string;
  buildingTower: string;
  latitude?: string;
  longitude?: string;
  landmark?: string;
  remarks?: string;
  sourceRow?: number;
}

interface LocationCityRow {
  _id: string;
  name: string;
  order?: number;
}

function formatCoord(lat?: number, lng?: number) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function premisesTypeLabel(kind?: PremisesKind | string | null) {
  if (kind === 'warehouse') return 'Warehouse';
  return 'Camp / offices';
}

export default function LocationsManagement() {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'cities' | 'premises'>('cities');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PremisesForm>(emptyPremisesForm);
  /** Bump to remount map after clearing coordinates; suppresses auto-GPS on that mount */
  const [mapNonce, setMapNonce] = useState(0);
  const [skipAutoGeo, setSkipAutoGeo] = useState(false);

  const [locationCities, setLocationCities] = useState<{
    warehouse: LocationCityRow[];
    department: LocationCityRow[];
  }>({ warehouse: [], department: [] });
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkRows, setBulkRows] = useState<BulkLocationRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<BulkLocationRow[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationSummary, setValidationSummary] = useState<{
    totalUploaded: number;
    validForInsert: number;
    skippedExisting: Array<{ locationName: string; townCity?: string; buildingTower?: string; sourceRow?: number }>;
  } | null>(null);
  const [bulkErrorModalOpen, setBulkErrorModalOpen] = useState(false);
  const [bulkErrorModalTitle, setBulkErrorModalTitle] = useState('');
  const [bulkErrorModalContent, setBulkErrorModalContent] = useState('');

  const [premisesListFilter, setPremisesListFilter] = useState<'all' | 'warehouse' | 'department'>('all');

  const getThemeStyles = () => {
    switch (theme) {
      case 'glassmorphic':
        return {
          bg: 'bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]',
          card: 'bg-white/10 backdrop-blur-lg border border-white/20',
          input: 'bg-white/10 border border-white/20 text-white placeholder-white/50',
          button: 'bg-teal-500 hover:bg-teal-600 text-white',
          buttonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
          text: 'text-white',
          textMuted: 'text-white/60',
          tableRow: 'border-white/10 hover:bg-white/5',
        };
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
          card: 'bg-white border-2 border-blue-200 shadow-md',
          input: 'bg-white border-2 border-blue-200 text-gray-900 placeholder-gray-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-blue-200',
          text: 'text-gray-900',
          textMuted: 'text-gray-600',
          tableRow: 'border-blue-200 hover:bg-blue-50',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]',
          card: 'bg-slate-800/50 border border-slate-700',
          input: 'bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400',
          button: 'bg-teal-600 hover:bg-teal-700 text-white',
          buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          tableRow: 'border-slate-700 hover:bg-slate-700/50',
        };
    }
  };

  const styles = getThemeStyles();

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const q =
        premisesListFilter === 'all' ? '' : `?premisesKind=${encodeURIComponent(premisesListFilter)}`;
      const response = await fetch(`/api/locations${q}`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, [premisesListFilter]);

  useEffect(() => {
    if (activeTab !== 'premises') return;
    fetchLocations();
  }, [activeTab, fetchLocations]);

  useEffect(() => {
    if (activeTab !== 'premises') return;
    const loadCities = async () => {
      try {
        setCitiesLoading(true);
        const res = await fetch('/api/location-cities');
        if (!res.ok) throw new Error('Failed to load city lists');
        const data = await res.json();
        setLocationCities({
          warehouse: data.warehouse || [],
          department: data.department || [],
        });
      } catch {
        setLocationCities({ warehouse: [], department: [] });
      } finally {
        setCitiesLoading(false);
      }
    };
    loadCities();
  }, [activeTab]);

  const cityNamesLower = useMemo(() => {
    const list =
      formData.premisesKind === 'warehouse' ? locationCities.warehouse : locationCities.department;
    return new Set(list.map((c) => c.name.trim().toLowerCase()));
  }, [locationCities, formData.premisesKind]);

  const townNotInCityLists =
    formData.townCity.trim() !== '' && !cityNamesLower.has(formData.townCity.trim().toLowerCase());

  const buildPayload = (includeId: boolean) => {
    const base: Record<string, unknown> = {
      premisesKind: formData.premisesKind,
      locationName: formData.locationName.trim(),
      townCity: formData.townCity.trim(),
      buildingTower: formData.buildingTower.trim(),
      remarks: formData.remarks.trim(),
      landmark: formData.landmark.trim(),
    };
    if (formData.latitude !== null && formData.longitude !== null) {
      base.latitude = formData.latitude;
      base.longitude = formData.longitude;
    }
    if (includeId && editingLocation) {
      base._id = editingLocation._id;
    }
    return base;
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.locationName.trim() || !formData.townCity.trim() || !formData.buildingTower.trim()) {
        setError('Location name, town/city, and building/tower are required');
        return;
      }

      const method = editingLocation ? 'PUT' : 'POST';
      const body = buildPayload(!!editingLocation);

      const response = await fetch('/api/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      setSuccess(editingLocation ? 'Location updated successfully' : 'Location created successfully');
      fetchLocations();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setError(null);
      const response = await fetch(`/api/locations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      setSuccess('Location deleted successfully');
      fetchLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    }
  };

  const handleEdit = (location: Location) => {
    setMapNonce(0);
    setSkipAutoGeo(false);
    setEditingLocation(location);
    setFormData({
      premisesKind: location.premisesKind ?? 'department',
      locationName: location.locationName || '',
      townCity: location.townCity || '',
      buildingTower: location.buildingTower || '',
      remarks: location.remarks || '',
      landmark: location.landmark || '',
      latitude:
        typeof location.latitude === 'number' && !Number.isNaN(location.latitude) ? location.latitude : null,
      longitude:
        typeof location.longitude === 'number' && !Number.isNaN(location.longitude) ? location.longitude : null,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(emptyPremisesForm());
    setEditingLocation(null);
    setShowForm(false);
    setMapNonce(0);
    setSkipAutoGeo(false);
  };

  const openBulkErrorModal = (title: string, content: string) => {
    setBulkErrorModalTitle(title);
    setBulkErrorModalContent(content);
    setBulkErrorModalOpen(true);
  };

  const resetBulkState = () => {
    setBulkFileName('');
    setBulkRows([]);
    setValidatedRows([]);
    setValidationMessage('');
    setValidationSummary(null);
  };

  const normalizeHeader = (header: unknown) => String(header ?? '').trim().toLowerCase();

  const parseBulkFile = async (file: File): Promise<BulkLocationRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (!rows || rows.length < 2) {
      throw new Error('File must include a header row and at least one data row.');
    }

    const headers = rows[0].map(normalizeHeader);
    const requiredHeaders = ['premises type', 'location name', 'town/city', 'building/tower'];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(`Missing required header(s): ${missing.join(', ')}.`);
    }

    const getCell = (row: (string | number | null)[], names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      if (idx === -1) return '';
      return String(row[idx] ?? '').trim();
    };

    const parsed: BulkLocationRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const premisesKind = getCell(row, ['premises type', 'premises kind', 'premiseskind', 'type']);
      const locationName = getCell(row, ['location name', 'locationname']);
      const townCity = getCell(row, ['town/city', 'town city', 'towncity']);
      const buildingTower = getCell(row, ['building/tower', 'building tower', 'buildingtower']);
      const latitude = getCell(row, ['latitude', 'lat']);
      const longitude = getCell(row, ['longitude', 'lng', 'lon']);
      const landmark = getCell(row, ['landmark']);
      const remarks = getCell(row, ['remarks', 'notes']);

      const hasAny = [
        premisesKind,
        locationName,
        townCity,
        buildingTower,
        latitude,
        longitude,
        landmark,
        remarks,
      ].some((v) => v !== '');
      if (!hasAny) continue;

      parsed.push({
        premisesKind,
        locationName,
        townCity,
        buildingTower,
        latitude,
        longitude,
        landmark,
        remarks,
        sourceRow: i + 1,
      });
    }

    if (parsed.length === 0) {
      throw new Error('No data rows found in uploaded file.');
    }

    return parsed;
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/locations/template');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to download template.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'locations_bulk_insert_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      openBulkErrorModal(
        'Template download error',
        err instanceof Error ? err.message : 'Failed to download template.'
      );
    }
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseBulkFile(file);
      setBulkRows(rows);
      setBulkFileName(file.name);
      setValidatedRows([]);
      setValidationMessage('');
      setValidationSummary(null);
    } catch (err) {
      resetBulkState();
      openBulkErrorModal(
        'File parsing error',
        err instanceof Error ? err.message : 'Failed to parse uploaded file.'
      );
    }
  };

  const handleValidateBulk = async () => {
    if (!bulkRows.length) {
      openBulkErrorModal('Validation error', 'Upload a file first.');
      return;
    }
    try {
      setBulkLoading(true);
      const response = await fetch('/api/locations/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', rows: bulkRows }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const details = Array.isArray(result.errors) ? result.errors.join('\n') : result.error;
        throw new Error(details || 'Validation failed.');
      }
      const data = result.data;
      setValidatedRows(data.rowsToInsert || []);
      setValidationSummary({
        totalUploaded: data.totalUploaded || 0,
        validForInsert: data.validForInsert || 0,
        skippedExisting: data.skippedExisting || [],
      });
      setValidationMessage(result.message || 'Validation successful.');
    } catch (err) {
      setValidatedRows([]);
      setValidationSummary(null);
      setValidationMessage('');
      openBulkErrorModal('Validation error', err instanceof Error ? err.message : 'Validation failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInsertBulk = async () => {
    if (!validatedRows.length) {
      openBulkErrorModal('Insert error', 'No validated rows ready to insert.');
      return;
    }
    try {
      setBulkLoading(true);
      const response = await fetch('/api/locations/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', rows: validatedRows }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Insert failed.');
      }
      setSuccess(result.message || 'Locations inserted successfully.');
      setShowBulkModal(false);
      resetBulkState();
      fetchLocations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      openBulkErrorModal('Insert error', err instanceof Error ? err.message : 'Insert failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const tabBtn = (id: 'cities' | 'premises', label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id ? `${styles.button} shadow` : `${styles.buttonSecondary}`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`min-h-screen ${styles.bg} p-4 sm:p-6 lg:p-8`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-bold ${styles.text} mb-2`}>Locations</h1>
            <p className={styles.textMuted}>
              City names for custody and projects, and camp/office premises records.
            </p>
          </div>
          <div className="flex gap-2">
            {tabBtn('cities', 'City lists')} {tabBtn('premises', 'Premises')}
          </div>
        </div>

        {activeTab === 'cities' && <LocationCitiesTab />}

        {activeTab === 'premises' && (
          <>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
              <div>
                <h2 className={`text-2xl font-bold ${styles.text} mb-1`}>Premises</h2>
                <p className={styles.textMuted}>
                  Warehouse vs camp/offices premises; town/city options follow the matching city list. Site-level
                  records (room/floor and bin/rack stay on assets). Optional map coordinates.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(true);
                    resetBulkState();
                  }}
                  className={`${styles.buttonSecondary} flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200`}
                >
                  Bulk insert
                </button>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className={`${styles.button} flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200`}
                  >
                    <PlusIcon className="h-5 w-5" />
                    New Location
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)} className="text-red-200 hover:text-red-100">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-5 w-5" />
                  {success}
                </span>
                <button type="button" onClick={() => setSuccess(null)} className="text-green-200 hover:text-green-100">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {showForm && (
              <div className={`${styles.card} p-6 rounded-lg mb-8`}>
                <h2 className={`${styles.text} text-2xl font-bold mb-6`}>
                  {editingLocation ? 'Edit Location' : 'Create New Location'}
                </h2>
                <form onSubmit={handleAddOrUpdate} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Premises type *</label>
                    <p className={`text-xs ${styles.textMuted} mb-2`}>
                      Warehouse premises use <strong className={styles.text}>warehouse</strong> city lists; camp /
                      offices use <strong className={styles.text}>department / camp</strong> city lists (same as City
                      lists tab).
                    </p>
                    <select
                      value={formData.premisesKind}
                      onChange={(e) => {
                        const premisesKind = e.target.value as PremisesKind;
                        setFormData((prev) => {
                          const list =
                            premisesKind === 'warehouse' ? locationCities.warehouse : locationCities.department;
                          const stillOk = list.some((c) => c.name === prev.townCity);
                          return { ...prev, premisesKind, townCity: stillOk ? prev.townCity : '' };
                        });
                      }}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      required
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="department">Camp / offices</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Location Name *</label>
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Enter location name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Town/City *</label>
                    <p className={`text-xs ${styles.textMuted} mb-2`}>
                      Only cities from the list that matches the premises type above. Manage lists under{' '}
                      <strong className={styles.text}>City lists</strong>.
                    </p>
                    <select
                      value={formData.townCity}
                      onChange={(e) => setFormData({ ...formData, townCity: e.target.value })}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      required
                      disabled={citiesLoading}
                    >
                      <option value="">{citiesLoading ? 'Loading city lists…' : 'Select town/city'}</option>
                      {(formData.premisesKind === 'warehouse'
                        ? locationCities.warehouse
                        : locationCities.department
                      ).map((c) => (
                        <option key={`${formData.premisesKind}-${c._id}`} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      {townNotInCityLists && (
                        <option value={formData.townCity}>
                          Current: {formData.townCity} (legacy — select a list city to align)
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Building/Tower *</label>
                    <input
                      type="text"
                      value={formData.buildingTower}
                      onChange={(e) => setFormData({ ...formData, buildingTower: e.target.value })}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Enter building or tower name"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h3 className={`text-sm font-semibold ${styles.text} mb-1`}>Log location (optional)</h3>
                    <p className={`text-xs ${styles.textMuted} mb-3`}>
                      Uses the same Google Map + GPS flow as asset log location. Coordinates are saved on this premises
                      document.
                    </p>
                    <PremisesLocationMap
                      key={`${editingLocation?._id ?? 'create'}-${mapNonce}`}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      skipAutoGeo={skipAutoGeo}
                      onChange={({ latitude, longitude }) =>
                        setFormData((prev) => ({ ...prev, latitude, longitude }))
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
                          setSkipAutoGeo(true);
                          setMapNonce((n) => n + 1);
                        }}
                        className={`text-xs ${styles.buttonSecondary} px-3 py-1.5 rounded-lg`}
                      >
                        Clear coordinates
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${styles.textMuted} mb-1`}>Latitude (manual)</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              latitude: v === '' ? null : parseFloat(v),
                            }));
                          }}
                          className={`w-full ${styles.input} px-3 py-2 rounded-lg text-sm`}
                          placeholder="e.g. 26.3927"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${styles.textMuted} mb-1`}>Longitude (manual)</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              longitude: v === '' ? null : parseFloat(v),
                            }));
                          }}
                          className={`w-full ${styles.input} px-3 py-2 rounded-lg text-sm`}
                          placeholder="e.g. 49.9777"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Landmark (optional)</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      placeholder="Named place or label near the pin"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${styles.text} mb-2`}>Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className={`w-full ${styles.input} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none`}
                      placeholder="Enter any additional remarks"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className={`${styles.button} px-6 py-2.5 rounded-lg font-medium transition-all duration-200`}
                    >
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`${styles.buttonSecondary} px-6 py-2.5 rounded-lg font-medium transition-all duration-200`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={`${styles.card} rounded-lg overflow-hidden`}>
              <div className={`px-4 py-3 border-b flex flex-wrap gap-2 items-center ${styles.tableRow}`}>
                <span className={`text-sm ${styles.textMuted}`}>Show premises:</span>
                {(
                  [
                    ['all', 'All'],
                    ['warehouse', 'Warehouse'],
                    ['department', 'Camp / offices'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPremisesListFilter(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      premisesListFilter === id ? styles.button : styles.buttonSecondary
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className={`p-8 text-center ${styles.textMuted}`}>
                  <p>Loading locations...</p>
                </div>
              ) : locations.length === 0 ? (
                <div className={`p-8 text-center ${styles.textMuted}`}>
                  <p>No premises found for this filter. Create a location or switch the filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${styles.tableRow} border-b`}>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Type</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Location Name</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Town/City</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Building/Tower</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Coordinates</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Landmark</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${styles.text}`}>Remarks</th>
                        <th className={`px-6 py-4 text-right text-sm font-semibold ${styles.text}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((location) => (
                        <tr key={location._id} className={`${styles.tableRow} border-b transition-colors duration-150`}>
                          <td className={`px-6 py-4 ${styles.textMuted} text-sm`}>
                            {premisesTypeLabel(location.premisesKind)}
                          </td>
                          <td className={`px-6 py-4 ${styles.text} font-medium`}>{location.locationName || '—'}</td>
                          <td className={`px-6 py-4 ${styles.textMuted} text-sm`}>{location.townCity || '—'}</td>
                          <td className={`px-6 py-4 ${styles.textMuted} text-sm`}>{location.buildingTower || '—'}</td>
                          <td className={`px-6 py-4 ${styles.textMuted} text-xs font-mono`}>
                            {formatCoord(location.latitude, location.longitude)}
                          </td>
                          <td className={`px-6 py-4 ${styles.textMuted} text-sm max-w-[140px] truncate`}>
                            {location.landmark || '—'}
                          </td>
                          <td className={`px-6 py-4 ${styles.textMuted} text-sm max-w-xs truncate`}>
                            {location.remarks || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(location)}
                                className={`${styles.buttonSecondary} p-2 rounded-lg transition-all duration-200 hover:scale-110`}
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(location._id, location.locationName || 'Unknown')}
                                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {showBulkModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className={`${styles.card} w-full max-w-3xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
                  <h3 className={`mb-2 text-2xl font-semibold ${styles.text}`}>Bulk insert premises</h3>
                  <p className={`mb-4 text-sm ${styles.textMuted}`}>
                    Required columns: <strong className={styles.text}>Premises Type</strong> (warehouse or
                    department/camp), <strong className={styles.text}>Location Name</strong>,{' '}
                    <strong className={styles.text}>Town/City</strong>, <strong className={styles.text}>Building/Tower</strong>
                    . Town/City must match the city list for that type. Latitude and longitude are optional (both or
                    neither). Rows matching an existing premises (same type + name + town + building) are skipped.
                  </p>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className={`${styles.buttonSecondary} px-4 py-2 rounded-lg text-sm`}
                    >
                      Download template
                    </button>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleBulkFileSelect}
                      className={`text-sm ${styles.text}`}
                    />
                  </div>
                  {bulkFileName && (
                    <p className={`mb-3 text-sm ${styles.textMuted}`}>
                      Selected file: {bulkFileName} ({bulkRows.length} rows)
                    </p>
                  )}
                  {validationSummary && (
                    <div className={`mb-4 rounded-xl border p-4 ${styles.input}`}>
                      <p className={styles.text}>{validationMessage}</p>
                      <p className={`mt-2 text-sm ${styles.textMuted}`}>
                        Total uploaded: {validationSummary.totalUploaded} | New rows: {validationSummary.validForInsert}{' '}
                        | Skipped (already exist): {validationSummary.skippedExisting.length}
                      </p>
                    </div>
                  )}
                  {validatedRows.length > 0 && (
                    <div className={`mb-4 rounded-xl border p-4 ${styles.input} max-h-48 overflow-auto text-xs`}>
                      <p className={`mb-2 font-medium ${styles.text}`}>Ready to insert ({validatedRows.length})</p>
                      <ul className={`space-y-1 ${styles.textMuted}`}>
                        {validatedRows.map((r, i) => (
                          <li key={i}>
                            [{r.premisesKind}] {r.locationName} — {r.townCity} / {r.buildingTower}
                            {r.latitude && r.longitude ? ` (${r.latitude}, ${r.longitude})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkModal(false);
                        resetBulkState();
                      }}
                      className={`${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading || bulkRows.length === 0}
                      onClick={handleValidateBulk}
                      className={`${styles.buttonSecondary} px-4 py-2 rounded-lg disabled:opacity-50`}
                    >
                      {bulkLoading ? 'Processing…' : 'Validate'}
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading || validatedRows.length === 0}
                      onClick={handleInsertBulk}
                      className={`${styles.button} px-4 py-2 rounded-lg disabled:opacity-50`}
                    >
                      {bulkLoading ? 'Processing…' : 'Insert'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bulkErrorModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                <div className={`${styles.card} max-w-lg w-full rounded-xl p-6`}>
                  <h3 className={`mb-3 text-xl font-semibold ${styles.text}`}>{bulkErrorModalTitle}</h3>
                  <pre className={`whitespace-pre-wrap text-sm ${styles.textMuted} max-h-64 overflow-auto`}>
                    {bulkErrorModalContent}
                  </pre>
                  <button
                    type="button"
                    onClick={() => setBulkErrorModalOpen(false)}
                    className={`${styles.button} mt-4 px-4 py-2 rounded-lg`}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
