import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PPEIssueRecord, PPEStockBalanceInsert, PPETransactionInsert, Employee, PPEMaster } from '@/types/ppe';

// PUT - Update an existing PPE issue record (adjust stock by delta via new transaction)
export async function PUT(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = params;
    const body = await request.json();
    const {
      userEmpNumber,
      userEmpName,
      dateOfIssue,
      ppeId,
      ppeName,
      quantityIssued,
      isFirstIssue,
      issueAgainstDue,
      remarks,
      reservationNumber,
      fileReferenceNumber,
      size,
    } = body;

    const { client, db } = await connectToDatabase();
    const recordsCollection = db.collection('ppe-records');
    const transactionsCollection = db.collection('ppe-transactions');
    const stockBalanceCollection = db.collection('ppe-stock-balance');

    const existing = await recordsCollection.findOne({ _id: new ObjectId(recordId) }) as PPEIssueRecord | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    // Basic field updates on the record
    const updatedDate = dateOfIssue ? new Date(dateOfIssue) : existing.dateOfIssue;
    const updatedPpeId = ppeId || existing.ppeId;
    const updatedPpeName = ppeName || existing.ppeName;
    const updatedQty = typeof quantityIssued === 'number' ? quantityIssued : existing.quantityIssued;
    const updatedIsFirstIssue = typeof isFirstIssue === 'boolean' ? isFirstIssue : existing.isFirstIssue;
    const updatedIssueAgainstDue = typeof issueAgainstDue === 'boolean' ? issueAgainstDue : existing.issueAgainstDue;
    const updatedRemarks = remarks !== undefined ? remarks : existing.remarks;
    const updatedReservationNumber = reservationNumber !== undefined ? reservationNumber : (existing as any).reservationNumber;
    const updatedFileReferenceNumber = fileReferenceNumber !== undefined ? fileReferenceNumber : (existing as any).fileReferenceNumber;
    const updatedSize = size !== undefined ? size : (existing as any).size;
    const updatedUserEmpNumber = userEmpNumber || existing.userEmpNumber;
    const updatedUserEmpName = userEmpName || existing.userEmpName;

    const dbSession = await client.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // If PPE item changed, revert old and apply new entirely
        if (existing.ppeId !== updatedPpeId) {
          // Revert old: add back existing.quantityIssued
          const oldBal = await stockBalanceCollection.findOne({ ppeId: existing.ppeId }, { session: dbSession }) as any;
          const oldCurrent = oldBal?.balQty || 0;
          const oldNewBal = oldCurrent + existing.quantityIssued;
          const revertTx: PPETransactionInsert = {
            ppeId: existing.ppeId,
            dateTransaction: new Date(),
            relatedRecordId: recordId,
            relatedRecordType: 'issue',
            qtyIssued: existing.quantityIssued, // positive means stock added back
            qtyAfterIssue: oldNewBal,
            transactionType: 'issue',
            remarks: `Adjustment (revert) for record change ${recordId}`,
            createdBy: session.user!.email!,
            createdAt: new Date(),
          };
          const revertTxResult = await transactionsCollection.insertOne(revertTx, { session: dbSession });
          const oldBalanceDoc: PPEStockBalanceInsert = {
            ppeId: existing.ppeId,
            balQty: oldNewBal,
            dateTimeUpdated: new Date(),
            transactionId: revertTxResult.insertedId.toString(),
            createdAt: oldBal?.createdAt || new Date(),
            updatedAt: new Date(),
          };
          await stockBalanceCollection.replaceOne({ ppeId: existing.ppeId }, oldBalanceDoc, { upsert: true, session: dbSession });

          // Apply new: subtract updatedQty if stock allows
          const newBal = await stockBalanceCollection.findOne({ ppeId: updatedPpeId }, { session: dbSession }) as any;
          const newCurrent = newBal?.balQty || 0;
          if (newCurrent < updatedQty) {
            throw new Error(`Insufficient stock for ${updatedPpeId}. Available: ${newCurrent}, Requested: ${updatedQty}`);
          }
          const newAfter = newCurrent - updatedQty;
          const applyTx: PPETransactionInsert = {
            ppeId: updatedPpeId,
            dateTransaction: updatedDate,
            relatedRecordId: recordId,
            relatedRecordType: 'issue',
            qtyIssued: -updatedQty,
            qtyAfterIssue: newAfter,
            transactionType: 'issue',
            remarks: `Adjustment (apply) for record change ${recordId}`,
            createdBy: session.user!.email!,
            createdAt: new Date(),
          };
          const applyTxResult = await transactionsCollection.insertOne(applyTx, { session: dbSession });
          const newBalanceDoc: PPEStockBalanceInsert = {
            ppeId: updatedPpeId,
            balQty: newAfter,
            dateTimeUpdated: new Date(),
            transactionId: applyTxResult.insertedId.toString(),
            createdAt: newBal?.createdAt || new Date(),
            updatedAt: new Date(),
          };
          await stockBalanceCollection.replaceOne({ ppeId: updatedPpeId }, newBalanceDoc, { upsert: true, session: dbSession });
        } else {
          // Same PPE, adjust by delta
          const delta = updatedQty - existing.quantityIssued; // positive means need to subtract more stock
          if (delta !== 0) {
            const bal = await stockBalanceCollection.findOne({ ppeId: existing.ppeId }, { session: dbSession }) as any;
            const current = bal?.balQty || 0;
            const after = current - delta; // subtract when delta positive; add when delta negative
            if (after < 0) {
              throw new Error(`Insufficient stock. Available: ${current}, Additional required: ${delta}`);
            }
            const adjTx: PPETransactionInsert = {
              ppeId: existing.ppeId,
              dateTransaction: updatedDate,
              relatedRecordId: recordId,
              relatedRecordType: 'issue',
              qtyIssued: -delta, // if delta positive, negative qtyIssued reduces stock further
              qtyAfterIssue: after,
              transactionType: 'issue',
              remarks: `Adjustment for record ${recordId}`,
              createdBy: session.user!.email!,
              createdAt: new Date(),
            };
            const adjTxResult = await transactionsCollection.insertOne(adjTx, { session: dbSession });
            const balanceDoc: PPEStockBalanceInsert = {
              ppeId: existing.ppeId,
              balQty: after,
              dateTimeUpdated: new Date(),
              transactionId: adjTxResult.insertedId.toString(),
              createdAt: bal?.createdAt || new Date(),
              updatedAt: new Date(),
            };
            await stockBalanceCollection.replaceOne({ ppeId: existing.ppeId }, balanceDoc, { upsert: true, session: dbSession });
          }
        }

        // Update record document
        await recordsCollection.updateOne(
          { _id: new ObjectId(recordId) },
          {
            $set: {
              userEmpNumber: updatedUserEmpNumber,
              userEmpName: updatedUserEmpName,
              dateOfIssue: updatedDate,
              ppeId: updatedPpeId,
              ppeName: updatedPpeName,
              quantityIssued: updatedQty,
              isFirstIssue: updatedIsFirstIssue,
              issueAgainstDue: updatedIssueAgainstDue,
              remarks: updatedRemarks,
              reservationNumber: updatedReservationNumber,
              fileReferenceNumber: updatedFileReferenceNumber,
              size: updatedSize,
              updatedAt: new Date(),
              updatedBy: session.user!.email!,
            },
          },
          { session: dbSession }
        );
      });

      return NextResponse.json({ success: true, message: 'Record updated' });
    } finally {
      await dbSession.endSession();
    }
  } catch (error: any) {
    console.error('Error updating PPE issue record:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update record' }, { status: 500 });
  }
}

// DELETE - Delete an existing PPE issue record (revert stock with a compensating transaction)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = params;
    const { client, db } = await connectToDatabase();
    const recordsCollection = db.collection('ppe-records');
    const transactionsCollection = db.collection('ppe-transactions');
    const stockBalanceCollection = db.collection('ppe-stock-balance');

    const existing = await recordsCollection.findOne({ _id: new ObjectId(recordId) }) as PPEIssueRecord | null;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    const dbSession = await client.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Revert stock by adding back issued quantity
        const bal = await stockBalanceCollection.findOne({ ppeId: existing.ppeId }, { session: dbSession }) as any;
        const current = bal?.balQty || 0;
        const after = current + existing.quantityIssued;
        const revertTx: PPETransactionInsert = {
          ppeId: existing.ppeId,
          dateTransaction: new Date(),
          relatedRecordId: recordId,
          relatedRecordType: 'issue',
          qtyIssued: existing.quantityIssued, // positive adds back stock
          qtyAfterIssue: after,
          transactionType: 'issue',
          remarks: `Revert on delete for record ${recordId}`,
          createdBy: session.user!.email!,
          createdAt: new Date(),
        };
        const txResult = await transactionsCollection.insertOne(revertTx, { session: dbSession });
        const balanceDoc: PPEStockBalanceInsert = {
          ppeId: existing.ppeId,
          balQty: after,
          dateTimeUpdated: new Date(),
          transactionId: txResult.insertedId.toString(),
          createdAt: bal?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        await stockBalanceCollection.replaceOne({ ppeId: existing.ppeId }, balanceDoc, { upsert: true, session: dbSession });

        // Delete the record
        await recordsCollection.deleteOne({ _id: new ObjectId(recordId) }, { session: dbSession });
      });

      return NextResponse.json({ success: true, message: 'Record deleted' });
    } finally {
      await dbSession.endSession();
    }
  } catch (error: any) {
    console.error('Error deleting PPE issue record:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete record' }, { status: 500 });
  }
}


