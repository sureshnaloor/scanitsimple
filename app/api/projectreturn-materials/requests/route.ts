import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET(request: Request) {
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

    const { db } = await connectToDatabase();
    
    const query: any = {};
    if (materialId?.trim()) {
      query.materialid = materialId;
    }

    const requests = await db
      .collection('projreturnrequests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (err) {
    console.error('Failed to fetch project return material requests:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project return material requests' },
      { status: 500 }
    );
  }
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
    const { db } = await connectToDatabase();
    
    // Validate that requested quantity doesn't exceed available quantity
    const material = await db.collection('projreturnmaterials').findOne({ 
      materialid: body.materialid 
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    if (body.qtyRequested > material.quantity) {
      return NextResponse.json(
        { error: 'Requested quantity exceeds available quantity' },
        { status: 400 }
      );
    }

    // Add metadata
    const requestData = {
      ...body,
      _id: new ObjectId(),
      status: 'pending',
      requestDate: new Date(),
      createdBy: session.user.name || session.user.email,
      createdAt: new Date()
    };
    
    const result = await db.collection('projreturnrequests').insertOne(requestData);
    
    // Update pending requests quantity
    await db.collection('projreturnmaterials').updateOne(
      { materialid: body.materialid },
      { 
        $inc: { pendingRequests: body.qtyRequested },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ ...result, requestId: requestData._id }, { status: 201 });
  } catch (err) {
    console.error('Failed to create project return material request:', err);
    return NextResponse.json(
      { error: 'Failed to create project return material request' },
      { status: 500 }
    );
  }
}
