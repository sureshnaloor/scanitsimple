import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    const materialCode = searchParams.get('materialCode');
    const materialDescription = searchParams.get('materialDescription');
    const status = searchParams.get('status');

    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    if (materialId?.trim()) {
      query.materialid = { $regex: materialId, $options: 'i' };
    }
    if (materialCode?.trim()) {
      query.materialCode = { $regex: materialCode, $options: 'i' };
    }
    if (materialDescription?.trim()) {
      query.materialDescription = { $regex: materialDescription, $options: 'i' };
    }
    if (status?.trim()) {
      query.status = status;
    }

    const disposedMaterials = await db
      .collection('disposedmaterials')
      .find(query)
      .sort({ disposedAt: -1 })
      .toArray();

    return NextResponse.json(disposedMaterials);

  } catch (error) {
    console.error('Error fetching disposed materials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
