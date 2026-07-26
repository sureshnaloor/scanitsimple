import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { apiJson } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { materialId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    const material = await db
      .collection('projreturnmaterials')
      .findOne({ materialid: params.materialId });

    if (!material) {
      return apiJson(
        { error: 'Project return material not found' },
        { status: 404 }
      );
    }

    return apiJson(material);
  } catch (err) {
    console.error('Failed to fetch project return material:', err);
    return apiJson(
      { error: 'Failed to fetch project return material' },
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
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
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
      .collection('projreturnmaterials')
      .updateOne(
        { materialid: params.materialId },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return apiJson(
        { error: 'Project return material not found' },
        { status: 404 }
      );
    }

    return apiJson({ success: true });
  } catch (err) {
    console.error('Failed to update project return material:', err);
    return apiJson(
      { error: 'Failed to update project return material' },
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
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    const result = await db
      .collection('projreturnmaterials')
      .deleteOne({ materialid: params.materialId });

    if (result.deletedCount === 0) {
      return apiJson(
        { error: 'Project return material not found' },
        { status: 404 }
      );
    }

    return apiJson({ success: true });
  } catch (err) {
    console.error('Failed to delete project return material:', err);
    return apiJson(
      { error: 'Failed to delete project return material' },
      { status: 500 }
    );
  }
}
