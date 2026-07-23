'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AsyncSelect from 'react-select/async';
import DatePicker from 'react-datepicker';
import { Employee, Project, Custody } from '@/types/custody';
import CustodyLocationFields from '@/app/components/CustodyLocationFields';
import type { CustodyLocationType } from '@/lib/custodyLocation';

export default function NewCustodyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }>
  >([]);
  const animationFrameRef = useRef<number>();

  const router = useRouter();
  const params = useParams() as { assetnumber: string };
  const { data: session } = useSession();
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1,
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45, 212, 191, 0.6)';
        ctx.fill();

        particlesRef.current.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(45, 212, 191, ${0.3 * (1 - distance / 100)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#2d3748] to-[#1a2332]">
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      <div className="relative z-20 flex flex-col min-h-screen">
        <main className="flex-1 container mx-auto p-6">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
              New Custody Record
            </h3>

            {error && (
              <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm mb-6 border border-red-400/30">
                {error}
              </div>
            )}

            <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Bulk Custody Upload</h4>
              <p className="text-xs text-white/80 mb-3">
                Download the template, fill it in Excel, then upload. If any row fails basic validation, the whole upload is aborted.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadBulkTemplate}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg text-xs"
                >
                  Download Template
                </button>
                <button
                  type="button"
                  onClick={() => bulkFileInputRef.current?.click()}
                  disabled={isBulkUploading}
                  className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white px-3 py-2 rounded-lg text-xs"
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
              {bulkMessage && (
                <div className="mt-3 text-xs text-white/90">
                  {bulkMessage}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Employee Number</label>
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
                  styles={{
                    control: (base) => ({
                      ...base,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }),
                    menu: (base) => ({
                      ...base,
                      background: 'rgba(26, 35, 50, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      color: 'rgb(255, 255, 255)',
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'rgb(255, 255, 255)',
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'rgb(255, 255, 255)',
                    }),
                  }}
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
                <label className="block text-sm font-medium text-white mb-1">
                  Custody From Date <span className="text-red-400">*</span>
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
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm p-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Custody To Date</label>
                <DatePicker
                  selected={formData.custodyto}
                  onChange={(date: Date | null) =>
                    setFormData((prev) => ({
                      ...prev,
                      custodyto: date,
                    }))
                  }
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm p-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  minDate={formData.custodyfrom || undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Gatepass Document Number</label>
                <input
                  type="text"
                  value={formData.documentnumber || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentnumber: e.target.value,
                    }))
                  }
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/70 text-sm p-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  placeholder="Enter gatepass document number..."
                />
              </div>
            </div>

            <div className="mt-8 border-t border-white/20 pt-6">
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
