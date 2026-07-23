/** Custody location type stored on equipmentcustody documents */
export type CustodyLocationType = 'warehouse' | 'camp/office' | 'project_site';

/** Legacy DB value */
export function normalizeCustodyLocationType(t?: string | null): CustodyLocationType {
  if (t === 'warehouse') return 'warehouse';
  if (t === 'camp/office') return 'camp/office';
  if (t === 'department' || t === 'project_site') return 'project_site';
  return 'warehouse';
}

export function displayCustodyLocationType(t?: string | null): string {
  const n = normalizeCustodyLocationType(t);
  if (n === 'warehouse') return 'Warehouse';
  if (n === 'project_site') return 'Project site';
  return 'Camp / offices';
}

/** premises collection uses warehouse | department */
export function premisesMongoKindForCustody(loc: CustodyLocationType): 'warehouse' | 'department' {
  return loc === 'warehouse' ? 'warehouse' : 'department';
}

export type PremisesOption = { id: string; label: string };

export async function loadPremisesForCity(
  mongoKind: 'warehouse' | 'department',
  city: string
): Promise<PremisesOption[]> {
  const c = city.trim();
  if (!c) return [];
  const res = await fetch(
    `/api/locations?premisesKind=${mongoKind === 'warehouse' ? 'warehouse' : 'department'}`
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    _id: unknown;
    locationName?: string;
    buildingTower?: string;
    townCity?: string;
  }>;
  return rows
    .filter((r) => (r.townCity || '').trim() === c)
    .map((r) => ({
      id: String(r._id),
      label: [r.locationName, r.buildingTower].filter(Boolean).join(' — ') || 'Premises',
    }));
}
