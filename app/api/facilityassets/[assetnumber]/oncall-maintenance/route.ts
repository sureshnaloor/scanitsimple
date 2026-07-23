import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const RECORDS = 'facility_oncall_maintenance';
const KINDS = new Set(['service', 'repair']);

export async function GET(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const { db } = await connectToDatabase();

    const asset = await db.collection('facilityasset').findOne({ assetnumber });
    if (!asset) {
      return NextResponse.json({ error: 'Facility asset not found.' }, { status: 404 });
    }

    const rows = await db
      .collection(RECORDS)
      .find({ assetnumber })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET facility on-call maintenance:', error);
    return NextResponse.json({ error: 'Failed to load on-call maintenance records' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const body = await request.json();

    const recordType = String(body?.recordType ?? '').trim().toLowerCase();
    const remarks = String(body?.remarks ?? '').trim();

    if (!KINDS.has(recordType)) {
      return NextResponse.json({ error: 'recordType must be service or repair.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const asset = await db.collection('facilityasset').findOne({ assetnumber });
    if (!asset) {
      return NextResponse.json({ error: 'Facility asset not found.' }, { status: 404 });
    }

    const parseOptDate = (v: unknown) => {
      if (v === null || v === undefined || v === '') return null;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    const actualDate = parseOptDate(body?.actualDate);

    const doc = {
      assetnumber,
      recordType,
      actualDate,
      remarks,
      createdAt: new Date()
    };

    const result = await db.collection(RECORDS).insertOne(doc);
    const created = await db.collection(RECORDS).findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST facility on-call maintenance:', error);
    return NextResponse.json({ error: 'Failed to create on-call maintenance record' }, { status: 500 });
  }
}
