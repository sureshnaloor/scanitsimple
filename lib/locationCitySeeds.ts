import type { Db } from 'mongodb';
import { SEED_DEPARTMENT_CITIES, SEED_WAREHOUSE_CITIES } from '@/lib/locationCities';

const COLLECTION = 'locationcities';

function nameKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Inserts seed warehouse/department city rows if the collection is empty.
 * Safe to call on every read; uses a single count check.
 */
export async function ensureLocationCitySeeds(db: Db): Promise<void> {
  const coll = db.collection(COLLECTION);
  const n = await coll.countDocuments();
  if (n > 0) return;

  const now = new Date();
  const warehouse = SEED_WAREHOUSE_CITIES.map((name, order) => ({
    kind: 'warehouse' as const,
    name,
    nameKey: nameKey(name),
    order,
    createdAt: now,
    updatedAt: now,
  }));
  const department = SEED_DEPARTMENT_CITIES.map((name, order) => ({
    kind: 'department' as const,
    name,
    nameKey: nameKey(name),
    order,
    createdAt: now,
    updatedAt: now,
  }));

  if (warehouse.length) await coll.insertMany(warehouse);
  if (department.length) await coll.insertMany(department);
}
