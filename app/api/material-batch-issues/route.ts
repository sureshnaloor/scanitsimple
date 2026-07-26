// app/api/material-batch-issues/route.ts
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'materialbatchissues';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    const { db } = await connectToDatabase();
    const filter = batchId ? { batchId: String(batchId) } : {};
    
    const issues = await db.collection(COLLECTION)
      .find(filter)
      .sort({ issueDate: -1 })
      .toArray();

    return apiJson(issues);
  } catch (error) {
    console.error('Failed to fetch material batch issues:', error);
    return apiJson({ error: 'Failed to fetch material batch issues' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      batchId,
      quantity,
      issueDate,
      issuedBy,
      receivedBy,
      transportMode,
      drawingNumber,
      usageLocation,
      remarks,
      destinationStorageLocationId,
      destinationRack,
      destinationBin
    } = data;

    const issueQty = Number(quantity);

    if (!batchId || isNaN(issueQty) || issueQty <= 0) {
      return apiJson({ error: 'batchId and positive quantity are required' }, { status: 400 });
    }

    if (!issuedBy || !receivedBy) {
      return apiJson({ error: 'Issuer and Receiver employees are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // 1. Fetch parent batch
    const parentBatch = await db.collection('materialbatches').findOne({ _id: new ObjectId(batchId) });
    if (!parentBatch) {
      return apiJson({ error: 'Parent Batch not found' }, { status: 404 });
    }

    // 2. Perform atomic check and decrement on currentQuantity in materialbatches
    const batchUpdateResult = await db.collection('materialbatches').updateOne(
      {
        _id: new ObjectId(batchId),
        currentQuantity: { $gte: issueQty }
      },
      {
        $inc: { currentQuantity: -issueQty }
      }
    );

    if (batchUpdateResult.matchedCount === 0) {
      return apiJson({
        error: `Insufficient quantity available. Requested: ${issueQty}, Available: ${parentBatch.currentQuantity}`
      }, { status: 400 });
    }

    // 3. Insert the issue log document
    const doc = {
      batchId: String(batchId),
      quantity: issueQty,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      entryDate: new Date(), // system date/time
      issuedBy: String(issuedBy).trim(),
      receivedBy: String(receivedBy).trim(),
      transportMode: String(transportMode || 'by hand').trim(),
      drawingNumber: String(drawingNumber || '').trim(),
      usageLocation: String(usageLocation || '').trim(),
      remarks: String(remarks || '').trim(),
    };
    const issueResult = await db.collection(COLLECTION).insertOne(doc);

    // 4. Create child transaction and child batch ONLY if destination storage location is provided
    if (destinationStorageLocationId) {
      let parentTx: any = null;
      try {
        parentTx = await db.collection('materialtransactions').findOne({ _id: new ObjectId(parentBatch.transactionId) });
      } catch (e) {
        console.warn('Could not load parent transaction:', e);
      }

      const parentPo = parentTx ? parentTx.poNumber : 'Unknown';
      const parentPoLine = parentTx ? parentTx.poLineItem : '';
      const parentCost = parentTx ? parentTx.costElement : '';
      const parentBatchNum = parentTx ? parentTx.batchNumber : 'Root';

      // 5. Create Child Transaction representing the receipt batch of this issue
      const childTx = {
        materialId: String(parentBatch.materialId),
        poNumber: parentPo,
        poLineItem: parentPoLine,
        costElement: parentCost,
        receivedQuantity: issueQty,
        batchNumber: `${parentBatchNum}-ISS-${Date.now()}`,
        isIssueReceipt: true,
        parentBatchId: String(batchId),
        storageLocationId: String(destinationStorageLocationId),
        rackNumber: String(destinationRack || '—').trim(),
        binNumber: String(destinationBin || '—').trim(),
        roomNumber: parentBatch.roomNumber || '',
        palletNumber: parentBatch.palletNumber || '',
        yardNumber: parentBatch.yardNumber || '',
        remarks: `Issued to site: ${doc.remarks || 'No remarks'}`,
        createdAt: issueDate ? new Date(issueDate) : new Date(),
      };
      const txInsert = await db.collection('materialtransactions').insertOne(childTx);

      // 6. Create Child Batch linking child transaction
      const childBatch = {
        materialId: String(parentBatch.materialId),
        transactionId: String(txInsert.insertedId),
        initialQuantity: issueQty,
        currentQuantity: issueQty,
        parentBatchId: String(batchId), // link to parent batch
        storageLocationId: String(destinationStorageLocationId),
        rackNumber: String(destinationRack || '—').trim(),
        binNumber: String(destinationBin || '—').trim(),
        roomNumber: parentBatch.roomNumber || '',
        palletNumber: parentBatch.palletNumber || '',
        yardNumber: parentBatch.yardNumber || '',
        remarks: `Issued to site: ${doc.remarks || 'No remarks'}`,
        createdAt: issueDate ? new Date(issueDate) : new Date(),
      };
      await db.collection('materialbatches').insertOne(childBatch);
    }

    return apiJson({ ...doc, _id: issueResult.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create material batch issue:', error);
    return apiJson({ error: 'Failed to create material batch issue' }, { status: 500 });
  }
}
