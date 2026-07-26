import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const RECORDS = 'portable_modification';

const KINDS = new Set(['material', 'service']);

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

    if (body?.entryKind !== undefined) {
      const k = String(body.entryKind ?? '').trim();
      if (!KINDS.has(k)) {
        return apiJson({ error: 'entryKind must be material or service.' }, { status: 400 });
      }
      $set.entryKind = k;
    }
    if (body?.category !== undefined) {
      const c = String(body.category ?? '').trim();
      if (!c) {
        return apiJson({ error: 'Category cannot be empty.' }, { status: 400 });
      }
      $set.category = c;
    }
    if (body?.description !== undefined) {
      const d = String(body.description ?? '').trim();
      if (!d) {
        return apiJson({ error: 'Description cannot be empty.' }, { status: 400 });
      }
      $set.description = d;
    }
    if (body?.remarks !== undefined) {
      $set.remarks = String(body.remarks ?? '').trim();
    }
    if (body?.workDate !== undefined) {
      if (body.workDate === null || body.workDate === '') {
        $set.workDate = null;
      } else {
        const d = new Date(String(body.workDate));
        if (Number.isNaN(d.getTime())) {
          return apiJson({ error: 'Invalid work date.' }, { status: 400 });
        }
        $set.workDate = d;
      }
    }

    if (Object.keys($set).length === 0) {
      return apiJson(existing);
    }

    await col.updateOne({ _id: oid, assetnumber }, { $set });
    const updated = await col.findOne({ _id: oid });
    return apiJson(updated);
  } catch (error) {
    console.error('PUT portable modification:', error);
    return apiJson({ error: 'Failed to update modification' }, { status: 500 });
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
    console.error('DELETE portable modification:', error);
    return apiJson({ error: 'Failed to delete modification' }, { status: 500 });
  }
}
