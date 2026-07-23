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

    const { db } = await connectToDatabase();
    
    const material = await db
      .collection('projectissuedmaterials')
      .findOne({ materialid: params.materialId });

    if (!material) {
      return NextResponse.json(
        { error: 'Project issued material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(material);
  } catch (err) {
    console.error('Failed to fetch project issued material:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project issued material' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Remove immutable fields that shouldn't be updated
    const { _id, materialid, createdAt, createdBy, ...updateData } = body;
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    const result = await db
      .collection('projectissuedmaterials')
      .updateOne(
        { materialid: params.materialId },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Project issued material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update project issued material:', err);
    return NextResponse.json(
      { error: 'Failed to update project issued material' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { db } = await connectToDatabase();
    
    const result = await db
      .collection('projectissuedmaterials')
      .deleteOne({ materialid: params.materialId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Project issued material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete project issued material:', err);
    return NextResponse.json(
      { error: 'Failed to delete project issued material' },
      { status: 500 }
    );
  }
}
