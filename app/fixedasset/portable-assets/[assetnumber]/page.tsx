'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Calendar, MapPin, Tag } from 'lucide-react';

import FixedAssetBreadcrumb from '@/app/components/fixedasset/FixedAssetBreadcrumb';
import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import { AssetQRCode } from '@/components/AssetQRCode';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';
import FixedAssetDetailShell from '@/app/components/fixedasset/FixedAssetDetailShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';

type PortableTypeValue = '' | 'pre_engineered' | 'container_20' | 'container_40' | 'prefabricated_sheet';

const PORTABLE_LABELS: Record<string, string> = {
  '': '—',
  pre_engineered: 'Pre engineered',
  container_20: "Container 20'",
  container_40: "Container 40'",
  prefabricated_sheet: 'Prefabricated sheet type'
};

interface PortableDetail {
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
  portableType?: string;
  installationLocation?: string;
}

interface Modification {
  _id: string;
  entryKind: 'material' | 'service';
  category: string;
  description: string;
  remarks?: string;
  workDate?: string | Date | null;
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

export default function PortableAssetDetailPage() {
  const params = useParams();
  const assetnumber = typeof params?.assetnumber === 'string' ? params.assetnumber : '';

  const [asset, setAsset] = useState<PortableDetail | null>(null);
  const [mods, setMods] = useState<Modification[]>([]);
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
    portableType: '' as PortableTypeValue,
    installationLocation: ''
  });

  const [newMod, setNewMod] = useState({
    entryKind: 'service' as 'material' | 'service',
    category: '',
    description: '',
    workDate: '',
    remarks: ''
  });

  const [editMod, setEditMod] = useState<Modification | null>(null);
  const [editModForm, setEditModForm] = useState({
    entryKind: 'service' as 'material' | 'service',
    category: '',
    description: '',
    workDate: '',
    remarks: ''
  });

  const base = `/api/portableassets/${encodeURIComponent(assetnumber)}`;

  const load = useCallback(async () => {
    if (!assetnumber) return;
    try {
      setLoading(true);
      setError(null);
      const [ar, mr] = await Promise.all([
        fetch(base),
        fetch(`${base}/modifications`)
      ]);
      if (ar.status === 404) {
        setError('Portable asset not found.');
        setAsset(null);
        return;
      }
      if (!ar.ok) throw new Error('Failed to load asset');
      if (!mr.ok) throw new Error('Failed to load modifications');
      const a = (await ar.json()) as PortableDetail;
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
        portableType: (a.portableType as PortableTypeValue) ?? '',
        installationLocation: a.installationLocation ?? ''
      });
      setMods(await mr.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [assetnumber, base]);

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
        portableType: topForm.portableType || '',
        installationLocation: topForm.installationLocation
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
      setAsset(json as PortableDetail);
      alert('Asset details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setTopSaving(false);
    }
  };

  const addMod = async () => {
    if (!newMod.category.trim() || !newMod.description.trim()) {
      alert('Category and description are required.');
      return;
    }
    try {
      const res = await fetch(`${base}/modifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryKind: newMod.entryKind,
          category: newMod.category.trim(),
          description: newMod.description.trim(),
          remarks: newMod.remarks,
          workDate: newMod.workDate || null
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Failed to add');
      setNewMod({ entryKind: 'service', category: '', description: '', workDate: '', remarks: '' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deleteMod = async (id: string) => {
    if (!confirm('Delete this modification record?')) return;
    try {
      const res = await fetch(`${base}/modifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      load();
    } catch {
      alert('Delete failed');
    }
  };

  const openEditMod = (m: Modification) => {
    setEditMod(m);
    setEditModForm({
      entryKind: m.entryKind,
      category: m.category,
      description: m.description,
      workDate: dIn(m.workDate),
      remarks: m.remarks ?? ''
    });
  };

  const saveEditMod = async () => {
    if (!editMod) return;
    try {
      const res = await fetch(`${base}/modifications/${encodeURIComponent(editMod._id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryKind: editModForm.entryKind,
          category: editModForm.category.trim(),
          description: editModForm.description.trim(),
          remarks: editModForm.remarks,
          workDate: editModForm.workDate || null
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'Update failed');
      setEditMod(null);
      load();
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
            { label: 'Portable Assets', href: '/fixedasset/portable-assets' },
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
                  <Container className="h-12 w-12 text-[#00B4D8]" strokeWidth={1.5} />
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Portable type</p>
                      <p className="text-[#0F172A] dark:text-[#F8F9FA]">
                        {PORTABLE_LABELS[asset.portableType ?? ''] ?? asset.portableType ?? '—'}
                      </p>
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
                      <span className={fap.fieldLabel}>Portable type</span>
                      <select
                        className={inp}
                        value={topForm.portableType}
                        onChange={(e) => setTopForm((f) => ({ ...f, portableType: e.target.value as PortableTypeValue }))}
                      >
                        <option value="">Not set</option>
                        <option value="pre_engineered">Pre engineered</option>
                        <option value="container_20">Container 20&apos;</option>
                        <option value="container_40">Container 40&apos;</option>
                        <option value="prefabricated_sheet">Prefabricated sheet type</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Installation location</span>
                      <input
                        className={inp}
                        value={topForm.installationLocation}
                        onChange={(e) => setTopForm((f) => ({ ...f, installationLocation: e.target.value }))}
                        placeholder="Site / plot / building reference"
                      />
                    </label>
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

                <FixedAssetSection
                  title="Modifications (materials & services)"
                  description="Record materials and services added to the portable unit (e.g. painting, insulation, HVAC, fire systems, plumbing, toilet fit-out)."
                  defaultExpanded
                >
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#2A3B4C]/50">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-[#2A3B4C] text-xs font-semibold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]">
                        <tr>
                          <th className="px-3 py-2">Kind</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Work date</th>
                          <th className="px-3 py-2">Remarks</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {mods.map((m, index) => (
                          <tr key={m._id} className={`border-t border-slate-200/70 dark:border-[#2A3B4C]/30 text-[#0F172A] dark:text-[#F8F9FA] ${index % 2 === 0 ? 'bg-white dark:bg-[#111827]' : 'bg-slate-50 dark:bg-[#1E293B]'}`}>
                            <td className="px-3 py-2 capitalize">{m.entryKind}</td>
                            <td className="px-3 py-2">{m.category}</td>
                            <td className="max-w-[200px] px-3 py-2">{m.description}</td>
                            <td className="whitespace-nowrap px-3 py-2">{dOut(m.workDate)}</td>
                            <td className="max-w-[140px] truncate px-3 py-2">{m.remarks || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <button type="button" onClick={() => openEditMod(m)} className="mr-2 text-xs text-[#00B4D8] hover:underline">Edit</button>
                              <button type="button" onClick={() => deleteMod(m._id)} className="text-xs text-[#EF4444] hover:underline">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-slate-200 dark:border-[#2A3B4C]/50 pt-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={fap.fieldLabel}>Material or service</span>
                      <select
                        className={inp}
                        value={newMod.entryKind}
                        onChange={(e) => setNewMod((f) => ({ ...f, entryKind: e.target.value as 'material' | 'service' }))}
                      >
                        <option value="material">Material</option>
                        <option value="service">Service</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Category</span>
                      <input
                        className={inp}
                        value={newMod.category}
                        onChange={(e) => setNewMod((f) => ({ ...f, category: e.target.value }))}
                        placeholder="e.g. HVAC, painting, plumbing"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Description</span>
                      <input
                        className={inp}
                        value={newMod.description}
                        onChange={(e) => setNewMod((f) => ({ ...f, description: e.target.value }))}
                        placeholder="What was supplied or done"
                      />
                    </label>
                    <label className="block">
                      <span className={fap.fieldLabel}>Work date (optional)</span>
                      <input type="date" className={inp} value={newMod.workDate} onChange={(e) => setNewMod((f) => ({ ...f, workDate: e.target.value }))} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={fap.fieldLabel}>Remarks</span>
                      <input className={inp} value={newMod.remarks} onChange={(e) => setNewMod((f) => ({ ...f, remarks: e.target.value }))} />
                    </label>
                  </div>
                  <button type="button" onClick={addMod} className={`${fap.btnPrimary} mt-4`}>Add modification</button>
                </FixedAssetSection>

                <CustomDetailsSection assetType="portable" assetnumber={assetnumber} />
              </div>

              <aside className={`${fap.sidebarSticky} space-y-4`}>
                <div className={`${fap.card} ${fap.cardPadding} text-center`}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">QR Code</h2>
                  <div className="mx-auto inline-flex rounded-xl bg-white p-4">
                    <AssetQRCode assetNumber={asset.assetnumber} assetDescription={asset.assetdescription} assetType="portableasset" />
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
                      <dt className={fap.fieldLabel}>Portable type</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">
                        {PORTABLE_LABELS[asset.portableType ?? ''] ?? asset.portableType ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Installation location</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.installationLocation || '—'}</dd>
                    </div>
                  </dl>
                  <Link href="/fixedasset/portable-assets" className={`${fap.btnSecondary} mt-4 w-full`}>
                    Back to list
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}

        {editMod && (
          <div className={fap.modalOverlay}>
            <div className={`${fap.modal} max-w-md`}>
              <h3 className="mb-4 text-lg font-semibold text-[#0F172A] dark:text-[#F8F9FA]">Edit modification</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className={fap.fieldLabel}>Kind</span>
                  <select
                    className={inp}
                    value={editModForm.entryKind}
                    onChange={(e) => setEditModForm((f) => ({ ...f, entryKind: e.target.value as 'material' | 'service' }))}
                  >
                    <option value="material">Material</option>
                    <option value="service">Service</option>
                  </select>
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Category</span>
                  <input className={inp} value={editModForm.category} onChange={(e) => setEditModForm((f) => ({ ...f, category: e.target.value }))} />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Description</span>
                  <input className={inp} value={editModForm.description} onChange={(e) => setEditModForm((f) => ({ ...f, description: e.target.value }))} />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Work date</span>
                  <input type="date" className={inp} value={editModForm.workDate} onChange={(e) => setEditModForm((f) => ({ ...f, workDate: e.target.value }))} />
                </label>
                <label className="block">
                  <span className={fap.fieldLabel}>Remarks</span>
                  <input className={inp} value={editModForm.remarks} onChange={(e) => setEditModForm((f) => ({ ...f, remarks: e.target.value }))} />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditMod(null)} className={fap.btnSecondary}>Cancel</button>
                <button type="button" onClick={saveEditMod} className={fap.btnPrimary}>Save</button>
              </div>
            </div>
          </div>
        )}
    </FixedAssetDetailShell>
  );
}
