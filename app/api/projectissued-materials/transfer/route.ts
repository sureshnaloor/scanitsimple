import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

// Function to generate material ID for return materials
function generateReturnMaterialId(objectId: string): string {
  const allDigits = objectId.replace(/[^0-9]/g, '');
  if (allDigits.length === 0) {
    return Date.now().toString().padEnd(10, '0').substring(0, 10);
  }
  return allDigits.padEnd(10, '0').substring(0, 10);
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { materialId, transferData } = body;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const { db, client } = await connectToDatabase();

    // Get the material from projectissuedmaterials first
    const issuedMaterial = await db
      .collection('projectissuedmaterials')
      .findOne({ _id: new ObjectId(materialId) });

    if (!issuedMaterial) {
      return NextResponse.json(
        { error: 'Material not found in issued materials' },
        { status: 404 }
      );
    }

    // Calculate total issued quantity from materialissues collection
    const issuedRecords = await db
      .collection('materialissues')
      .find({ materialid: issuedMaterial.materialid })
      .toArray();

    const totalIssuedQuantity = issuedRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
    
    // Calculate balance quantity (original quantity - total issued quantity)
    const balanceQuantity = issuedMaterial.quantity - totalIssuedQuantity;
    
    console.log('Transfer Debug Info:', {
      materialId: issuedMaterial.materialid,
      originalQuantity: issuedMaterial.quantity,
      totalIssuedQuantity,
      balanceQuantity,
      issuedRecordsCount: issuedRecords.length
    });
    
    if (balanceQuantity <= 0) {
      return NextResponse.json(
        { error: 'No balance quantity available for transfer' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const session_db = client.startSession();
    
    try {
      await session_db.withTransaction(async () => {

        // Generate new ObjectId and material ID for return material
        const newObjectId = new ObjectId();
        const returnMaterialId = generateReturnMaterialId(newObjectId.toString());

        // Prepare the return material data
        const returnMaterialData = {
          _id: newObjectId,
          materialCode: issuedMaterial.materialCode,
          materialDescription: issuedMaterial.materialDescription,
          uom: issuedMaterial.uom,
          quantity: balanceQuantity, // Transfer only the balance quantity
          sourceProject: issuedMaterial.sourceProject,
          sourcePONumber: issuedMaterial.sourcePONumber,
          sourceIssueNumber: issuedMaterial.sourceIssueNumber,
          sourceUnitRate: issuedMaterial.sourceUnitRate,
          materialid: returnMaterialId,
          pendingRequests: 0, // Reset pending requests for return material
          createdBy: session.user?.email || 'unknown',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Additional fields for return materials
          warehouseLocation: transferData?.warehouseLocation || '',
          yardRoomRackBin: transferData?.yardRoomRackBin || '',
          receivedInWarehouseDate: transferData?.receivedInWarehouseDate || new Date(),
          consignmentNoteNumber: transferData?.consignmentNoteNumber || '',
          remarks: transferData?.remarks || issuedMaterial.remarks || '',
          // Mark as transferred from issued material
          transferredFrom: materialId,
          transferredAt: new Date()
        };

        // Insert into projectreturnmaterials collection
        await db.collection('projreturnmaterials').insertOne(returnMaterialData, { session: session_db });

        // Update the issued material to reduce quantity by the transferred amount
        // Set quantity to total issued quantity (since we're transferring the balance)
        await db.collection('projectissuedmaterials').updateOne(
          { _id: new ObjectId(materialId) },
          {
            $set: {
              quantity: totalIssuedQuantity, // Keep only the issued quantity
              updatedAt: new Date()
            }
          },
          { session: session_db }
        );
      });

      return NextResponse.json(
        { 
          success: true, 
          message: 'Material transferred successfully',
          transferredQuantity: balanceQuantity
        },
        { status: 200 }
      );

    } finally {
      await session_db.endSession();
    }

  } catch (err: any) {
    console.error('Failed to transfer material:', err);
    return NextResponse.json(
      { 
        error: err.message || 'Failed to transfer material',
        success: false 
      },
      { status: 500 }
    );
  }
}
