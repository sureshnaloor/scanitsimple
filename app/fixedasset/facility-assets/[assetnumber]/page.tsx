'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Calendar, MapPin, Tag } from 'lucide-react';

import FixedAssetBreadcrumb from '@/app/components/fixedasset/FixedAssetBreadcrumb';
import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import { AssetQRCode } from '@/components/AssetQRCode';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';
import FixedAssetDetailShell from '@/app/components/fixedasset/FixedAssetDetailShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';

interface FacilityDetail {
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
  amcStartDate?: string | Date | null;
  amcEndDate?: string | Date | null;
  amcCompanyName?: string;
  amcContactPhone?: string;
  amcContactPersonName?: string;
  amcTollFreeNumber?: string;
}

interface OncallRecord {
  _id: string;
  recordType: 'service' | 'repair';
  actualDate?: string | Date | null;
  remarks?: string;
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  service: 'Service',
  repair: 'Repair'
};

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

export default function FacilityAssetDetailPage() {
  const params = useParams();
  const assetnumber = typeof params?.assetnumber === 'string' ? params.assetnumber : '';

  const [asset, setAsset] = useState<FacilityDetail | null>(null);
  const [oncall, setOncall] = useState<OncallRecord[]>([]);
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
    department: ''
  });

  const [amcSaving, setAmcSaving] = useState(false);
  const [amcForm, setAmcForm] = useState({
    amcStartDate: '',
    amcEndDate: '',
    amcCompanyName: '',
    amcContactPhone: '',
    amcContactPersonName: '',
    amcTollFreeNumber: ''
  });

  const [newOncall, setNewOncall] = useState({
    recordType: 'service' as 'service' | 'repair',
    actualDate: '',
    remarks: ''
  });

  const [editOncall, setEditOncall] = useState<OncallRecord | null>(null);
  const [editOncallForm, setEditOncallForm] = useState({
    recordType: 'service' as 'service' | 'repair',
    actualDate: '',
    remarks: ''
  });

  const base = `/api/facilityassets/${encodeURIComponent(assetnumber)}`;

  const loadAsset = useCallback(async () => {
    const res = await fetch(base);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to load asset');
    return (await res.json()) as FacilityDetail;
  }, [base]);

  const loadOncall = useCallback(async () => {
    const res = await fetch(`${base}/oncall-maintenance`);
    if (!res.ok) throw new Error('Failed to load on-call maintenance records');
    return (await res.json()) as OncallRecord[];
  }, [base]);

  const load = useCallback(async () => {
    if (!assetnumber) return;
    try {
      setLoading(true);
      setError(null);
      const a = await loadAsset();
      if (!a) {
        setError('Facility asset not found.');
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
        department: a.department ?? ''
      });
      setAmcForm({
        amcStartDate: dIn(a.amcStartDate),
        amcEndDate: dIn(a.amcEndDate),
        amcCompanyName: a.amcCompanyName ?? '',
        amcContactPhone: a.amcContactPhone ?? '',
        amcContactPersonName: a.amcContactPersonName ?? '',
        amcTollFreeNumber: a.amcTollFreeNumber ?? ''
      });
      setOncall(await loadOncall());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [assetnumber, loadAsset, loadOncall]);

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
        department: topForm.department
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
      setAsset(json as FacilityDetail);
      alert('Asset details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setTopSaving(false);
    }
  };

  const saveAmc = async () => {
    try {
      setAmcSaving(true);
      const body = {
        amcStartDate: amcForm.amcStartDate || null,
        amcEndDate: amcForm.amcEndDate || null,
        amcCompanyName: amcForm.amcCompanyName,
        amcContactPhone: amcForm.amcContactPhone,
        amcContactPersonName: amcForm.amcContactPersonName,
        amcTollFreeNumber: amcForm.amcTollFreeNumber
      };

      const res = await fetch(base, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || 'Save failed');
      setAsset(json as FacilityDetail);
      alert('AMC details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setAmcSaving(false);
    }
  };

  const addOncall = async () => {
    try {
      const res = await fetch(`${base}/oncall-maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType: newOncall.recordType,
          actualDate: newOncall.actualDate || null,
          remarks: newOncall.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Failed to add');
      setNewOncall({ recordType: 'service', actualDate: '', remarks: '' });
      setOncall(await loadOncall());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deleteOncall = async (id: string) => {
    if (!confirm('Delete this on-call maintenance record?')) return;
    try {
      const res = await fetch(`${base}/oncall-maintenance/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setOncall(await loadOncall());
    } catch {
      alert('Delete failed');
    }
  };

  const openEditOncall = (r: OncallRecord) => {
    setEditOncall(r);
    setEditOncallForm({
      recordType: r.recordType,
      actualDate: dIn(r.actualDate),
      remarks: r.remarks ?? ''
    });
  };

  const saveEditOncall = async () => {
    if (!editOncall) return;
    try {
      const res = await fetch(`${base}/oncall-maintenance/${encodeURIComponent(editOncall._id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType: editOncallForm.recordType,
          actualDate: editOncallForm.actualDate || null,
          remarks: editOncallForm.remarks
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Update failed');
      setEditOncall(null);
      setOncall(await loadOncall());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
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
            { label: 'Facility Assets', href: '/fixedasset/facility-assets' },
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
                  <Building2 className="h-12 w-12 text-[#00B4D8]" strokeWidth={1.5} />
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
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">AMC expiry</p>
                      <p className="text-[#0F172A] dark:text-[#F8F9FA]">{dOut(asset.amcEndDate)}</p>
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
                      <input className={inp} value={topForm.assetdescription} onChange={(e) => setTopForm((f) => ({ ...f, assetdescription: e.target.value }))} />
                    </label>
                    {(
                      [
                        ['assetcategory', 'Category'],
                        ['assetsubcategory', 'Subcategory'],
                        ['assetstatus', 'Status'],
                        ['location', 'Location'],
                        ['department', 'Department'],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className="block">
                        <span className={fap.fieldLabel}>{label}</span>
                        <input className={inp} value={topForm[k]} onChange={(e) => setTopForm((f) => ({ ...f, [k]: e.target.value }))} />
                      </label>
                    ))}
                    <label className="block">
                      <span className={fap.fieldLabel}>Acquisition value</span>
                      <input type="number" step="any" className={inp} value={topForm.acquiredvalue} onChange={(e) => setTopForm((f) => ({ ...f, acquiredvalue: e.target.value }))} />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Acquisition date</span>
                      <input type="date" className={inp} value={topForm.acquireddate} onChange={(e) => setTopForm((f) => ({ ...f, acquireddate: e.target.value }))} />
                    </label>
                  </div>
                  <button type="button" onClick={saveTop} disabled={topSaving} className={`${fap.btnPrimary} mt-4`}>
                    {topSaving ? 'Saving…' : 'Save asset details'}
                  </button>
                </FixedAssetSection>

                <FixedAssetSection title="AMC (Annual Maintenance Contract)" description="Annual maintenance contract details for this facility asset." defaultExpanded>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={fap.fieldLabel}>AMC start date</span>
                      <input type="date" className={inp} value={amcForm.amcStartDate} onChange={(e) => setAmcForm((f) => ({ ...f, amcStartDate: e.target.value }))} />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>AMC end / expiry date</span>
                      <input type="date" className={inp} value={amcForm.amcEndDate} onChange={(e) => setAmcForm((f) => ({ ...f, amcEndDate: e.target.value }))} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Company name</span>
                      <input className={inp} value={amcForm.amcCompanyName} onChange={(e) => setAmcForm((f) => ({ ...f, amcCompanyName: e.target.value }))} />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Contact phone number</span>
                      <input className={inp} value={amcForm.amcContactPhone} onChange={(e) => setAmcForm((f) => ({ ...f, amcContactPhone: e.target.value }))} />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Contact person name</span>
                      <input className={inp} value={amcForm.amcContactPersonName} onChange={(e) => setAmcForm((f) => ({ ...f, amcContactPersonName: e.target.value }))} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Toll-free number (optional)</span>
                      <input className={inp} value={amcForm.amcTollFreeNumber} onChange={(e) => setAmcForm((f) => ({ ...f, amcTollFreeNumber: e.target.value }))} placeholder="If available" />
                    </label>
                  </div>
                  <button type="button" onClick={saveAmc} disabled={amcSaving} className={`${fap.btnPrimary} mt-4`}>
                    {amcSaving ? 'Saving…' : 'Save AMC details'}
                  </button>
                </FixedAssetSection>

                <FixedAssetSection title="On-call maintenance" description="Log service and repair work performed on an on-call basis." defaultExpanded>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#2A3B4C] text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]">
                        <tr>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Remarks</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {oncall.map((r, index) => (
                          <tr key={r._id} className={`border-t border-slate-200/70 dark:border-[#2A3B4C]/30 text-[#0F172A] dark:text-[#F8F9FA] ${index % 2 === 0 ? 'bg-white dark:bg-[#111827]' : 'bg-slate-50 dark:bg-[#1E293B]'}`}>
                            <td className="px-3 py-2">{RECORD_TYPE_LABELS[r.recordType] ?? r.recordType}</td>
                            <td className="px-3 py-2">{dOut(r.actualDate)}</td>
                            <td className="max-w-[240px] truncate px-3 py-2">{r.remarks || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <button type="button" onClick={() => openEditOncall(r)} className="mr-2 text-xs text-[#00B4D8] hover:underline">Edit</button>
                              <button type="button" onClick={() => deleteOncall(r._id)} className="text-xs text-[#EF4444] hover:underline">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-slate-200 dark:border-[#2A3B4C]/50 pt-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={fap.fieldLabel}>Type</span>
                      <select className={inp} value={newOncall.recordType} onChange={(e) => setNewOncall((f) => ({ ...f, recordType: e.target.value as 'service' | 'repair' }))}>
                        <option value="service">Service</option>
                        <option value="repair">Repair</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Date</span>
                      <input type="date" className={inp} value={newOncall.actualDate} onChange={(e) => setNewOncall((f) => ({ ...f, actualDate: e.target.value }))} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Remarks</span>
                      <input className={inp} value={newOncall.remarks} onChange={(e) => setNewOncall((f) => ({ ...f, remarks: e.target.value }))} />
                    </label>
                  </div>
                  <button type="button" onClick={addOncall} className={`${fap.btnPrimary} mt-4`}>Add on-call record</button>
                </FixedAssetSection>

                <CustomDetailsSection assetType="facility" assetnumber={assetnumber} />
              </div>

              <aside className={`${fap.sidebarSticky} space-y-4`}>
                <div className={`${fap.card} ${fap.cardPadding} text-center`}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">QR Code</h2>
                  <div className="mx-auto inline-flex rounded-xl bg-white p-4">
                    <AssetQRCode assetNumber={asset.assetnumber} assetDescription={asset.assetdescription} assetType="facilityasset" />
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
                      <dt className={fap.fieldLabel}>AMC company</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.amcCompanyName || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>AMC contact</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.amcContactPersonName || '—'}</dd>
                    </div>
                  </dl>
                  <Link href="/fixedasset/facility-assets" className={`${fap.btnSecondary} mt-4 w-full`}>
                    Back to list
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}

        {editOncall && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-md`}>
              <h3 className="mb-4 text-lg font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Edit on-call record</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className={fap.fieldLabel}>Type</span>
                  <select className={inp} value={editOncallForm.recordType} onChange={(e) => setEditOncallForm((f) => ({ ...f, recordType: e.target.value as 'service' | 'repair' }))}>
                    <option value="service">Service</option>
                    <option value="repair">Repair</option>
                  </select>
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Date</span>
                  <input type="date" className={inp} value={editOncallForm.actualDate} onChange={(e) => setEditOncallForm((f) => ({ ...f, actualDate: e.target.value }))} />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Remarks</span>
                  <input className={inp} value={editOncallForm.remarks} onChange={(e) => setEditOncallForm((f) => ({ ...f, remarks: e.target.value }))} />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditOncall(null)} className={fap.btnSecondary}>Cancel</button>
                <button type="button" onClick={saveEditOncall} className={fap.btnPrimary}>Save</button>
              </div>
            </div>
          </div>
        )}
    </FixedAssetDetailShell>
  );
}
