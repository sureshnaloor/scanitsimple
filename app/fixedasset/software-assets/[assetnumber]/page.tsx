'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import { AssetQRCode } from '@/components/AssetQRCode';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';
import FixedAssetDetailShell from '@/app/components/fixedasset/FixedAssetDetailShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';

export type LicenseType = 'perpetual' | 'annual' | 'other_periodic' | '';

export interface SoftwareAssetDetail {
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
  deviceAssetNumber?: string;
  deviceSerialNumber?: string;
  deviceLocation?: string;
  licenseNumber?: string;
  licenseType?: LicenseType;
  licenseStartDate?: string | Date | null;
  licenseEndDate?: string | Date | null;
  licenseRemarks?: string;
}

function formatDateInput(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SoftwareAssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetnumber = typeof params?.assetnumber === 'string' ? params.assetnumber : '';

  const [asset, setAsset] = useState<SoftwareAssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topSaving, setTopSaving] = useState(false);
  const [licenseSaving, setLicenseSaving] = useState(false);

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

  const [licenseForm, setLicenseForm] = useState({
    deviceAssetNumber: '',
    deviceSerialNumber: '',
    deviceLocation: '',
    licenseNumber: '',
    licenseType: '' as LicenseType,
    licenseStartDate: '',
    licenseEndDate: '',
    licenseRemarks: ''
  });

  const load = useCallback(async () => {
    if (!assetnumber) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/softwareassets/${encodeURIComponent(assetnumber)}`);
      if (res.status === 404) {
        setError('Software asset not found.');
        setAsset(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to load software asset');
      const data: SoftwareAssetDetail = await res.json();
      setAsset(data);
      setTopForm({
        assetdescription: data.assetdescription ?? '',
        assetcategory: data.assetcategory ?? '',
        assetsubcategory: data.assetsubcategory ?? '',
        assetstatus: data.assetstatus ?? '',
        acquiredvalue:
          data.acquiredvalue !== null && data.acquiredvalue !== undefined
            ? String(data.acquiredvalue)
            : '',
        acquireddate: formatDateInput(data.acquireddate),
        location: data.location ?? '',
        department: data.department ?? ''
      });
      setLicenseForm({
        deviceAssetNumber: data.deviceAssetNumber ?? '',
        deviceSerialNumber: data.deviceSerialNumber ?? '',
        deviceLocation: data.deviceLocation ?? '',
        licenseNumber: data.licenseNumber ?? '',
        licenseType: (data.licenseType as LicenseType) ?? '',
        licenseStartDate: formatDateInput(data.licenseStartDate),
        licenseEndDate: formatDateInput(data.licenseEndDate),
        licenseRemarks: data.licenseRemarks ?? ''
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [assetnumber]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTop = async () => {
    if (!assetnumber) return;
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
      if (topForm.acquiredvalue.trim() !== '') {
        body.acquiredvalue = Number(topForm.acquiredvalue);
      } else {
        body.acquiredvalue = null;
      }
      body.acquireddate = topForm.acquireddate || null;

      const res = await fetch(`/api/softwareassets/${encodeURIComponent(assetnumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || 'Save failed');
      setAsset(json as SoftwareAssetDetail);
      alert('Asset details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setTopSaving(false);
    }
  };

  const saveLicense = async () => {
    if (!assetnumber) return;
    try {
      setLicenseSaving(true);
      const body: Record<string, unknown> = {
        deviceAssetNumber: licenseForm.deviceAssetNumber,
        deviceSerialNumber: licenseForm.deviceSerialNumber,
        deviceLocation: licenseForm.deviceLocation,
        licenseNumber: licenseForm.licenseNumber,
        licenseType: licenseForm.licenseType || '',
        licenseRemarks: licenseForm.licenseRemarks
      };
      body.licenseStartDate =
        licenseForm.licenseType === 'perpetual' ? null : licenseForm.licenseStartDate || null;
      body.licenseEndDate =
        licenseForm.licenseType === 'perpetual' ? null : licenseForm.licenseEndDate || null;

      const res = await fetch(`/api/softwareassets/${encodeURIComponent(assetnumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error || 'Save failed');
      setAsset(json as SoftwareAssetDetail);
      alert('Installation and license details saved.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLicenseSaving(false);
    }
  };

  if (!assetnumber) {
    return (
      <FixedAssetDetailShell>
        <p className={fap.textPrimary}>Invalid asset.</p>
      </FixedAssetDetailShell>
    );
  }

  return (
    <FixedAssetDetailShell>
      <div className="flex flex-col gap-4">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/fixedasset/software-assets')}
            className={`text-sm font-medium ${fap.link}`}
          >
            ← Software assets list
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className={fap.spinner} />
          </div>
        )}

        {!loading && error && <div className={fap.errorBox}>{error}</div>}

        {!loading && asset && (
          <main className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            <div className={`${fap.card} ${fap.cardPadding}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-[#00B4D8]">Software asset</p>
                  <h1 className={`mt-1 ${fap.title}`}>{asset.assetnumber}</h1>
                  <p className={`mt-2 text-sm ${fap.textSecondary}`}>
                    Quick read-only summary — edit fields in the sections below.
                  </p>
                </div>
                <div className={`shrink-0 rounded-xl border border-slate-200 p-3 dark:border-[#2A3B4C]/50`}>
                  <p className={`mb-2 text-xs ${fap.textMuted}`}>QR code</p>
                  <AssetQRCode
                    assetNumber={asset.assetnumber}
                    assetDescription={asset.assetdescription}
                    assetType="softwareasset"
                  />
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className={fap.textMuted}>Name / description</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>{asset.assetdescription || '—'}</dd>
                </div>
                <div>
                  <dt className={fap.textMuted}>Category</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>{asset.assetcategory || '—'}</dd>
                </div>
                <div>
                  <dt className={fap.textMuted}>Subcategory</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>{asset.assetsubcategory || '—'}</dd>
                </div>
                <div>
                  <dt className={fap.textMuted}>Status</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>{asset.assetstatus || '—'}</dd>
                </div>
                <div>
                  <dt className={fap.textMuted}>Acquisition value</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>
                    {typeof asset.acquiredvalue === 'number' ? formatCurrency(asset.acquiredvalue) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className={fap.textMuted}>Acquisition date</dt>
                  <dd className={`font-medium ${fap.textPrimary}`}>{formatDisplayDate(asset.acquireddate)}</dd>
                </div>
              </dl>
            </div>

            <FixedAssetSection title="Edit asset details" defaultExpanded>
              <div className="w-full max-w-3xl space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={fap.fieldLabel}>Name / description</span>
                    <input
                      className={fap.input}
                      value={topForm.assetdescription}
                      onChange={(e) => setTopForm((f) => ({ ...f, assetdescription: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Category</span>
                    <input className={fap.input}
                      value={topForm.assetcategory}
                      onChange={(e) => setTopForm((f) => ({ ...f, assetcategory: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Subcategory</span>
                    <input className={fap.input}
                      value={topForm.assetsubcategory}
                      onChange={(e) => setTopForm((f) => ({ ...f, assetsubcategory: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Status</span>
                    <input className={fap.input}
                      value={topForm.assetstatus}
                      onChange={(e) => setTopForm((f) => ({ ...f, assetstatus: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Acquisition value</span>
                    <input
                      type="number"
                      step="any"
                      className={fap.input}
                      value={topForm.acquiredvalue}
                      onChange={(e) => setTopForm((f) => ({ ...f, acquiredvalue: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Acquisition date</span>
                    <input type="date" className={fap.input}
                      value={topForm.acquireddate}
                      onChange={(e) => setTopForm((f) => ({ ...f, acquireddate: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Location</span>
                    <input className={fap.input}
                      value={topForm.location}
                      onChange={(e) => setTopForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Department</span>
                    <input className={fap.input}
                      value={topForm.department}
                      onChange={(e) => setTopForm((f) => ({ ...f, department: e.target.value }))}
                    />
                  </label>
                </div>
                <button type="button" onClick={saveTop} disabled={topSaving} className={fap.btnPrimary}>
                  {topSaving ? 'Saving…' : 'Save asset details'}
                </button>
              </div>
            </FixedAssetSection>

            <FixedAssetSection title="Installation device & license" defaultExpanded>
              <div className="w-full max-w-3xl space-y-4">
                <p className={`text-sm ${fap.textSecondary}`}>
                  Record where the software is installed and how it is licensed. Use device asset number and/or serial
                  as applicable.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={fap.fieldLabel}>Device asset number</span>
                    <input className={fap.input}
                      value={licenseForm.deviceAssetNumber}
                      onChange={(e) =>
                        setLicenseForm((f) => ({ ...f, deviceAssetNumber: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label className="block">
                    <span className={fap.fieldLabel}>Device serial number</span>
                    <input className={fap.input}
                      value={licenseForm.deviceSerialNumber}
                      onChange={(e) =>
                        setLicenseForm((f) => ({ ...f, deviceSerialNumber: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={fap.fieldLabel}>Device location</span>
                    <input className={fap.input}
                      value={licenseForm.deviceLocation}
                      onChange={(e) =>
                        setLicenseForm((f) => ({ ...f, deviceLocation: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={fap.fieldLabel}>License number</span>
                    <input className={fap.input}
                      value={licenseForm.licenseNumber}
                      onChange={(e) => setLicenseForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={fap.fieldLabel}>License type</span>
                    <select className={fap.select}
                      value={licenseForm.licenseType}
                      onChange={(e) =>
                        setLicenseForm((f) => ({
                          ...f,
                          licenseType: e.target.value as LicenseType
                        }))
                      }
                    >
                      <option value="">Not specified</option>
                      <option value="perpetual">Perpetual</option>
                      <option value="annual">Annual</option>
                      <option value="other_periodic">Other periodic</option>
                    </select>
                  </label>
                  {licenseForm.licenseType !== 'perpetual' && licenseForm.licenseType !== '' && (
                    <>
                      <label className="block">
                        <span className={fap.fieldLabel}>License start date</span>
                        <input type="date" className={fap.input}
                          value={licenseForm.licenseStartDate}
                          onChange={(e) =>
                            setLicenseForm((f) => ({ ...f, licenseStartDate: e.target.value }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className={fap.fieldLabel}>End / expiry date</span>
                        <input type="date" className={fap.input}
                          value={licenseForm.licenseEndDate}
                          onChange={(e) =>
                            setLicenseForm((f) => ({ ...f, licenseEndDate: e.target.value }))
                          }
                        />
                      </label>
                    </>
                  )}
                  <label className="block sm:col-span-2">
                    <span className={fap.fieldLabel}>Remarks</span>
                    <textarea
                      rows={3}
                      className={fap.input}
                      value={licenseForm.licenseRemarks}
                      onChange={(e) =>
                        setLicenseForm((f) => ({ ...f, licenseRemarks: e.target.value }))
                      }
                      placeholder="Notes, renewal contacts, etc."
                    />
                  </label>
                </div>
                <button type="button" onClick={saveLicense} disabled={licenseSaving} className={fap.btnPrimary}>
                  {licenseSaving ? 'Saving…' : 'Save installation & license'}
                </button>
              </div>
            </FixedAssetSection>

            <CustomDetailsSection assetType="software" assetnumber={assetnumber} />

            <div className="pb-8 text-center">
              <Link href="/fixedasset/software-assets" className={`text-sm ${fap.link}`}>
                Back to list
              </Link>
            </div>
          </main>
        )}
      </div>
    </FixedAssetDetailShell>
  );
}
