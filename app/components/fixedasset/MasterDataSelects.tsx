'use client';

import { ASSET_STATUSES, type MasterOption } from '@/lib/use-asset-masters';
import { fap } from '@/lib/fixedAssetPageDesign';

type MasterPatch = {
  assetcategory?: string;
  assetsubcategory?: string;
  assetstatus?: string;
};

type Props = {
  category: string;
  subcategory: string;
  status: string;
  categories: MasterOption[];
  subcategories: MasterOption[];
  onPatch: (patch: MasterPatch) => void;
  /** Optional style overrides (default: fixed-asset design tokens) */
  labelClass?: string;
  inputClass?: string;
};

/**
 * Category / subcategory / status dropdowns restricted to master data —
 * identical behaviour to the AssetDetails component on the dynamic detail
 * pages (subcategory options depend on the selected category).
 */
export default function MasterDataSelects({
  category,
  subcategory,
  status,
  categories,
  subcategories,
  onPatch,
  labelClass = fap.label,
  inputClass = fap.input,
}: Props) {
  return (
    <>
      <div>
        <label className={labelClass}>Category</label>
        <select
          className={inputClass}
          value={category || 'Select Category'}
          onChange={(e) =>
            onPatch({
              assetcategory: e.target.value === 'Select Category' ? '' : e.target.value,
              assetsubcategory: '',
            })
          }
        >
          <option value="Select Category">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Subcategory</label>
        <select
          className={inputClass}
          value={subcategory || 'Select Subcategory'}
          disabled={!category}
          onChange={(e) =>
            onPatch({
              assetsubcategory: e.target.value === 'Select Subcategory' ? '' : e.target.value,
            })
          }
        >
          <option value="Select Subcategory">Select Subcategory</option>
          {subcategories.map((s) => (
            <option key={s._id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select
          className={inputClass}
          value={status || 'Select Status'}
          onChange={(e) =>
            onPatch({ assetstatus: e.target.value === 'Select Status' ? '' : e.target.value })
          }
        >
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
