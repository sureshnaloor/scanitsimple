'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Tag, MapPin, Calendar } from 'lucide-react';

import AssetDetails from '../../components/AssetDetails';
import CalibrationDetails from '../../components/CalibrationDetails';
import CustodyDetails from '../../components/CustodyDetails';
import CustomDetailsSection from '@/app/components/CustomDetailsSection';
import FixedAssetBreadcrumb from '@/app/components/fixedasset/FixedAssetBreadcrumb';
import FixedAssetSection from '@/app/components/fixedasset/FixedAssetSection';
import FixedAssetStatusBadge from '@/app/components/fixedasset/FixedAssetStatusBadge';
import { AssetQRCode } from '@/components/AssetQRCode';
import { AssetData, Calibration } from '@/types/asset';
import { Custody } from '@/types/custody';
import FixedAssetDetailShell from '@/app/components/fixedasset/FixedAssetDetailShell';
import { fap, formatCurrency } from '@/lib/fixedAssetPageDesign';

type MMEDetail = AssetData & {
  location?: string;
  department?: string;
  acquireddate?: string | Date | null;
  acquiredvalue?: number | null;
};

function dOut(v: string | Date | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetnumber = typeof params?.assetnumber === 'string' ? params.assetnumber : '';

  const [asset, setAsset] = useState<MMEDetail | null>(null);
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [custodyRecords, setCustodyRecords] = useState<Custody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assetRes, calibrationData, custodyData] = await Promise.all([
        fetch(`/api/assets/${assetnumber}`),
        fetch(`/api/calibrations/${assetnumber}`).then((res) => res.json()),
        fetch(`/api/custody/${assetnumber}`).then((res) => res.json()),
      ]);

      if (!assetRes.ok) {
        const body = await assetRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load asset data');
      }
      const assetData = await assetRes.json();

      setAsset(assetData);
      // The calibration/custody APIs return a 404 { error } body when no
      // records exist — treat those as empty history, not errors.
      setCalibrations(Array.isArray(calibrationData) ? calibrationData : []);
      setCustodyRecords(Array.isArray(custodyData) ? custodyData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load asset data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetnumber) {
      fetchData();
    }
  }, [assetnumber]);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'calibration' || hash === 'custody') {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  const handleAssetUpdate = async (updatedAsset: Partial<AssetData>) => {
    try {
      const updatePayload = {
        assetcategory: updatedAsset.assetcategory,
        assetsubcategory: updatedAsset.assetsubcategory,
        assetstatus: updatedAsset.assetstatus,
        assetnotes: updatedAsset.assetnotes,
        assetmodel: updatedAsset.assetmodel,
        assetmanufacturer: updatedAsset.assetmanufacturer,
        assetserialnumber: updatedAsset.assetserialnumber,
        accessories: updatedAsset.accessories,
        legacyassetnumber: updatedAsset.legacyassetnumber,
        anyotheridentifier: updatedAsset.anyotheridentifier,
      };

      const res = await fetch(`/api/assets/${assetnumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Update failed:', {
          status: res.status,
          statusText: res.statusText,
          data,
        });
        throw new Error(data.error || `Failed to update asset: ${res.status}`);
      }

      setAsset((prevAsset) => {
        if (!prevAsset) return data;
        return {
          ...prevAsset,
          ...updatePayload,
        };
      });
    } catch (err) {
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const handleCalibrationUpdate = async (calibration: Calibration | null) => {
    try {
      if (!calibration) return;
      const response = await fetch(`/api/calibrations/${assetnumber}`);
      if (!response.ok) throw new Error('Failed to fetch updated calibrations');
      const newCalibrationData = await response.json();
      setCalibrations(Array.isArray(newCalibrationData) ? newCalibrationData : []);
    } catch (err) {
      console.error('Error updating calibrations:', err);
    }
  };

  const handleCustodyUpdate = async (custody: Custody | null) => {
    try {
      const response = await fetch(`/api/custody/${assetnumber}`);
      if (!response.ok) {
        throw new Error(
          response.status === 404 ? 'No custody records maintained' : 'Failed to fetch custody records'
        );
      }
      const updatedRecords = await response.json();
      setCustodyRecords(Array.isArray(updatedRecords) ? updatedRecords : []);
    } catch (err) {
      console.error('Error updating custody records:', err);
    }
  };

  const handleLogLocation = () => {
    router.push(`/loglocation?asset=${assetnumber}&source=asset`);
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
        <FixedAssetBreadcrumb
          items={[
            { label: 'MME Equipment', href: '/mme' },
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
                  <Wrench className="h-12 w-12 text-[#00B4D8]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={fap.idBadge}>
                    <Tag className="h-3.5 w-3.5" />
                    {asset.assetnumber}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold text-[#0F172A] dark:text-[#F8F9FA] md:text-4xl">
                    {asset.assetdescription || '—'}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {asset.assetcategory ? (
                      <span className="rounded-full bg-[rgba(0,180,216,0.15)] px-3 py-1 text-xs font-semibold text-[#00B4D8]">
                        {asset.assetcategory}
                      </span>
                    ) : null}
                    <FixedAssetStatusBadge status={asset.assetstatus ?? ''} />
                    <span className="text-base font-bold text-[#0F172A] dark:text-[#F8F9FA]">
                      {formatCurrency(asset.acquiredvalue)}
                    </span>
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Department</p>
                      <p className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.department || '—'}</p>
                    </div>
                    <div className="flex items-start gap-2 text-[#475569] dark:text-[#94A3B8]">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Acquired</p>
                        <p className="text-[#0F172A] dark:text-[#F8F9FA]">{dOut(asset.acquireddate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <FixedAssetSection title="Asset Details" defaultExpanded>
                  <AssetDetails asset={asset} onUpdate={handleAssetUpdate} />
                </FixedAssetSection>

                <FixedAssetSection title="Calibration Details" sectionId="calibration" defaultExpanded>
                  <CalibrationDetails
                    currentCalibration={calibrations.length > 0 ? calibrations[0] : null}
                    calibrationHistory={calibrations.length > 1 ? calibrations.slice(1) : []}
                    onUpdate={handleCalibrationUpdate}
                    assetnumber={assetnumber}
                  />
                </FixedAssetSection>

                <FixedAssetSection title="Custody Details" sectionId="custody" defaultExpanded>
                  <CustodyDetails
                    currentCustody={custodyRecords.length > 0 ? custodyRecords[0] : null}
                    custodyHistory={custodyRecords.length > 1 ? custodyRecords.slice(1) : []}
                    onUpdate={handleCustodyUpdate}
                    assetnumber={assetnumber}
                    custodyNewHref={`/asset/${assetnumber}/custody/new`}
                  />
                </FixedAssetSection>

                <CustomDetailsSection assetType="mme" assetnumber={assetnumber} />
              </div>

              <aside className={`${fap.sidebarSticky} space-y-4`}>
                <div className={`${fap.card} ${fap.cardPadding} text-center`}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#64748B]">QR Code</h2>
                  <div className="mx-auto inline-flex rounded-xl bg-white p-4">
                    <AssetQRCode
                      assetNumber={asset.assetnumber}
                      assetDescription={asset.assetdescription}
                      assetType="mme"
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
                      <dt className={fap.fieldLabel}>Model</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.assetmodel || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Manufacturer</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.assetmanufacturer || '—'}</dd>
                    </div>
                    <div>
                      <dt className={fap.fieldLabel}>Serial number</dt>
                      <dd className="text-[#0F172A] dark:text-[#F8F9FA]">{asset.assetserialnumber || '—'}</dd>
                    </div>
                  </dl>
                  <button type="button" onClick={handleLogLocation} className={`${fap.btnPrimary} mt-4 w-full`}>
                    <MapPin className="h-4 w-4" />
                    Log Location
                  </button>
                  <Link href="/mme" className={`${fap.btnSecondary} mt-3 w-full`}>
                    Back to list
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
    </FixedAssetDetailShell>
  );
}
