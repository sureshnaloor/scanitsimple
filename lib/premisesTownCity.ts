import type { Db } from 'mongodb';
import { ensureLocationCitySeeds } from '@/lib/locationCitySeeds';

const COLLECTION = 'locationcities';

export type PremisesKind = 'warehouse' | 'department';

function nameKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Returns the canonical city name from locationcities for the given list kind, or null if not found.
 */
export async function resolvePremisesTownCity(
  db: Db,
  input: string,
  kind: PremisesKind
): Promise<string | null> {
  await ensureLocationCitySeeds(db);
  const nk = nameKey(input);
  if (!nk) return null;
  const doc = await db.collection(COLLECTION).findOne({ nameKey: nk, kind });
  if (!doc) return null;
  return String((doc as unknown as { name: string }).name);
}

export function parsePremisesKindInput(raw: unknown): PremisesKind | null {
  const t = String(raw ?? '').trim().toLowerCase();
  if (!t) return null;
  if (t === 'warehouse' || t === 'wh') return 'warehouse';
  if (t === 'department' || t === 'camp' || t.includes('camp') || t.includes('office')) return 'department';
  return null;
}
