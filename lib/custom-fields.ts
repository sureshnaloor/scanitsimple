/**
 * Shared registry for admin-defined custom fields ("super ability").
 *
 * Admins can define additional labels for any data group:
 *  - master data       (categories, manufacturers, departments, …)
 *  - basic/static data (assets, MME, tools)
 *  - transaction data  (custody, calibration, PPE/material issues, …)
 *
 * A field is either a "master-select" (dropdown fed by centrally maintained
 * master data) or a free field (text, number, date, radio, toggle).
 */

export type CustomFieldScope = 'master' | 'basic' | 'transaction';

export type CustomFieldInputType =
  | 'text'
  | 'number'
  | 'date'
  | 'toggle'
  | 'radio'
  | 'master-select';

export const FIELD_SCOPES: { value: CustomFieldScope; label: string }[] = [
  { value: 'basic', label: 'Static / basic data' },
  { value: 'master', label: 'Master data' },
  { value: 'transaction', label: 'Transaction data' },
];

export const CUSTOM_FIELD_ENTITIES: Record<CustomFieldScope, { value: string; label: string }[]> = {
  basic: [
    { value: 'fixedasset', label: 'Fixed assets' },
    { value: 'mme', label: 'MME equipment' },
    { value: 'facility', label: 'Facility assets' },
    { value: 'portable', label: 'Portable assets' },
    { value: 'software', label: 'Software assets' },
    { value: 'transport', label: 'Transport assets' },
    { value: 'tool', label: 'Tools' },
  ],
  master: [
    { value: 'category', label: 'Categories' },
    { value: 'subcategory', label: 'Subcategories' },
    { value: 'manufacturer', label: 'Manufacturers' },
    { value: 'department', label: 'Departments' },
    { value: 'designation', label: 'Designations' },
    { value: 'location-city', label: 'Location cities' },
  ],
  transaction: [
    { value: 'custody', label: 'Custody records' },
    { value: 'calibration', label: 'Calibration records' },
    { value: 'ppe-issue', label: 'PPE issues' },
    { value: 'ppe-receipt', label: 'PPE receipts' },
    { value: 'material-issue', label: 'Project issued materials' },
    { value: 'material-return', label: 'Project returned materials' },
  ],
};

export const INPUT_TYPES: { value: CustomFieldInputType; label: string }[] = [
  { value: 'master-select', label: 'Dropdown — select from master data' },
  { value: 'text', label: 'Free text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'radio', label: 'Radio buttons (custom options)' },
  { value: 'toggle', label: 'Toggle (yes / no)' },
];

export interface MasterSourceDef {
  value: string;
  label: string;
  endpoint: string;
}

export const MASTER_SOURCES: MasterSourceDef[] = [
  { value: 'fa-category', label: 'Fixed asset categories', endpoint: '/api/categories/fixedasset' },
  { value: 'mme-category', label: 'MME categories', endpoint: '/api/categories/mme' },
  { value: 'fa-manufacturer', label: 'Fixed asset manufacturers', endpoint: '/api/manufacturers/fixedasset' },
  { value: 'mme-manufacturer', label: 'MME manufacturers', endpoint: '/api/manufacturers/mme' },
  { value: 'departments', label: 'Departments', endpoint: '/api/departments' },
  { value: 'designations', label: 'Designations', endpoint: '/api/designations' },
  { value: 'location-cities', label: 'Location cities', endpoint: '/api/location-cities' },
];

/** All valid entity keys (used for value-storage validation). */
export const ALL_CUSTOM_ENTITIES: string[] = [
  ...CUSTOM_FIELD_ENTITIES.basic.map((e) => e.value),
  ...CUSTOM_FIELD_ENTITIES.master.map((e) => e.value),
  ...CUSTOM_FIELD_ENTITIES.transaction.map((e) => e.value),
];

/** Turn a label into a stable camelCase-ish key. */
export function fieldKeyFromLabel(label: string): string {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'field';
}

/**
 * Fetch the selectable options for a master-select field.
 * Handles the different response shapes of the master endpoints.
 * Returns option name strings.
 */
export async function fetchMasterOptions(source: string): Promise<string[]> {
  if (source.startsWith('custom-')) {
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/custom-masters?key=${source}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.values) ? data.values : [];
    } catch (err) {
      console.error('Failed to fetch custom master options:', err);
      return [];
    }
  }

  const def = MASTER_SOURCES.find((s) => s.value === source);
  if (!def) return [];
  try {
    const res = await fetch(def.endpoint);
    if (!res.ok) return [];
    const data = await res.json();

    // /api/location-cities -> { warehouse: [{name}], department: [{name}] }
    if (data && Array.isArray(data.warehouse)) {
      const names = [
        ...data.warehouse.map((r: { name: string }) => r.name),
        ...(Array.isArray(data.department) ? data.department.map((r: { name: string }) => r.name) : []),
      ];
      return Array.from(new Set(names));
    }
    // { success, data: [{name}] }
    if (data && Array.isArray(data.data)) {
      return data.data.map((r: { name: string }) => r.name).filter(Boolean);
    }
    // [{name}]
    if (Array.isArray(data)) {
      return data.map((r: { name: string }) => r?.name).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch master options:', err);
    return [];
  }
}
