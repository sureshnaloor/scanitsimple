// app/api/material-batches/route.ts
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'materialbatches';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { db } = await connectToDatabase();
    if (id) {
      const batch = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
      return apiJson(batch);
    }

    const batches = await db.collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return apiJson(batches);
  } catch (error) {
    console.error('Failed to fetch material batches:', error);
    return apiJson({ error: 'Failed to fetch material batches' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.materialId || !data.transactionId) {
      return apiJson({ error: 'materialId and transactionId are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const doc = {
      materialId: String(data.materialId),
      transactionId: String(data.transactionId),
      initialQuantity: Number(data.initialQuantity) || 0,
      currentQuantity: Number(data.currentQuantity ?? data.initialQuantity) || 0,
      parentBatchId: data.parentBatchId ? String(data.parentBatchId) : null,
      storageLocationId: data.storageLocationId ? String(data.storageLocationId) : '',
      rackNumber: String(data.rackNumber || '').trim(),
      binNumber: String(data.binNumber || '').trim(),
      roomNumber: String(data.roomNumber || '').trim(),
      palletNumber: String(data.palletNumber || '').trim(),
      yardNumber: String(data.yardNumber || '').trim(),
      remarks: String(data.remarks || '').trim(),
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    return apiJson({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create material batch:', error);
    return apiJson({ error: 'Failed to create material batch' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data._id) {
      return apiJson({ error: '_id is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const { _id, ...updateFields } = data;

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return apiJson({ error: 'Material batch not found' }, { status: 404 });
    }
    return apiJson(result);
  } catch (error) {
    console.error('Failed to update material batch:', error);
    return apiJson({ error: 'Failed to update material batch' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiJson({ error: 'id required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('materialbatchissues').deleteMany({ batchId: id });
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return apiJson(result);
  } catch (error) {
    console.error('Failed to delete material batch:', error);
    return apiJson({ error: 'Failed to delete material batch' }, { status: 500 });
  }
}
