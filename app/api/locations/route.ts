import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse, NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import {
  resolvePremisesTownCity,
  type PremisesKind,
} from '@/lib/premisesTownCity';

function trimStr(value: unknown) {
  return String(value ?? '').trim();
}

function parsePremisesKindBody(value: unknown): PremisesKind | null {
  const v = trimStr(value).toLowerCase();
  if (v === 'warehouse') return 'warehouse';
  if (v === 'department') return 'department';
  return null;
}

function coordProvided(value: unknown) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return !Number.isNaN(value);
  return true;
}

function parseCoordPair(body: {
  latitude?: unknown;
  longitude?: unknown;
}): { ok: true; latitude?: number; longitude?: number } | { ok: false; error: string } {
  const latRaw = body.latitude;
  const lngRaw = body.longitude;
  const hasLat = coordProvided(latRaw);
  const hasLng = coordProvided(lngRaw);

  if (!hasLat && !hasLng) {
    return { ok: true };
  }
  if (hasLat !== hasLng) {
    return { ok: false, error: 'Latitude and longitude must both be provided, or both omitted.' };
  }

  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { ok: false, error: 'Latitude and longitude must be valid numbers.' };
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { ok: false, error: 'Coordinates out of valid range (lat −90…90, lng −180…180).' };
  }
  return { ok: true, latitude, longitude };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get('premisesKind');

    let query: Record<string, unknown> = {};
    if (filterParam === 'warehouse') {
      query = { premisesKind: 'warehouse' };
    } else if (filterParam === 'department') {
      query = {
        $or: [
          { premisesKind: 'department' },
          { premisesKind: { $exists: false } },
          { premisesKind: null },
        ],
      };
    }

    const { db } = await connectToDatabase();
    const locations = await db
      .collection('locations')
      .find(query)
      .sort({ locationName: 1 })
      .toArray();

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locationName = trimStr(body.locationName);
    const townCity = trimStr(body.townCity);
    const buildingTower = trimStr(body.buildingTower);
    const remarks = trimStr(body.remarks);
    const landmark = trimStr(body.landmark);
    const premisesKind = parsePremisesKindBody(body.premisesKind);

    if (!locationName || !townCity || !buildingTower) {
      return NextResponse.json(
        { error: 'Location name, town/city, and building/tower are required' },
        { status: 400 }
      );
    }

    if (!premisesKind) {
      return NextResponse.json(
        {
          error:
            'Premises type is required: use "warehouse" or "department" (camp / offices).',
        },
        { status: 400 }
      );
    }

    const coords = parseCoordPair(body);
    if (!coords.ok) {
      return NextResponse.json({ error: coords.error }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const canonicalTown = await resolvePremisesTownCity(db, townCity, premisesKind);
    if (!canonicalTown) {
      return NextResponse.json(
        {
          error:
            'Town/city must match the selected premises type: warehouse cities for warehouse premises, or department/camp cities for camp/offices (Admin → Locations → City lists).',
        },
        { status: 400 }
      );
    }

    let existing;
    if (premisesKind === 'warehouse') {
      existing = await db.collection('locations').findOne({
        locationName,
        townCity: canonicalTown,
        buildingTower,
        premisesKind: 'warehouse',
      });
    } else {
      existing = await db.collection('locations').findOne({
        locationName,
        townCity: canonicalTown,
        buildingTower,
        $or: [
          { premisesKind: 'department' },
          { premisesKind: { $exists: false } },
          { premisesKind: null },
        ],
      });
    }
    if (existing) {
      return NextResponse.json({ error: 'Location with these details already exists' }, { status: 400 });
    }

    const newLocation: Record<string, unknown> = {
      locationName,
      townCity: canonicalTown,
      buildingTower,
      premisesKind,
      remarks: remarks || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      newLocation.latitude = coords.latitude;
      newLocation.longitude = coords.longitude;
    }
    if (landmark) {
      newLocation.landmark = landmark;
    }

    const result = await db.collection('locations').insertOne(newLocation);

    return NextResponse.json({ _id: result.insertedId, ...newLocation }, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const _id = body._id;
    const locationName = trimStr(body.locationName);
    const townCity = trimStr(body.townCity);
    const buildingTower = trimStr(body.buildingTower);
    const remarks = trimStr(body.remarks);
    const landmark = trimStr(body.landmark);
    const premisesKind = parsePremisesKindBody(body.premisesKind);

    if (!_id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    if (!locationName || !townCity || !buildingTower) {
      return NextResponse.json(
        { error: 'Location name, town/city, and building/tower are required' },
        { status: 400 }
      );
    }

    if (!premisesKind) {
      return NextResponse.json(
        {
          error:
            'Premises type is required: use "warehouse" or "department" (camp / offices).',
        },
        { status: 400 }
      );
    }

    const coords = parseCoordPair(body);
    if (!coords.ok) {
      return NextResponse.json({ error: coords.error }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const existingLoc = await db.collection('locations').findOne({ _id: new ObjectId(_id) });
    if (!existingLoc) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const prevTown = trimStr((existingLoc as { townCity?: string }).townCity);
    const prevKind = ((existingLoc as { premisesKind?: string }).premisesKind as PremisesKind | undefined) ?? 'department';

    let townResolved = await resolvePremisesTownCity(db, townCity, premisesKind);
    if (!townResolved) {
      if (prevTown === townCity && prevKind === premisesKind) {
        townResolved = townCity;
      } else {
        return NextResponse.json(
          {
            error:
              'Town/city must match the selected premises type (warehouse list or department/camp list).',
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      locationName,
      townCity: townResolved,
      buildingTower,
      premisesKind,
      remarks: remarks || '',
      updatedAt: new Date(),
    };

    if (landmark) {
      updateData.landmark = landmark;
    } else {
      updateData.landmark = '';
    }

    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      updateData.latitude = coords.latitude;
      updateData.longitude = coords.longitude;
    } else {
      updateData.latitude = null;
      updateData.longitude = null;
    }

    const result = await db.collection('locations').updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: updateData,
        $unset: { roomFloorNumber: '', palletRackBin: '' },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id,
      ...updateData,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('locations').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
