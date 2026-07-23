'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AsyncSelect from 'react-select/async';
import DatePicker from 'react-datepicker';
import { Employee, Project, Custody } from '@/types/custody';
import CustodyLocationFields from '@/app/components/CustodyLocationFields';
import type { CustodyLocationType } from '@/lib/custodyLocation';
import { useAppTheme } from '@/app/contexts/ThemeContext';
import ThemedPageShell from '@/app/components/ThemedPageShell';
import { fap } from '@/lib/fixedAssetPageDesign';

export default function NewCustodyPage() {
  const router = useRouter();
  const params = useParams() as { assetnumber: string };
  const { data: session } = useSession();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const createdBy = session?.user?.email ?? session?.user?.name ?? '';

  const [isSaving, setIsSaving] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
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
  const [warehouseCityNames, setWarehouseCityNames] = useState<string[]>([]);
  const [departmentCityNames, setDepartmentCityNames] = useState<string[]>([]);
  const [locationCitiesLoaded, setLocationCitiesLoaded] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Custody>>({
    assetnumber: params.assetnumber,
    custodyfrom: new Date(),
    custodyto: null,
  });

  const onPremisesChange = useCallback((id: string, label: string) => {
    setPremisesId(id);
    setPremisesLabel(label);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/location-cities')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
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

  useEffect(() => {
    if (warehouseCityNames.length === 0) return;
    setCustodyCity((prev) =>
      locationType === 'warehouse'
        ? prev && warehouseCityNames.includes(prev)
          ? prev
          : warehouseCityNames[0] ?? ''
        : prev
    );
  }, [warehouseCityNames, locationType]);

  useEffect(() => {
    if (departmentCityNames.length === 0) return;
    setCustodyCity((prev) =>
      locationType !== 'warehouse'
        ? prev && departmentCityNames.includes(prev)
          ? prev
          : departmentCityNames[0] ?? ''
        : prev
    );
  }, [departmentCityNames, locationType]);

  const asyncSelectStyles = useMemo(
    () => ({
      control: (base: Record<string, unknown>) => ({
        ...base,
        background: isLight ? '#ffffff' : '#1E293B',
        borderColor: isLight ? '#cbd5e1' : '#2A3B4C',
        color: isLight ? '#0F172A' : '#F8F9FA',
        minHeight: 38,
      }),
      menu: (base: Record<string, unknown>) => ({
        ...base,
        background: isLight ? '#ffffff' : '#111827',
        border: isLight ? '1px solid #e2e8f0' : '1px solid #2A3B4C',
      }),
      option: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isFocused
          ? isLight
            ? '#f1f5f9'
            : 'rgba(42, 59, 76, 0.8)'
          : 'transparent',
        color: isLight ? '#0F172A' : '#F8F9FA',
      }),
      singleValue: (base: Record<string, unknown>) => ({
        ...base,
        color: isLight ? '#0F172A' : '#F8F9FA',
      }),
      input: (base: Record<string, unknown>) => ({
        ...base,
        color: isLight ? '#0F172A' : '#F8F9FA',
      }),
    }),
    [isLight]
  );

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (e) {
      console.error('Error fetching projects:', e);
      setError('Failed to load projects');
    }
  };

  const loadEmployeeOptions = async (inputValue: string) => {
    if (inputValue.length < 3 && !/^\d+$/.test(inputValue)) return [];

    try {
      const url = `/api/employees/search?q=${encodeURIComponent(inputValue)}`;
      const response = await fetch(url);
      const responseData = await response.json();

      if (!response.ok) {
        setError(`Failed to fetch employees: ${responseData.error || 'Unknown error'}`);
        return [];
      }

      const employees = responseData.success ? responseData.data?.records || [] : [];

      return employees.map((emp: Employee) => ({
        value: emp.empno,
        label: `${emp.empno} - ${emp.empname}`,
        employee: emp,
      }));
    } catch (e) {
      console.error('Error fetching employees:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch employees');
      return [];
    }
  };

  const handleLocationTypeChange = (t: CustodyLocationType) => {
    setLocationType(t);
    const list = t === 'warehouse' ? warehouseCityNames : departmentCityNames;
    setCustodyCity(list[0] ?? '');
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!formData.employeenumber || !formData.custodyfrom) {
        setError('Employee and From Date are required');
        return;
      }
      if (locationType !== 'project_site' && !custodyCity.trim()) {
        setError('City is required');
        return;
      }
      if (
        (locationType === 'warehouse' || locationType === 'camp/office') &&
        !premisesId.trim()
      ) {
        setError('Select a premises location from the master list');
        return;
      }
      if (locationType === 'project_site' && !projectWbs.trim()) {
        setError('Project is required for project site');
        return;
      }

      const response = await fetch(`/api/custody/${params.assetnumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetnumber: params.assetnumber,
          employeenumber: formData.employeenumber,
          employeename: formData.employeename,
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
          custodyfrom: formData.custodyfrom,
          custodyto: formData.custodyto ?? null,
          documentnumber: formData.documentnumber || null,
          createdat: new Date(),
          createdby: createdBy,
        }),
      });

      if (!response.ok) throw new Error('Failed to save custody record');

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save custody record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBulkTemplate = async () => {
    try {
      setBulkMessage(null);
      const response = await fetch('/api/custody/template');
      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custody_bulk_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setBulkMessage(e instanceof Error ? e.message : 'Failed to download template');
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsBulkUploading(true);
      setBulkMessage(null);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/custody/import', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        const details = Array.isArray(data.errors) ? ` ${data.errors.join(' | ')}` : '';
        throw new Error(`${data.error || 'Bulk upload failed.'}${details}`);
      }

      setBulkMessage(`Bulk upload successful. Inserted ${data.inserted} record(s).`);
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = '';
      }
    } catch (e) {
      setBulkMessage(e instanceof Error ? e.message : 'Bulk upload failed');
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <ThemedPageShell className="px-4 py-6 md:px-8 md:py-10" maxWidth="max-w-2xl">
        <div className={`${fap.card} ${fap.cardPadding}`}>
          <h3 className={`mb-6 text-2xl font-semibold ${fap.textPrimary}`}>New Custody Record</h3>

          {error && <div className={`${fap.errorBox} mb-6`}>{error}</div>}

          <div className={`mb-6 rounded-xl border border-slate-200 p-4 dark:border-[#2A3B4C]/50 ${fap.surface}`}>
            <h4 className={`mb-2 text-sm font-semibold ${fap.textPrimary}`}>Bulk Custody Upload</h4>
            <p className={`mb-3 text-xs ${fap.textSecondary}`}>
              Download the template, fill it in Excel, then upload. If any row fails basic validation, the whole
              upload is aborted.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleDownloadBulkTemplate} className={fap.btnSecondary}>
                Download Template
              </button>
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                disabled={isBulkUploading}
                className={fap.btnPrimary}
              >
                {isBulkUploading ? 'Uploading...' : 'Upload Filled File'}
              </button>
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleBulkUpload}
                />
              </div>
              {bulkMessage && <div className={`mt-3 text-xs ${fap.textSecondary}`}>{bulkMessage}</div>}
            </div>

            <div className="space-y-6">
              <div>
                <label className={`mb-1 block text-sm font-medium ${fap.textPrimary}`}>Employee Number</label>
                <AsyncSelect
                  loadOptions={loadEmployeeOptions}
                  defaultOptions={false}
                  cacheOptions
                  onChange={(option: { value: string; label: string; employee: Employee } | null) => {
                    if (option) {
                      setFormData((prev) => ({
                        ...prev,
                        employeenumber: option.value,
                        employeename: option.employee.empname,
                      }));
                    }
                  }}
                  styles={asyncSelectStyles}
                  className="text-sm"
                  placeholder="Search by employee number or name..."
                  isClearable
                />
              </div>

              <CustodyLocationFields
                variant="page"
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

              <div>
                <label className={`mb-1 block text-sm font-medium ${fap.textPrimary}`}>
                  Custody From Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={formData.custodyfrom}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData((prev) => ({
                        ...prev,
                        custodyfrom: date,
                      }));
                    }
                  }}
                  className={fap.input}
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${fap.textPrimary}`}>Custody To Date</label>
                <DatePicker
                  selected={formData.custodyto}
                  onChange={(date: Date | null) =>
                    setFormData((prev) => ({
                      ...prev,
                      custodyto: date,
                    }))
                  }
                  className={fap.input}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  minDate={formData.custodyfrom || undefined}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${fap.textPrimary}`}>
                  Gatepass Document Number
                </label>
                <input
                  type="text"
                  value={formData.documentnumber || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentnumber: e.target.value,
                    }))
                  }
                  className={fap.input}
                  placeholder="Enter gatepass document number..."
                />
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-[#2A3B4C]/50">
              <div className="flex gap-4">
                <button onClick={handleSave} disabled={isSaving} className={`flex-1 ${fap.btnPrimary}`}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => router.back()} className={`flex-1 ${fap.btnSecondary}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
    </ThemedPageShell>
  );
}
