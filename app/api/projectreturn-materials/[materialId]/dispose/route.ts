import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db, client } = await connectToDatabase();
    const materialId = params.materialId;

    // Find the material to dispose
    const material = await db
      .collection('projreturnmaterials')
      .findOne({ materialid: materialId });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Check if material is already disposed
    if (material.disposed) {
      return NextResponse.json({ error: 'Material already disposed' }, { status: 400 });
    }

    // Calculate current value (quantity * unit rate)
    const currentValue = (material.quantity || 0) * (material.sourceUnitRate || 0);

    // Create disposed material record
    const disposedMaterial = {
      originalMaterialId: materialId,
      materialid: material.materialid,
      materialCode: material.materialCode,
      materialDescription: material.materialDescription,
      uom: material.uom,
      disposedQuantity: material.quantity,
      disposedValue: currentValue,
      sourceProject: material.sourceProject,
      sourceWBS: material.sourceWBS,
      sourcePONumber: material.sourcePONumber,
      sourceIssueNumber: material.sourceIssueNumber,
      sourceUnitRate: material.sourceUnitRate,
      warehouseLocation: material.warehouseLocation,
      yardRoomRackBin: material.yardRoomRackBin,
      receivedInWarehouseDate: material.receivedInWarehouseDate,
      consignmentNoteNumber: material.consignmentNoteNumber,
      gatepassNumber: material.gatepassNumber,
      receivedByEmpNumber: material.receivedByEmpNumber,
      receivedByEmpName: material.receivedByEmpName,
      remarks: material.remarks,
      disposedBy: session.user?.email || 'unknown',
      disposedAt: new Date(),
      status: 'scrap',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Start transaction
    const dbSession = await client.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        // Insert into disposed materials collection
        await db.collection('disposedmaterials').insertOne(disposedMaterial, { session: dbSession });

        // Mark material as disposed in original collection
        await db.collection('projreturnmaterials').updateOne(
          { materialid: materialId },
          { 
            $set: { 
              disposed: true,
              disposedAt: new Date(),
              disposedBy: session.user?.email || 'unknown',
              updatedAt: new Date()
            }
          },
          { session: dbSession }
        );
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Material disposed successfully',
        disposedMaterial 
      });

    } catch (error) {
      console.error('Transaction error:', error);
      return NextResponse.json({ error: 'Failed to dispose material' }, { status: 500 });
    } finally {
      await dbSession.endSession();
    }

  } catch (error) {
    console.error('Error disposing material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
