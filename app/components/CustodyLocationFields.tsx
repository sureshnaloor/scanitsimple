'use client';

import { useEffect, useState } from 'react';
import Select from 'react-select';
import type { CustodyLocationType } from '@/lib/custodyLocation';
import {
  displayCustodyLocationType,
  loadPremisesForCity,
  premisesMongoKindForCustody,
  type PremisesOption,
} from '@/lib/custodyLocation';
import type { Project } from '@/types/custody';

type Props = {
  locationType: CustodyLocationType;
  onLocationTypeChange: (t: CustodyLocationType) => void;
  custodyCity: string;
  onCustodyCityChange: (v: string) => void;
  premisesId: string;
  onPremisesChange: (id: string, label: string) => void;
  /** Camp / offices */
  floorRoom: string;
  onFloorRoomChange: (v: string) => void;
  occupant: string;
  onOccupantChange: (v: string) => void;
  custodyRemark: string;
  onCustodyRemarkChange: (v: string) => void;
  /** Warehouse */
  rackBinPallet: string;
  onRackBinPalletChange: (v: string) => void;
  shedRoomNumber: string;
  onShedRoomNumberChange: (v: string) => void;
  /** Project site */
  projectWbs: string;
  projectName: string;
  onProjectChange: (wbs: string, pname: string) => void;
  custodianDetail: string;
  onCustodianDetailChange: (v: string) => void;
  containerNumberRack: string;
  onContainerNumberRackChange: (v: string) => void;
  warehouseCityNames: string[];
  departmentCityNames: string[];
  locationCitiesLoaded: boolean;
  projects: Project[];
  /** 'modal' = dark slate, 'page' = glass fixed-asset page */
  variant?: 'modal' | 'page';
  /** When set, overrides variant-based input/label classes (e.g. themed error-correction modal) */
  classNames?: { input?: string; label?: string; hint?: string };
};

export default function CustodyLocationFields({
  locationType,
  onLocationTypeChange,
  custodyCity,
  onCustodyCityChange,
  premisesId,
  onPremisesChange,
  floorRoom,
  onFloorRoomChange,
  occupant,
  onOccupantChange,
  custodyRemark,
  onCustodyRemarkChange,
  rackBinPallet,
  onRackBinPalletChange,
  shedRoomNumber,
  onShedRoomNumberChange,
  projectWbs,
  projectName,
  onProjectChange,
  custodianDetail,
  onCustodianDetailChange,
  containerNumberRack,
  onContainerNumberRackChange,
  warehouseCityNames,
  departmentCityNames,
  locationCitiesLoaded,
  projects,
  variant = 'modal',
  classNames,
}: Props) {
  const [premiseOptions, setPremiseOptions] = useState<PremisesOption[]>([]);
  const [loadingPremises, setLoadingPremises] = useState(false);

  const cityList =
    locationType === 'warehouse' ? warehouseCityNames : departmentCityNames;

  const needsPremises = locationType === 'warehouse' || locationType === 'camp/office';

  useEffect(() => {
    let cancelled = false;
    if (!needsPremises) {
      setPremiseOptions([]);
      setLoadingPremises(false);
      return;
    }
    (async () => {
      if (!custodyCity.trim()) {
        setPremiseOptions([]);
        return;
      }
      setLoadingPremises(true);
      const mk = premisesMongoKindForCustody(locationType);
      const opts = await loadPremisesForCity(mk, custodyCity);
      if (!cancelled) setPremiseOptions(opts);
      setLoadingPremises(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [locationType, custodyCity, needsPremises]);

  useEffect(() => {
    if (!needsPremises || !premisesId || premiseOptions.length === 0) return;
    if (!premiseOptions.some((o) => o.id === premisesId)) {
      onPremisesChange('', '');
    }
  }, [premiseOptions, premisesId, onPremisesChange, needsPremises]);

  const inputClass =
    classNames?.input ??
    (variant === 'page'
      ? 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-[rgba(8,145,178,0.2)] dark:border-[#2A3B4C] dark:bg-[#1E293B] dark:text-[#F8F9FA] dark:placeholder:text-[#64748B] dark:focus:border-[#00B4D8] dark:focus:ring-[rgba(0,180,216,0.25)]'
      : 'w-full bg-slate-700/50 text-zinc-100 text-sm rounded-md border-0 ring-1 ring-slate-600 p-2');

  const labelClass =
    classNames?.label ??
    (variant === 'page'
      ? 'mb-1 block text-sm font-medium text-[#475569] dark:text-[#94A3B8]'
      : 'block text-sm font-medium text-zinc-300 mb-1');

  const hintClass =
    classNames?.hint ?? 'text-sm text-[#64748B] dark:text-zinc-400';

  const isProjectSite = locationType === 'project_site';

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Location type</label>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ['warehouse', 'Warehouse'],
              ['camp/office', 'Camp / offices'],
              ['project_site', 'Project site'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm text-[#475569] dark:text-zinc-200"
            >
              <input
                type="radio"
                name="custody-loc-type"
                value={value}
                checked={locationType === value}
                onChange={() => onLocationTypeChange(value as CustodyLocationType)}
                className="mr-1"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>{isProjectSite ? 'City (record)' : 'City *'}</label>
        {!locationCitiesLoaded ? (
          <p className={hintClass}>Loading cities…</p>
        ) : cityList.length === 0 ? (
          <p className="text-sm text-amber-200/90">
            No cities configured for this type. Add them under Admin → Locations → City lists.
          </p>
        ) : (
          <select
            value={custodyCity}
            onChange={(e) => {
              onCustodyCityChange(e.target.value);
              onPremisesChange('', '');
            }}
            className={inputClass}
            required={!isProjectSite}
          >
            <option value="">{isProjectSite ? 'Optional — select for record' : 'Select city'}</option>
            {cityList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {isProjectSite && (
        <>
          <div>
            <label className={labelClass}>Project *</label>
            <Select
              options={projects.map((proj) => ({
                value: proj.wbs,
                label: `${proj.wbs} — ${proj.projectname}`,
                project: proj,
              }))}
              value={
                projectWbs
                  ? {
                      value: projectWbs,
                      label: `${projectWbs} — ${projectName || ''}`,
                    }
                  : null
              }
              onChange={(option) => {
                if (option && 'project' in option && option.project) {
                  const p = option.project as Project;
                  onProjectChange(p.wbs, p.projectname);
                } else {
                  onProjectChange('', '');
                }
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  background: variant === 'page' ? 'rgb(255 255 255 / 0.1)' : 'rgb(51 65 85 / 0.5)',
                  borderColor: variant === 'page' ? 'rgb(255 255 255 / 0.2)' : 'rgb(71 85 105)',
                }),
                menu: (base) => ({
                  ...base,
                  background: 'rgb(30 41 59)',
                  zIndex: 50,
                }),
                singleValue: (base) => ({ ...base, color: 'rgb(226 232 240)' }),
                input: (base) => ({ ...base, color: 'rgb(226 232 240)' }),
              }}
              className="text-sm"
              placeholder="Search project…"
              isClearable
            />
          </div>
          <div>
            <label className={labelClass}>Custodian detail</label>
            <input
              type="text"
              value={custodianDetail}
              onChange={(e) => onCustodianDetailChange(e.target.value)}
              className={inputClass}
              placeholder="Name, ID, or contact"
            />
          </div>
          <div>
            <label className={labelClass}>Container number / rack</label>
            <input
              type="text"
              value={containerNumberRack}
              onChange={(e) => onContainerNumberRackChange(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass}>Purpose / remarks</label>
            <textarea
              value={custodyRemark}
              onChange={(e) => onCustodyRemarkChange(e.target.value)}
              className={`${inputClass} min-h-[80px]`}
              placeholder="Purpose or other notes"
              rows={3}
            />
          </div>
        </>
      )}

      {needsPremises && (
        <div>
          <label className={labelClass}>Location (premises) *</label>
          {!custodyCity.trim() ? (
            <p className={hintClass}>Select a city first.</p>
          ) : loadingPremises ? (
            <p className={hintClass}>Loading premises…</p>
          ) : premiseOptions.length === 0 ? (
            <p className="text-sm text-amber-200/90">
              No premises for {displayCustodyLocationType(locationType)} in this city. Add them under Admin → Locations →
              Premises.
            </p>
          ) : (
            <select
              value={premisesId}
              onChange={(e) => {
                const id = e.target.value;
                const opt = premiseOptions.find((o) => o.id === id);
                onPremisesChange(id, opt?.label ?? '');
              }}
              className={inputClass}
              required
            >
              <option value="">Select premises</option>
              {premiseOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {locationType === 'warehouse' && (
        <>
          <div>
            <label className={labelClass}>Rack / bin / pallet</label>
            <input
              type="text"
              value={rackBinPallet}
              onChange={(e) => onRackBinPalletChange(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass}>Shed / room number</label>
            <input
              type="text"
              value={shedRoomNumber}
              onChange={(e) => onShedRoomNumberChange(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
        </>
      )}

      {locationType === 'camp/office' && (
        <>
          <div>
            <label className={labelClass}>Floor / room</label>
            <input
              type="text"
              value={floorRoom}
              onChange={(e) => onFloorRoomChange(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass}>Occupant</label>
            <input
              type="text"
              value={occupant}
              onChange={(e) => onOccupantChange(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass}>Remark</label>
            <textarea
              value={custodyRemark}
              onChange={(e) => onCustodyRemarkChange(e.target.value)}
              className={`${inputClass} min-h-[80px]`}
              placeholder="Optional notes"
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}
