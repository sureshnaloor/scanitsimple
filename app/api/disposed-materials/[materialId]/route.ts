import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET(
  request: Request,
  { params }: { params: { materialId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { materialId } = params;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the disposed material by materialid
    const disposedMaterial = await db
      .collection('disposedmaterials')
      .findOne({ 
        materialid: materialId
      });

    if (!disposedMaterial) {
      return NextResponse.json(
        { error: 'Disposed material not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the DisposedMaterial type
    const transformedMaterial = {
      _id: disposedMaterial._id,
      materialid: disposedMaterial.materialid,
      materialCode: disposedMaterial.materialCode,
      materialDescription: disposedMaterial.materialDescription,
      uom: disposedMaterial.uom,
      disposedQuantity: disposedMaterial.disposedQuantity,
      disposedValue: disposedMaterial.disposedValue,
      sourceProject: disposedMaterial.sourceProject,
      sourceWBS: disposedMaterial.sourceWBS,
      sourcePONumber: disposedMaterial.sourcePONumber,
      sourceIssueNumber: disposedMaterial.sourceIssueNumber,
      sourceUnitRate: disposedMaterial.sourceUnitRate,
      warehouseLocation: disposedMaterial.warehouseLocation,
      yardRoomRackBin: disposedMaterial.yardRoomRackBin,
      receivedInWarehouseDate: disposedMaterial.receivedInWarehouseDate,
      consignmentNoteNumber: disposedMaterial.consignmentNoteNumber,
      gatepassNumber: disposedMaterial.gatepassNumber,
      receivedByEmpNumber: disposedMaterial.receivedByEmpNumber,
      receivedByEmpName: disposedMaterial.receivedByEmpName,
      status: disposedMaterial.status,
      disposedBy: disposedMaterial.disposedBy,
      disposedAt: disposedMaterial.disposedAt,
      remarks: disposedMaterial.remarks,
      createdAt: disposedMaterial.createdAt,
      updatedAt: disposedMaterial.updatedAt
    };

    return NextResponse.json(transformedMaterial, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching disposed material:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch disposed material',
        success: false 
      },
      { status: 500 }
    );
  }
}
