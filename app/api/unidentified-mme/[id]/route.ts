import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { ObjectId } from 'mongodb';
import { apiJson } from '@/lib/api-response';

// GET - Fetch single unidentified MME by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const item = await db
      .collection('unidentifiedmme')
      .findOne({ _id: new ObjectId(params.id) });

    if (!item) {
      return apiJson(
        { error: 'Unidentified MME not found' },
        { status: 404 }
      );
    }

    return apiJson(item);
  } catch (err) {
    console.error('Failed to fetch unidentified MME:', err);
    return apiJson(
      { error: 'Failed to fetch unidentified MME' },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update unidentified MME
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const updateData = await request.json();

    // Validate mandatory fields if they're being updated
    if (updateData.assetmodel === '' || updateData.assetmanufacturer === '' || updateData.assetserialnumber === '') {
      return apiJson(
        { error: 'Model, Manufacturer, and Serial Number are required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db
      .collection('unidentifiedmme')
      .findOne({ _id: new ObjectId(params.id) });

    if (!existingItem) {
      return apiJson(
        { error: 'Unidentified MME not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateFields: any = { ...updateData };
    delete updateFields._id;
    
    if (updateFields.locationdate) {
      updateFields.locationdate = new Date(updateFields.locationdate);
    }
    updateFields.updatedat = new Date();
    updateFields.updatedby = session.user.email;

    const result = await db
      .collection('unidentifiedmme')
      .findOneAndUpdate(
        { _id: new ObjectId(params.id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

    if (!result) {
      return apiJson(
        { error: 'Failed to update unidentified MME' },
        { status: 500 }
      );
    }

    return apiJson(result);
  } catch (err) {
    console.error('Failed to update unidentified MME:', err);
    return apiJson(
      { error: 'Failed to update unidentified MME' },
      { status: 500 }
    );
  }
}

// DELETE - Delete unidentified MME
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson(
        { error: 'Unauthorized: sign in before using this feature' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection('unidentifiedmme')
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return apiJson(
        { error: 'Unidentified MME not found' },
        { status: 404 }
      );
    }

    return apiJson({ success: true });
  } catch (err) {
    console.error('Failed to delete unidentified MME:', err);
    return apiJson(
      { error: 'Failed to delete unidentified MME' },
      { status: 500 }
    );
  }
}

