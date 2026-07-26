import { connectToDatabase } from '@/lib/mongodb';
import { ensureLocationCitySeeds } from '@/lib/locationCitySeeds';
import { NextResponse, NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'locationcities';

type CityKind = 'warehouse' | 'department';

function normalizeName(value: unknown) {
  return String(value ?? '').trim();
}

function keyFromName(name: string) {
  return name.trim().toLowerCase();
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    await ensureLocationCitySeeds(db);

    const rows = await db
      .collection(COLLECTION)
      .find({})
      .sort({ kind: 1, order: 1, name: 1 })
      .toArray();

    const warehouse = rows
      .filter((r) => r.kind === 'warehouse')
      .map((r) => ({
        _id: String(r._id),
        name: r.name as string,
        order: typeof r.order === 'number' ? r.order : 0,
      }));
    const department = rows
      .filter((r) => r.kind === 'department')
      .map((r) => ({
        _id: String(r._id),
        name: r.name as string,
        order: typeof r.order === 'number' ? r.order : 0,
      }));

    return apiJson({ warehouse, department });
  } catch (error) {
    console.error('location-cities GET:', error);
    return apiJson({ error: 'Failed to fetch location cities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const body = await request.json();
    const kind = body?.kind as CityKind;
    const name = normalizeName(body?.name);

    if (kind !== 'warehouse' && kind !== 'department') {
      return apiJson({ error: 'kind must be warehouse or department' }, { status: 400 });
    }
    if (!name) {
      return apiJson({ error: 'City name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await ensureLocationCitySeeds(db);

    const nk = keyFromName(name);
    const dup = await db.collection(COLLECTION).findOne({ kind, nameKey: nk });
    if (dup) {
      return apiJson({ error: 'This city already exists for that list' }, { status: 400 });
    }

    const maxOrder = await db
      .collection(COLLECTION)
      .find({ kind })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = maxOrder[0] && typeof maxOrder[0].order === 'number' ? maxOrder[0].order + 1 : 0;

    const now = new Date();
    const doc = {
      kind,
      name,
      nameKey: nk,
      order,
      createdAt: now,
      updatedAt: now,
      updatedBy: session.user.email,
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    return apiJson(
      { _id: String(result.insertedId), name: doc.name, order: doc.order, kind: doc.kind },
      { status: 201 }
    );
  } catch (error) {
    console.error('location-cities POST:', error);
    return apiJson({ error: 'Failed to create city' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const body = await request.json();
    const id = normalizeName(body?._id);
    const name = normalizeName(body?.name);

    if (!id || !name) {
      return apiJson({ error: 'City id and name are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const nk = keyFromName(name);

    const existing = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return apiJson({ error: 'City not found' }, { status: 404 });
    }

    const kind = existing.kind as CityKind;
    const dup = await db.collection(COLLECTION).findOne({
      kind,
      nameKey: nk,
      _id: { $ne: new ObjectId(id) },
    });
    if (dup) {
      return apiJson({ error: 'Another city in this list already uses that name' }, { status: 400 });
    }

    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          nameKey: nk,
          updatedAt: new Date(),
          updatedBy: session.user.email,
        },
      }
    );

    return apiJson({ success: true });
  } catch (error) {
    console.error('location-cities PUT:', error);
    return apiJson({ error: 'Failed to update city' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiJson({ error: 'City id is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return apiJson({ error: 'City not found' }, { status: 404 });
    }

    return apiJson({ success: true });
  } catch (error) {
    console.error('location-cities DELETE:', error);
    return apiJson({ error: 'Failed to delete city' }, { status: 500 });
  }
}
