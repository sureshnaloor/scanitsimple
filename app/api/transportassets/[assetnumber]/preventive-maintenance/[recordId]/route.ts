import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const RECORDS = 'transport_maint_record_preventive';
const MASTER = 'transport_maint_master_preventive';

export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string; recordId: string } }
) {
  try {
    const { assetnumber, recordId } = params;
    if (!ObjectId.isValid(recordId)) {
      return apiJson({ error: 'Invalid record id.' }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    const col = db.collection(RECORDS);
    const oid = new ObjectId(recordId);

    const existing = await col.findOne({ _id: oid, assetnumber });
    if (!existing) {
      return apiJson({ error: 'Record not found.' }, { status: 404 });
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

    if (body?.scheduledDate !== undefined) {
      $set.scheduledDate = parseOptDate(body.scheduledDate);
    }
    if (body?.actualDate !== undefined) {
      $set.actualDate = parseOptDate(body.actualDate);
    }

    if (body?.maintenanceTypeId !== undefined) {
      const tid = String(body.maintenanceTypeId ?? '').trim();
      if (!tid || !ObjectId.isValid(tid)) {
        return apiJson({ error: 'Valid maintenance type is required.' }, { status: 400 });
      }
      const master = await db.collection(MASTER).findOne({ _id: new ObjectId(tid) });
      if (!master) {
        return apiJson({ error: 'Maintenance type not found.' }, { status: 400 });
      }
      $set.maintenanceTypeId = new ObjectId(tid);
      $set.maintenanceTypeName = String((master as { name?: string }).name ?? '');
    }

    if (Object.keys($set).length === 0) {
      return apiJson(existing);
    }

    await col.updateOne({ _id: oid, assetnumber }, { $set });
    const updated = await col.findOne({ _id: oid });
    return apiJson(updated);
  } catch (error) {
    console.error('PUT preventive maintenance record:', error);
    return apiJson({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { assetnumber: string; recordId: string } }
) {
  try {
    const { assetnumber, recordId } = params;
    if (!ObjectId.isValid(recordId)) {
      return apiJson({ error: 'Invalid record id.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection(RECORDS)
      .deleteOne({ _id: new ObjectId(recordId), assetnumber });

    if (result.deletedCount === 0) {
      return apiJson({ error: 'Record not found.' }, { status: 404 });
    }
    return apiJson({ success: true });
  } catch (error) {
    console.error('DELETE preventive maintenance record:', error);
    return apiJson({ error: 'Failed to delete record' }, { status: 500 });
  }
}
