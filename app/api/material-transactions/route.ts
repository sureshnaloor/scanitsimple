// app/api/material-transactions/route.ts
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'materialtransactions';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('materialId');

    const { db } = await connectToDatabase();
    const filter = materialId ? { materialId } : {};
    const transactions = await db.collection(COLLECTION)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    return apiJson(transactions);
  } catch (error) {
    console.error('Failed to fetch material transactions:', error);
    return apiJson({ error: 'Failed to fetch material transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.materialId || !data.poNumber) {
      return apiJson({ error: 'materialId and poNumber required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Generate batchNumber if missing
    const batchNumber = data.batchNumber ||
      `${data.materialId}-${data.poNumber}-${data.costElement || 'NA'}-${Date.now()}`;

    const doc = {
      materialId: String(data.materialId),
      costElement: String(data.costElement || '').trim(),
      poNumber: String(data.poNumber).trim(),
      poLineItem: String(data.poLineItem || '').trim(),
      receivedQuantity: Number(data.receivedQuantity ?? data.orderQuantity) || 0,
      batchNumber,
      storageLocationId: data.storageLocationId ? String(data.storageLocationId) : '',
      rackNumber: String(data.rackNumber || '').trim(),
      binNumber: String(data.binNumber || '').trim(),
      roomNumber: String(data.roomNumber || '').trim(),
      palletNumber: String(data.palletNumber || '').trim(),
      yardNumber: String(data.yardNumber || '').trim(),
      isIssueReceipt: Boolean(data.isIssueReceipt),
      parentBatchId: data.parentBatchId ? String(data.parentBatchId) : null,
      remarks: String(data.remarks || '').trim(),
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(doc);

    // Automatically spawn the corresponding physical Material Batch
    const batchDoc = {
      materialId: doc.materialId,
      transactionId: String(result.insertedId),
      initialQuantity: doc.receivedQuantity,
      currentQuantity: doc.receivedQuantity,
      parentBatchId: doc.parentBatchId,
      storageLocationId: doc.storageLocationId,
      rackNumber: doc.rackNumber,
      binNumber: doc.binNumber,
      roomNumber: doc.roomNumber,
      palletNumber: doc.palletNumber,
      yardNumber: doc.yardNumber,
      remarks: doc.remarks,
      createdAt: doc.createdAt,
    };
    await db.collection('materialbatches').insertOne(batchDoc);

    return apiJson({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create material transaction & batch:', error);
    return apiJson({ error: 'Failed to create material transaction & batch' }, { status: 500 });
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

    if (updateFields.orderQuantity !== undefined && updateFields.receivedQuantity === undefined) {
      updateFields.receivedQuantity = updateFields.orderQuantity;
      delete updateFields.orderQuantity;
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return apiJson({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update corresponding Material Batch as well
    const updatedBatchFields: any = {};
    if (updateFields.receivedQuantity !== undefined) {
      updatedBatchFields.initialQuantity = updateFields.receivedQuantity;
      updatedBatchFields.currentQuantity = updateFields.receivedQuantity;
    }
    if (updateFields.storageLocationId !== undefined) updatedBatchFields.storageLocationId = updateFields.storageLocationId;
    if (updateFields.rackNumber !== undefined) updatedBatchFields.rackNumber = updateFields.rackNumber;
    if (updateFields.binNumber !== undefined) updatedBatchFields.binNumber = updateFields.binNumber;
    if (updateFields.roomNumber !== undefined) updatedBatchFields.roomNumber = updateFields.roomNumber;
    if (updateFields.palletNumber !== undefined) updatedBatchFields.palletNumber = updateFields.palletNumber;
    if (updateFields.yardNumber !== undefined) updatedBatchFields.yardNumber = updateFields.yardNumber;
    if (updateFields.remarks !== undefined) updatedBatchFields.remarks = updateFields.remarks;

    if (Object.keys(updatedBatchFields).length > 0) {
      await db.collection('materialbatches').updateOne(
        { transactionId: String(_id) },
        { $set: updatedBatchFields }
      );
    }

    return apiJson(result);
  } catch (error) {
    console.error('Failed to update material transaction:', error);
    return apiJson({ error: 'Failed to update material transaction' }, { status: 500 });
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
    
    // Find batch to clean up issues
    const batch = await db.collection('materialbatches').findOne({ transactionId: String(id) });
    if (batch) {
      await db.collection('materialbatchissues').deleteMany({ batchId: String(batch._id) });
      await db.collection('materialbatches').deleteOne({ _id: batch._id });
    }

    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return apiJson(result);
  } catch (error) {
    console.error('Failed to delete material transaction:', error);
    return apiJson({ error: 'Failed to delete material transaction' }, { status: 500 });
  }
}
