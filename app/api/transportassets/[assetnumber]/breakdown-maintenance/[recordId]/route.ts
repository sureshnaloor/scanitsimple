import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

const RECORDS = 'transport_maint_record_breakdown';
const MASTER = 'transport_maint_master_breakdown';

export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string; recordId: string } }
) {
  try {
    const { assetnumber, recordId } = params;
    if (!ObjectId.isValid(recordId)) {
      return NextResponse.json({ error: 'Invalid record id.' }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    const col = db.collection(RECORDS);
    const oid = new ObjectId(recordId);

    const existing = await col.findOne({ _id: oid, assetnumber });
    if (!existing) {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    }

    const $set: Record<string, unknown> = {};

    if (body?.remarks !== undefined) {
      $set.remarks = String(body.remarks ?? '').trim();
    }

    const parseOptDate = (v: unknown) => {
      if (v === null || v === undefined || v === '') return null;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    if (body?.actualDate !== undefined) {
      $set.actualDate = parseOptDate(body.actualDate);
    }

    if (body?.maintenanceTypeId !== undefined) {
      const tid = String(body.maintenanceTypeId ?? '').trim();
      if (!tid || !ObjectId.isValid(tid)) {
        return NextResponse.json({ error: 'Valid maintenance type is required.' }, { status: 400 });
      }
      const master = await db.collection(MASTER).findOne({ _id: new ObjectId(tid) });
      if (!master) {
        return NextResponse.json({ error: 'Maintenance type not found.' }, { status: 400 });
      }
      $set.maintenanceTypeId = new ObjectId(tid);
      $set.maintenanceTypeName = String((master as { name?: string }).name ?? '');
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json(existing);
    }

    await col.updateOne({ _id: oid, assetnumber }, { $set });
    const updated = await col.findOne({ _id: oid });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT breakdown maintenance record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { assetnumber: string; recordId: string } }
) {
  try {
    const { assetnumber, recordId } = params;
    if (!ObjectId.isValid(recordId)) {
      return NextResponse.json({ error: 'Invalid record id.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection(RECORDS)
      .deleteOne({ _id: new ObjectId(recordId), assetnumber });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE breakdown maintenance record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
