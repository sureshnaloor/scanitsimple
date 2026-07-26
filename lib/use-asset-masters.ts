'use client';

import { useEffect, useState } from 'react';

/**
 * Asset status master list — identical to the one used by the AssetDetails
 * component on the dynamic detail pages (/asset/[id], /fixedasset/[id]).
 */
export const ASSET_STATUSES = [
  'Select Status', // Default option
  'Active',
  'In Calibration',
  'Under Repair',
  'Retired',
  'Disposed',
];

export interface MasterOption {
  _id: string;
  name: string;
}

/**
 * Loads the master-data dropdown options (categories, category-dependent
 * subcategories, manufacturers) exactly the way AssetDetails does on the
 * dynamic detail pages, so list-page edit dialogs can offer the same
 * restricted selections.
 */
export function useAssetMasters(isFixedAsset: boolean, category: string) {
  const [categories, setCategories] = useState<MasterOption[]>([]);
  const [subcategories, setSubcategories] = useState<MasterOption[]>([]);
  const [manufacturers, setManufacturers] = useState<MasterOption[]>([]);

  // Categories (once per asset type)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(isFixedAsset ? '/api/categories/fixedasset' : '/api/categories/mme');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };
    load();
  }, [isFixedAsset]);

  // Subcategories (dependent on selected category)
  useEffect(() => {
    const load = async () => {
      if (!category || category === 'Select Category') {
        setSubcategories([]);
        return;
      }
      try {
        const res = await fetch(
          `${isFixedAsset ? '/api/subcategories/fixedasset' : '/api/subcategories/mme'}?category=${encodeURIComponent(category)}`
        );
        if (!res.ok) throw new Error('Failed to fetch subcategories');
        const data = await res.json();
        setSubcategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setSubcategories([]);
      }
    };
    load();
  }, [category, isFixedAsset]);

  // Manufacturers (once per asset type)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          isFixedAsset ? '/api/manufacturers/fixedasset' : '/api/manufacturers/mme'
        );
        if (!res.ok) throw new Error('Failed to fetch manufacturers');
        const data = await res.json();
        setManufacturers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching manufacturers:', err);
        setManufacturers([]);
      }
    };
    load();
  }, [isFixedAsset]);

  return { categories, subcategories, manufacturers };
}
