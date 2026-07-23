import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const RECORDS = 'portable_modification';

const KINDS = new Set(['material', 'service']);

export async function GET(
  _request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const { db } = await connectToDatabase();

    const asset = await db.collection('portableasset').findOne({ assetnumber });
    if (!asset) {
      return NextResponse.json({ error: 'Portable asset not found.' }, { status: 404 });
    }

    const rows = await db
      .collection(RECORDS)
      .find({ assetnumber })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET portable modifications:', error);
    return NextResponse.json({ error: 'Failed to load modifications' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { assetnumber } = params;
    const body = await request.json();

    const entryKind = String(body?.entryKind ?? '').trim();
    const category = String(body?.category ?? '').trim();
    const description = String(body?.description ?? '').trim();
    const remarks = String(body?.remarks ?? '').trim();

    if (!KINDS.has(entryKind)) {
      return NextResponse.json({ error: 'entryKind must be material or service.' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required (e.g. HVAC, painting).' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const asset = await db.collection('portableasset').findOne({ assetnumber });
    if (!asset) {
      return NextResponse.json({ error: 'Portable asset not found.' }, { status: 404 });
    }

    let workDate: Date | null = null;
    if (body?.workDate !== undefined && body?.workDate !== null && body?.workDate !== '') {
      const d = new Date(String(body.workDate));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid work date.' }, { status: 400 });
      }
      workDate = d;
    }

    const doc = {
      assetnumber,
      entryKind,
      category,
      description,
      remarks,
      workDate,
      createdAt: new Date()
    };

    const result = await db.collection(RECORDS).insertOne(doc);
    const created = await db.collection(RECORDS).findOne({ _id: result.insertedId });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST portable modification:', error);
    return NextResponse.json({ error: 'Failed to create modification' }, { status: 500 });
  }
}
