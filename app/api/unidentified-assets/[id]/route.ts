import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch single unidentified Asset by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const item = await db
      .collection('unidentifiedassets')
      .findOne({ _id: new ObjectId(params.id) });

    if (!item) {
      return NextResponse.json(
        { error: 'Unidentified Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error('Failed to fetch unidentified Asset:', err);
    return NextResponse.json(
      { error: 'Failed to fetch unidentified Asset' },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update unidentified Asset
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const updateData = await request.json();

    // Validate mandatory fields if they're being updated
    if (updateData.assetdescription === '' || updateData.assetmodel === '' || updateData.assetmanufacturer === '' || updateData.assetserialnumber === '') {
      return NextResponse.json(
        { error: 'Asset Description, Model, Manufacturer, and Serial Number are required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db
      .collection('unidentifiedassets')
      .findOne({ _id: new ObjectId(params.id) });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Unidentified Asset not found' },
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
      .collection('unidentifiedassets')
      .findOneAndUpdate(
        { _id: new ObjectId(params.id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update unidentified Asset' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Failed to update unidentified Asset:', err);
    return NextResponse.json(
      { error: 'Failed to update unidentified Asset' },
      { status: 500 }
    );
  }
}

// DELETE - Delete unidentified Asset
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await db
      .collection('unidentifiedassets')
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Unidentified Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete unidentified Asset:', err);
    return NextResponse.json(
      { error: 'Failed to delete unidentified Asset' },
      { status: 500 }
    );
  }
}

