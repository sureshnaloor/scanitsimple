import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const RECORDS = 'transport_maint_record_preventive';
const MASTER = 'transport_maint_master_preventive';

export async function GET(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const { db } = await connectToDatabase();
    const rows = await db
      .collection(RECORDS)
      .find({ assetnumber })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET preventive maintenance records:', error);
    return NextResponse.json({ error: 'Failed to load records' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const body = await request.json();
    const maintenanceTypeId = String(body?.maintenanceTypeId ?? '').trim();
    const remarks = String(body?.remarks ?? '').trim();

    if (!maintenanceTypeId || !ObjectId.isValid(maintenanceTypeId)) {
      return NextResponse.json({ error: 'Valid maintenance type is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const asset = await db.collection('transportasset').findOne({ assetnumber });
    if (!asset) {
      return NextResponse.json({ error: 'Transport asset not found.' }, { status: 404 });
    }

    const master = await db
      .collection(MASTER)
      .findOne({ _id: new ObjectId(maintenanceTypeId) });
    if (!master) {
      return NextResponse.json({ error: 'Maintenance type not found.' }, { status: 400 });
    }

    const maintenanceTypeName = String((master as { name?: string }).name ?? '');

    const parseOptDate = (v: unknown) => {
      if (v === null || v === undefined || v === '') return null;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    const scheduledDate = parseOptDate(body?.scheduledDate);
    const actualDate = parseOptDate(body?.actualDate);

    const doc = {
      assetnumber,
      maintenanceTypeId: new ObjectId(maintenanceTypeId),
      maintenanceTypeName,
      scheduledDate,
      actualDate,
      remarks,
      createdAt: new Date()
    };

    const result = await db.collection(RECORDS).insertOne(doc);
    const created = await db.collection(RECORDS).findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST preventive maintenance record:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
