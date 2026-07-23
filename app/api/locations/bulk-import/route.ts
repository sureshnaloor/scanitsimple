import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { resolvePremisesTownCity, parsePremisesKindInput, type PremisesKind } from '@/lib/premisesTownCity';

type BulkLocationRow = {
  locationName: string;
  townCity: string;
  buildingTower: string;
  premisesKind: PremisesKind;
  latitude?: string;
  longitude?: string;
  landmark?: string;
  remarks?: string;
  sourceRow?: number;
};

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function parseCoordPair(row: BulkLocationRow, rowNo: number, errors: string[]) {
  const latText = normalizeText(row.latitude);
  const lngText = normalizeText(row.longitude);
  if (!latText && !lngText) {
    return { latitude: undefined as number | undefined, longitude: undefined as number | undefined };
  }
  if (!latText || !lngText) {
    errors.push(`Row ${rowNo}: Latitude and longitude must both be set, or both left empty.`);
    return null;
  }
  const latitude = Number(latText);
  const longitude = Number(lngText);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    errors.push(`Row ${rowNo}: Latitude and longitude must be valid numbers.`);
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    errors.push(`Row ${rowNo}: Coordinates out of valid range.`);
    return null;
  }
  return { latitude, longitude };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!['validate', 'insert'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "validate" or "insert".' },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'No rows received for processing.' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const normalized: BulkLocationRow[] = [];
    const seen = new Set<string>();

    const { db } = await connectToDatabase();

    for (const raw of rows as Record<string, unknown>[]) {
      const rowNo = (raw.sourceRow as number) ?? 0;
      const locationName = normalizeText(raw.locationName);
      const townCityRaw = normalizeText(raw.townCity);
      const buildingTower = normalizeText(raw.buildingTower);
      const kindRaw = normalizeText(raw.premisesKind ?? raw.premisesType ?? raw.type);
      const premisesKind = parsePremisesKindInput(kindRaw);

      if (!locationName || !townCityRaw || !buildingTower) {
        errors.push(`Row ${rowNo}: Location Name, Town/City, and Building/Tower are required.`);
        continue;
      }

      if (!premisesKind) {
        errors.push(
          `Row ${rowNo}: Premises Type is required (warehouse, or camp/offices / department).`
        );
        continue;
      }

      const townCityResolved = await resolvePremisesTownCity(db, townCityRaw, premisesKind);
      if (!townCityResolved) {
        errors.push(
          `Row ${rowNo}: Town/City "${townCityRaw}" is not in the ${premisesKind === 'warehouse' ? 'warehouse' : 'department/camp'} city list.`
        );
        continue;
      }
      const townCity = townCityResolved;

      const key = `${premisesKind}\0${locationName}\0${townCity}\0${buildingTower}`;
      if (seen.has(key)) {
        errors.push(
          `Row ${rowNo}: Duplicate premises in file (${premisesKind} / ${locationName} / ${townCity} / ${buildingTower}).`
        );
        continue;
      }
      seen.add(key);

      const coords = parseCoordPair(
        {
          locationName,
          townCity,
          buildingTower,
          premisesKind,
          latitude: raw.latitude as string | undefined,
          longitude: raw.longitude as string | undefined,
          landmark: raw.landmark as string | undefined,
          remarks: raw.remarks as string | undefined,
          sourceRow: rowNo,
        },
        rowNo,
        errors
      );
      if (coords === null) {
        continue;
      }

      normalized.push({
        locationName,
        townCity,
        buildingTower,
        premisesKind,
        latitude: coords.latitude !== undefined ? String(coords.latitude) : undefined,
        longitude: coords.longitude !== undefined ? String(coords.longitude) : undefined,
        landmark: normalizeText(raw.landmark),
        remarks: normalizeText(raw.remarks),
        sourceRow: rowNo,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', errors },
        { status: 400 }
      );
    }

    const collection = db.collection('locations');

    const candidates: BulkLocationRow[] = [];
    const skippedExisting: BulkLocationRow[] = [];

    for (const r of normalized) {
      let q: Record<string, unknown>;
      if (r.premisesKind === 'warehouse') {
        q = {
          locationName: r.locationName,
          townCity: r.townCity,
          buildingTower: r.buildingTower,
          premisesKind: 'warehouse',
        };
      } else {
        q = {
          locationName: r.locationName,
          townCity: r.townCity,
          buildingTower: r.buildingTower,
          $or: [
            { premisesKind: 'department' },
            { premisesKind: { $exists: false } },
            { premisesKind: null },
          ],
        };
      }
      const found = await collection.findOne(q, { projection: { _id: 1 } });
      if (found) {
        skippedExisting.push(r);
      } else {
        candidates.push(r);
      }
    }

    const now = new Date();
    const insertDocs = candidates.map((row) => {
      const doc: Record<string, unknown> = {
        locationName: row.locationName,
        townCity: row.townCity,
        buildingTower: row.buildingTower,
        premisesKind: row.premisesKind,
        remarks: row.remarks || '',
        createdAt: now,
        updatedAt: now,
      };
      if (row.latitude && row.longitude) {
        doc.latitude = Number(row.latitude);
        doc.longitude = Number(row.longitude);
      }
      if (row.landmark) {
        doc.landmark = row.landmark;
      }
      return doc;
    });

    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        data: {
          totalUploaded: rows.length,
          validForInsert: insertDocs.length,
          skippedExisting: skippedExisting.map((row) => ({
            locationName: row.locationName,
            townCity: row.townCity,
            buildingTower: row.buildingTower,
            sourceRow: row.sourceRow,
          })),
          rowsToInsert: candidates,
        },
        message:
          insertDocs.length > 0
            ? 'Validation successful. New premises rows are ready for insertion.'
            : 'Validation successful. No new rows to insert (all premises already exist).',
      });
    }

    if (insertDocs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No new premises to insert. All rows already exist.',
          data: {
            skippedExisting: skippedExisting.map((row) => ({
              locationName: row.locationName,
              sourceRow: row.sourceRow,
            })),
          },
        },
        { status: 400 }
      );
    }

    const ins = await collection.insertMany(insertDocs);

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: ins.insertedCount,
        skippedExistingCount: skippedExisting.length,
        skippedExisting: skippedExisting.map((row) => ({
          locationName: row.locationName,
          townCity: row.townCity,
          buildingTower: row.buildingTower,
          sourceRow: row.sourceRow,
        })),
      },
      message: `Inserted ${ins.insertedCount} premises record(s) successfully.`,
    });
  } catch (error: unknown) {
    console.error('Error in locations bulk import:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk import.', details: message },
      { status: 500 }
    );
  }
}
