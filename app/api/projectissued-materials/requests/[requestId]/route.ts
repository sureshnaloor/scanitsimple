import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/auth';

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
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
    
    const requestData = await db
      .collection('materialrequests')
      .findOne({ _id: new ObjectId(params.requestId) });

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(requestData);
  } catch (err) {
    console.error('Failed to fetch material request:', err);
    return NextResponse.json(
      { error: 'Failed to fetch material request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { requestId: string } }
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
      .collection('materialrequests')
      .updateOne(
        { _id: new ObjectId(params.requestId) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update material request:', err);
    return NextResponse.json(
      { error: 'Failed to update material request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { requestId: string } }
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
    
    // Get the request first to update pending requests
    const requestData = await db
      .collection('materialrequests')
      .findOne({ _id: new ObjectId(params.requestId) });

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Delete the request
    const result = await db
      .collection('materialrequests')
      .deleteOne({ _id: new ObjectId(params.requestId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Update pending requests quantity
    await db.collection('projectissuedmaterials').updateOne(
      { materialid: requestData.materialid },
      { 
        $inc: { pendingRequests: -requestData.qtyRequested },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete material request:', err);
    return NextResponse.json(
      { error: 'Failed to delete material request' },
      { status: 500 }
    );
  }
}
