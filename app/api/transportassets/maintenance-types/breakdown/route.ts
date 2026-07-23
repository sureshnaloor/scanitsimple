import { NextResponse } from 'next/server';
import { ObjectId, type Db } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const COLLECTION = 'transport_maint_master_breakdown';

const DEFAULT_NAMES = [
  'Engine repair',
  'Gearbox repair',
  'Transmission repair',
  'Tire damage',
  'Dent and body damage',
  'Re-painting'
];

async function ensureSeed(db: Db) {
  const col = db.collection(COLLECTION);
  const count = await col.countDocuments();
  if (count === 0) {
    await col.insertMany(
      DEFAULT_NAMES.map((name) => ({
        name,
        createdAt: new Date()
      }))
    );
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    await ensureSeed(db);
    const rows = await db
      .collection(COLLECTION)
      .find({})
      .sort({ name: 1 })
      .toArray();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET breakdown maintenance types:', error);
    return NextResponse.json({ error: 'Failed to load types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await ensureSeed(db);
    const col = db.collection(COLLECTION);

    const dup = await col.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
    if (dup) {
      return NextResponse.json({ error: 'A type with this name already exists.' }, { status: 409 });
    }

    const result = await col.insertOne({ name, createdAt: new Date() });
    const doc = await col.findOne({ _id: result.insertedId });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('POST breakdown maintenance type:', error);
    return NextResponse.json({ error: 'Failed to create type' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?._id ?? body?.id ?? '').trim();
    const name = String(body?.name ?? '').trim();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid id is required.' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const col = db.collection(COLLECTION);
    const oid = new ObjectId(id);

    const dup = await col.findOne({
      _id: { $ne: oid },
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') }
    });
    if (dup) {
      return NextResponse.json({ error: 'A type with this name already exists.' }, { status: 409 });
    }

    const ur = await col.updateOne({ _id: oid }, { $set: { name } });
    if (ur.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updated = await col.findOne({ _id: oid });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT breakdown maintenance type:', error);
    return NextResponse.json({ error: 'Failed to update type' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim() ?? '';
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid id query param is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE breakdown maintenance type:', error);
    return NextResponse.json({ error: 'Failed to delete type' }, { status: 500 });
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
