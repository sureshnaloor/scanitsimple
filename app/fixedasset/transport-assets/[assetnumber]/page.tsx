'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Tag, Truck } from 'lucide-react';

import FixedAssetBreadcrumb from '@/app/components/fixedasset/FixedAssetBreadcrumb';
import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import { AssetQRCode } from '@/components/AssetQRCode';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';
import FixedAssetDetailShell from '@/app/components/fixedasset/FixedAssetDetailShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';

interface TransportDetail {
  _id: string;
  assetnumber: string;
  assetdescription: string;
  assetcategory: string;
  assetsubcategory: string;
  assetstatus: string;
  acquiredvalue: number | null;
  acquireddate?: string | Date | null;
  location: string;
  department: string;
  plateNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  vehicleModel?: string;
  modelYear?: number | null;
  trackerSerialNumber?: string;
  trackerMake?: string;
  trackerModel?: string;
  trackerInstalledDate?: string | Date | null;
  simSubscriptionStartDate?: string | Date | null;
  trackerDeinstallDate?: string | Date | null;
  trackerRemarks?: string;
}

interface MasterRow {
  _id: string;
  name: string;
}

interface PreventiveRecord {
  _id: string;
  maintenanceTypeId: string;
  maintenanceTypeName: string;
  scheduledDate?: string | Date | null;
  actualDate?: string | Date | null;
  remarks?: string;
}

interface BreakdownRecord {
  _id: string;
  maintenanceTypeId: string;
  maintenanceTypeName: string;
  actualDate?: string | Date | null;
  remarks?: string;
}

function dIn(v: string | Date | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function dOut(v: string | Date | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TransportAssetDetailPage() {
  const params = useParams();
  const assetnumber = typeof params?.assetnumber === 'string' ? params.assetnumber : '';

  const [asset, setAsset] = useState<TransportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topSaving, setTopSaving] = useState(false);
  const [topForm, setTopForm] = useState({
    assetdescription: '',
    assetcategory: '',
    assetsubcategory: '',
    assetstatus: '',
    acquiredvalue: '',
    acquireddate: '',
    location: '',
    department: '',
    plateNumber: '',
    chassisNumber: '',
    engineNumber: '',
    vehicleModel: '',
    modelYear: ''
  });

  const [prevMasters, setPrevMasters] = useState<MasterRow[]>([]);
  const [brkMasters, setBrkMasters] = useState<MasterRow[]>([]);
  const [preventive, setPreventive] = useState<PreventiveRecord[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRecord[]>([]);
  const [gpsSaving, setGpsSaving] = useState(false);
  const [gpsForm, setGpsForm] = useState({
    trackerSerialNumber: '',
    trackerMake: '',
    trackerModel: '',
    trackerInstalledDate: '',
    simSubscriptionStartDate: '',
    trackerDeinstallDate: '',
    trackerRemarks: '',
  });

  const [newPrev, setNewPrev] = useState({
    maintenanceTypeId: '',
    scheduledDate: '',
    actualDate: '',
    remarks: ''
  });
  const [newBrk, setNewBrk] = useState({
    maintenanceTypeId: '',
    actualDate: '',
    remarks: ''
  });

  const [editPrev, setEditPrev] = useState<PreventiveRecord | null>(null);
  const [editPrevForm, setEditPrevForm] = useState({
    maintenanceTypeId: '',
    scheduledDate: '',
    actualDate: '',
    remarks: ''
  });
  const [editBrk, setEditBrk] = useState<BreakdownRecord | null>(null);
  const [editBrkForm, setEditBrkForm] = useState({ maintenanceTypeId: '', actualDate: '', remarks: '' });

  const base = `/api/transportassets/${encodeURIComponent(assetnumber)}`;

  const loadAsset = useCallback(async () => {
    const res = await fetch(base);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to load asset');
    return (await res.json()) as TransportDetail;
  }, [base]);

  const loadLists = useCallback(async () => {
    const [p, b, pm, bm] = await Promise.all([
      fetch(`${base}/preventive-maintenance`),
      fetch(`${base}/breakdown-maintenance`),
      fetch('/api/transportassets/maintenance-types/preventive'),
      fetch('/api/transportassets/maintenance-types/breakdown')
    ]);
    if (!p.ok || !b.ok || !pm.ok || !bm.ok) throw new Error('Failed to load maintenance data');
    setPreventive(await p.json());
    setBreakdown(await b.json());
    setPrevMasters(await pm.json());
    setBrkMasters(await bm.json());
  }, [base]);

  const load = useCallback(async () => {
    if (!assetnumber) return;
    try {
      setLoading(true);
      setError(null);
      const a = await loadAsset();
      if (!a) {
        setError('Transport asset not found.');
        setAsset(null);
        return;
      }
      setAsset(a);
      setTopForm({
        assetdescription: a.assetdescription ?? '',
        assetcategory: a.assetcategory ?? '',
        assetsubcategory: a.assetsubcategory ?? '',
        assetstatus: a.assetstatus ?? '',
        acquiredvalue:
          a.acquiredvalue !== null && a.acquiredvalue !== undefined ? String(a.acquiredvalue) : '',
        acquireddate: dIn(a.acquireddate),
        location: a.location ?? '',
        department: a.department ?? '',
        plateNumber: a.plateNumber ?? '',
        chassisNumber: a.chassisNumber ?? '',
        engineNumber: a.engineNumber ?? '',
        vehicleModel: a.vehicleModel ?? '',
        modelYear: a.modelYear !== null && a.modelYear !== undefined ? String(a.modelYear) : ''
      });
      setGpsForm({
        trackerSerialNumber: a.trackerSerialNumber ?? '',
        trackerMake: a.trackerMake ?? '',
        trackerModel: a.trackerModel ?? '',
        trackerInstalledDate: dIn(a.trackerInstalledDate),
        simSubscriptionStartDate: dIn(a.simSubscriptionStartDate),
        trackerDeinstallDate: dIn(a.trackerDeinstallDate),
        trackerRemarks: a.trackerRemarks ?? '',
      });
      await loadLists();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [assetnumber, loadAsset, loadLists]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTop = async () => {
    try {
      setTopSaving(true);
      const body: Record<string, unknown> = {
        assetdescription: topForm.assetdescription,
        assetcategory: topForm.assetcategory,
        assetsubcategory: topForm.assetsubcategory,
        assetstatus: topForm.assetstatus,
        location: topForm.location,
        department: topForm.department,
        plateNumber: topForm.plateNumber,
        chassisNumber: topForm.chassisNumber,
        engineNumber: topForm.engineNumber,
        vehicleModel: topForm.vehicleModel,
        modelYear: topForm.modelYear.trim() !== '' ? Number(topForm.modelYear) : null
      };
      if (topForm.acquiredvalue.trim() !== '') body.acquiredvalue = Number(topForm.acquiredvalue);
      else body.acquiredvalue = null;
      body.acquireddate = topForm.acquireddate || null;

      const res = await fetch(base, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || 'Save failed');
      setAsset(json as TransportDetail);
      alert('Asset details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setTopSaving(false);
    }
  };

  const saveGps = async () => {
    try {
      setGpsSaving(true);
      const body = {
        trackerSerialNumber: gpsForm.trackerSerialNumber,
        trackerMake: gpsForm.trackerMake,
        trackerModel: gpsForm.trackerModel,
        trackerInstalledDate: gpsForm.trackerInstalledDate || null,
        simSubscriptionStartDate: gpsForm.simSubscriptionStartDate || null,
        trackerDeinstallDate: gpsForm.trackerDeinstallDate || null,
        trackerRemarks: gpsForm.trackerRemarks,
      };

      const res = await fetch(base, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || 'Save failed');
      setAsset(json as TransportDetail);
      alert('GPS tracker details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setGpsSaving(false);
    }
  };

  const addPreventive = async () => {
    if (!newPrev.maintenanceTypeId) {
      alert('Select a maintenance type.');
      return;
    }
    try {
      const res = await fetch(`${base}/preventive-maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceTypeId: newPrev.maintenanceTypeId,
          scheduledDate: newPrev.scheduledDate || null,
          actualDate: newPrev.actualDate || null,
          remarks: newPrev.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Failed to add');
      setNewPrev({ maintenanceTypeId: '', scheduledDate: '', actualDate: '', remarks: '' });
      await loadLists();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const addBreakdown = async () => {
    if (!newBrk.maintenanceTypeId) {
      alert('Select a maintenance type.');
      return;
    }
    try {
      const res = await fetch(`${base}/breakdown-maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceTypeId: newBrk.maintenanceTypeId,
          actualDate: newBrk.actualDate || null,
          remarks: newBrk.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Failed to add');
      setNewBrk({ maintenanceTypeId: '', actualDate: '', remarks: '' });
      await loadLists();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deletePrev = async (id: string) => {
    if (!confirm('Delete this preventive maintenance record?')) return;
    try {
      const res = await fetch(`${base}/preventive-maintenance/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadLists();
    } catch {
      alert('Delete failed');
    }
  };

  const deleteBrk = async (id: string) => {
    if (!confirm('Delete this breakdown maintenance record?')) return;
    try {
      const res = await fetch(`${base}/breakdown-maintenance/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadLists();
    } catch {
      alert('Delete failed');
    }
  };

  const saveEditPrev = async () => {
    if (!editPrev) return;
    try {
      const res = await fetch(`${base}/preventive-maintenance/${encodeURIComponent(editPrev._id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceTypeId: editPrevForm.maintenanceTypeId,
          scheduledDate: editPrevForm.scheduledDate || null,
          actualDate: editPrevForm.actualDate || null,
          remarks: editPrevForm.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Update failed');
      setEditPrev(null);
      await loadLists();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const saveEditBrk = async () => {
    if (!editBrk) return;
    try {
      const res = await fetch(`${base}/breakdown-maintenance/${encodeURIComponent(editBrk._id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceTypeId: editBrkForm.maintenanceTypeId,
          actualDate: editBrkForm.actualDate || null,
          remarks: editBrkForm.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Update failed');
      setEditBrk(null);
      await loadLists();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const openEditPrev = (r: PreventiveRecord) => {
    setEditPrev(r);
    setEditPrevForm({
      maintenanceTypeId: String(r.maintenanceTypeId),
      scheduledDate: dIn(r.scheduledDate),
      actualDate: dIn(r.actualDate),
      remarks: r.remarks ?? ''
    });
  };

  const openEditBrk = (r: BreakdownRecord) => {
    setEditBrk(r);
    setEditBrkForm({
      maintenanceTypeId: String(r.maintenanceTypeId),
      actualDate: dIn(r.actualDate),
      remarks: r.remarks ?? ''
    });
  };

  const inp = fap.input;

  if (!assetnumber) {
    return (
      <FixedAssetDetailShell>
        <p className={fap.textPrimary}>Invalid asset.</p>
      </FixedAssetDetailShell>
    );
  }

  return (
    <FixedAssetDetailShell>
        <FixedAssetBreadcrumb
          items={[
            { label: 'Fixed Assets', href: '/fixedasset' },
            { label: 'Transport Assets', href: '/fixedasset/transport-assets' },
            { label: assetnumber },
          ]}
        />

        {loading && (
          <div className="flex justify-center py-20">
            <div className={fap.spinner} />
          </div>
        )}

        {!loading && error && <div className={fap.errorBox}>{error}</div>}

        {!loading && asset && (
          <>
            <div className={`${fap.card} ${fap.cardPadding} mb-8`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className={fap.iconBox}>
                  <Truck className="h-12 w-12 text-[#00B4D8]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={fap.idBadge}>
                    <Tag className="h-3.5 w-3.5" />
                    {asset.assetnumber}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-[#F8F9FA] md:text-4xl">{asset.assetdescription || '—'}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {asset.assetcategory ? (
                      <span className="rounded-full bg-[rgba(0,180,216,0.15)] px-3 py-1 text-xs font-semibold text-[#00B4D8]">
                        {asset.assetcategory}
                      </span>
                    ) : null}
                    <FixedAssetStatusBadge status={asset.assetstatus} />
                    <span className="text-base font-bold text-[#0F172A] dark:text-[#F8F9FA]">{formatCurrency(asset.acquiredvalue)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-6 text-sm">
                    <div className="flex items-start gap-2 text-[#475569] dark:text-[#94A3B8]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Location</p>
                        <p className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.location || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Plate number</p>
                      <p className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.plateNumber || '—'}</p>
                    </div>
                    <div className="flex items-start gap-2 text-[#475569] dark:text-[#94A3B8]">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Acquired</p>
                        <p className="text-[#0F172A] dark:text-[#F8F9FA]">{dOut(asset.acquireddate)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Department</p>
                      <p className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.department || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <FixedAssetSection title="Edit asset details" defaultExpanded>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="block sm:col-span-2 lg:col-span-3">
                      <span className={fap.fieldLabel}>Description</span>
                      <input
                        className={inp}
                        value={topForm.assetdescription}
                        onChange={(e) => setTopForm((f) => ({ ...f, assetdescription: e.target.value }))}
                      />
                    </label>
                    {(
                      [
                        ['assetcategory', 'Category'],
                        ['assetsubcategory', 'Subcategory'],
                        ['assetstatus', 'Status'],
                        ['location', 'Location'],
                        ['department', 'Department'],
                        ['plateNumber', 'Plate number'],
                        ['chassisNumber', 'Chassis number'],
                        ['engineNumber', 'Engine number'],
                        ['vehicleModel', 'Model']
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className="block">
                        <span className={fap.fieldLabel}>{label}</span>
                        <input
                          className={inp}
                          value={topForm[k]}
                          onChange={(e) => setTopForm((f) => ({ ...f, [k]: e.target.value }))}
                        />
                      </label>
                    ))}
                    <label className="block">
                      <span className={fap.fieldLabel}>Year</span>
                      <input
                        type="number"
                        className={inp}
                        value={topForm.modelYear}
                        onChange={(e) => setTopForm((f) => ({ ...f, modelYear: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Acquisition value</span>
                      <input
                        type="number"
                        step="any"
                        className={inp}
                        value={topForm.acquiredvalue}
                        onChange={(e) => setTopForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Acquisition date</span>
                      <input
                        type="date"
                        className={inp}
                        value={topForm.acquireddate}
                        onChange={(e) => setTopForm((f) => ({ ...f, acquireddate: e.target.value }))}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={saveTop}
                    disabled={topSaving}
                    className={`${fap.btnPrimary} mt-4`}
                  >
                    {topSaving ? 'Saving…' : 'Save asset details'}
                  </button>
                </FixedAssetSection>

                <FixedAssetSection
                  title="Preventive maintenance"
                  description="Scheduled vs actual dates for preventive work."
                  defaultExpanded
                >
                  <p className="mb-4 text-sm text-[#64748B]">
                    Manage type labels under{' '}
                    <Link href="/fixedasset/transport-assets/masters/preventive" className="text-[#00B4D8] hover:underline">
                      Preventive types
                    </Link>
                    .
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#2A3B4C] text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]">
                        <tr>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Scheduled</th>
                          <th className="px-3 py-2">Actual</th>
                          <th className="px-3 py-2">Remarks</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {preventive.map((r, index) => (
                          <tr
                            key={r._id}
                            className={`border-t border-slate-200/70 dark:border-[#2A3B4C]/30 text-[#0F172A] dark:text-[#F8F9FA] ${index % 2 === 0 ? 'bg-white dark:bg-[#111827]' : 'bg-slate-50 dark:bg-[#1E293B]'}`}
                          >
                            <td className="px-3 py-2">{r.maintenanceTypeName}</td>
                            <td className="px-3 py-2">{dOut(r.scheduledDate)}</td>
                            <td className="px-3 py-2">{dOut(r.actualDate)}</td>
                            <td className="max-w-[200px] truncate px-3 py-2">{r.remarks || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <button
                                type="button"
                                onClick={() => openEditPrev(r)}
                                className="mr-2 text-xs text-[#00B4D8] hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePrev(r._id)}
                                className="text-xs text-[#EF4444] hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-slate-200 dark:border-[#2A3B4C]/50 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Type</span>
                      <select
                        className={inp}
                        value={newPrev.maintenanceTypeId}
                        onChange={(e) => setNewPrev((f) => ({ ...f, maintenanceTypeId: e.target.value }))}
                      >
                        <option value="">Select…</option>
                        {prevMasters.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Scheduled date</span>
                      <input
                        type="date"
                        className={inp}
                        value={newPrev.scheduledDate}
                        onChange={(e) => setNewPrev((f) => ({ ...f, scheduledDate: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Actual date</span>
                      <input
                        type="date"
                        className={inp}
                        value={newPrev.actualDate}
                        onChange={(e) => setNewPrev((f) => ({ ...f, actualDate: e.target.value }))}
                      />
                    </label>
                    <label className="block sm:col-span-2 lg:col-span-4">
                      <span className={fap.fieldLabel}>Remarks</span>
                      <input
                        className={inp}
                        value={newPrev.remarks}
                        onChange={(e) => setNewPrev((f) => ({ ...f, remarks: e.target.value }))}
                      />
                    </label>
                  </div>
                  <button type="button" onClick={addPreventive} className={`${fap.btnPrimary} mt-4`}>
                    Add preventive record
                  </button>
                </FixedAssetSection>

                <FixedAssetSection
                  title="Breakdown maintenance"
                  description="Actual repair and damage events."
                  defaultExpanded
                >
                  <p className="mb-4 text-sm text-[#64748B]">
                    Manage types under{' '}
                    <Link href="/fixedasset/transport-assets/masters/breakdown" className="text-[#00B4D8] hover:underline">
                      Breakdown types
                    </Link>
                    .
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#2A3B4C] text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]">
                        <tr>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Actual date</th>
                          <th className="px-3 py-2">Remarks</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.map((r, index) => (
                          <tr
                            key={r._id}
                            className={`border-t border-slate-200/70 dark:border-[#2A3B4C]/30 text-[#0F172A] dark:text-[#F8F9FA] ${index % 2 === 0 ? 'bg-white dark:bg-[#111827]' : 'bg-slate-50 dark:bg-[#1E293B]'}`}
                          >
                            <td className="px-3 py-2">{r.maintenanceTypeName}</td>
                            <td className="px-3 py-2">{dOut(r.actualDate)}</td>
                            <td className="max-w-[240px] truncate px-3 py-2">{r.remarks || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <button
                                type="button"
                                onClick={() => openEditBrk(r)}
                                className="mr-2 text-xs text-[#00B4D8] hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteBrk(r._id)}
                                className="text-xs text-[#EF4444] hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-slate-200 dark:border-[#2A3B4C]/50 pt-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Type</span>
                      <select
                        className={inp}
                        value={newBrk.maintenanceTypeId}
                        onChange={(e) => setNewBrk((f) => ({ ...f, maintenanceTypeId: e.target.value }))}
                      >
                        <option value="">Select…</option>
                        {brkMasters.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Actual date</span>
                      <input
                        type="date"
                        className={inp}
                        value={newBrk.actualDate}
                        onChange={(e) => setNewBrk((f) => ({ ...f, actualDate: e.target.value }))}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Remarks</span>
                      <input
                        className={inp}
                        value={newBrk.remarks}
                        onChange={(e) => setNewBrk((f) => ({ ...f, remarks: e.target.value }))}
                      />
                    </label>
                  </div>
                  <button type="button" onClick={addBreakdown} className={`${fap.btnPrimary} mt-4`}>
                    Add breakdown record
                  </button>
                </FixedAssetSection>

                <FixedAssetSection title="GPS Tracker details" description="GPS tracker installation and subscription information." defaultExpanded>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={fap.fieldLabel}>Tracker serial number</span>
                      <input
                        className={inp}
                        value={gpsForm.trackerSerialNumber}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerSerialNumber: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Make</span>
                      <input
                        className={inp}
                        value={gpsForm.trackerMake}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerMake: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Model</span>
                      <input
                        className={inp}
                        value={gpsForm.trackerModel}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerModel: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Installed date</span>
                      <input
                        type="date"
                        className={inp}
                        value={gpsForm.trackerInstalledDate}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerInstalledDate: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>SIM subscription start date</span>
                      <input
                        type="date"
                        className={inp}
                        value={gpsForm.simSubscriptionStartDate}
                        onChange={(e) =>
                          setGpsForm((f) => ({ ...f, simSubscriptionStartDate: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>De-install date</span>
                      <input
                        type="date"
                        className={inp}
                        value={gpsForm.trackerDeinstallDate}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerDeinstallDate: e.target.value }))}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Remarks</span>
                      <textarea
                        rows={3}
                        className={inp}
                        value={gpsForm.trackerRemarks}
                        onChange={(e) => setGpsForm((f) => ({ ...f, trackerRemarks: e.target.value }))}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={saveGps}
                    disabled={gpsSaving}
                    className={`${fap.btnPrimary} mt-4`}
                  >
                    {gpsSaving ? 'Saving…' : 'Save GPS tracker details'}
                  </button>
                </FixedAssetSection>

                <CustomDetailsSection assetType="transport" assetnumber={assetnumber} />
              </div>

              <aside className={`${fap.sidebarSticky} space-y-4`}>
                <div className={`${fap.card} ${fap.cardPadding} text-center`}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">QR Code</h2>
                  <div className="mx-auto inline-flex rounded-xl bg-white p-4">
                    <AssetQRCode
                      assetNumber={asset.assetnumber}
                      assetDescription={asset.assetdescription}
                      assetType="transportasset"
                    />
                  </div>
                  <p className="mt-4 font-mono text-sm text-[#00B4D8]">{asset.assetnumber}</p>
                  <p className="mt-1 text-xs text-[#64748B]">Scan to view this asset</p>
                </div>
                <div className={`${fap.card} ${fap.cardPadding}`}>
                  <h2 className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Quick info</h2>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className={fap.fieldLabel}>Subcategory</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.assetsubcategory || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Chassis number</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.chassisNumber || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Engine number</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.engineNumber || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Model / Year</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">
                        {[asset.vehicleModel, asset.modelYear !== null && asset.modelYear !== undefined ? String(asset.modelYear) : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>GPS tracker</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.trackerSerialNumber || '—'}</dd>
                    </div>
                  </dl>
                  <Link href="/fixedasset/transport-assets" className={`${fap.btnSecondary} mt-4 w-full`}>
                    Back to list
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}

        {editPrev && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-md`}>
              <h3 className="mb-4 text-lg font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Edit preventive record</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className={fap.fieldLabel}>Type</span>
                  <select
                    className={inp}
                    value={editPrevForm.maintenanceTypeId}
                    onChange={(e) => setEditPrevForm((f) => ({ ...f, maintenanceTypeId: e.target.value }))}
                  >
                    {prevMasters.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Scheduled date</span>
                  <input
                    type="date"
                    className={inp}
                    value={editPrevForm.scheduledDate}
                    onChange={(e) => setEditPrevForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Actual date</span>
                  <input
                    type="date"
                    className={inp}
                    value={editPrevForm.actualDate}
                    onChange={(e) => setEditPrevForm((f) => ({ ...f, actualDate: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Remarks</span>
                  <input
                    className={inp}
                    value={editPrevForm.remarks}
                    onChange={(e) => setEditPrevForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditPrev(null)} className={fap.btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={saveEditPrev} className={fap.btnPrimary}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {editBrk && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-md`}>
              <h3 className="mb-4 text-lg font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Edit breakdown record</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className={fap.fieldLabel}>Type</span>
                  <select
                    className={inp}
                    value={editBrkForm.maintenanceTypeId}
                    onChange={(e) => setEditBrkForm((f) => ({ ...f, maintenanceTypeId: e.target.value }))}
                  >
                    {brkMasters.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Actual date</span>
                  <input
                    type="date"
                    className={inp}
                    value={editBrkForm.actualDate}
                    onChange={(e) => setEditBrkForm((f) => ({ ...f, actualDate: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Remarks</span>
                  <input
                    className={inp}
                    value={editBrkForm.remarks}
                    onChange={(e) => setEditBrkForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditBrk(null)} className={fap.btnSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={saveEditBrk} className={fap.btnPrimary}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
    </FixedAssetDetailShell>
  );
}
