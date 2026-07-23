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

    const issues = await db
      .collection('projreturnissues')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(issues);
  } catch (err) {
    console.error('Failed to fetch project return material issues:', err);
    return NextResponse.json(
      { error: 'Failed to fetch project return material issues' },
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
    
    // Validate that issue quantity doesn't exceed available quantity
    const material = await db.collection('projreturnmaterials').findOne({ 
      materialid: body.materialid 
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    if (body.issueQuantity > material.quantity) {
      return NextResponse.json(
        { error: 'Issue quantity exceeds available quantity' },
        { status: 400 }
      );
    }

    // Add metadata
    const issueData = {
      ...body,
      _id: new ObjectId(),
      issueDate: new Date(),
      createdBy: session.user.name || session.user.email,
      createdAt: new Date()
    };
    
    const result = await db.collection('projreturnissues').insertOne(issueData);
    
    // Update material quantity and pending requests
    const updateData: any = {
      $inc: { quantity: -body.issueQuantity },
      $set: { updatedAt: new Date() }
    };

    // If this is an issue from a request, reduce pending requests
    if (body.requestId) {
      updateData.$inc.pendingRequests = -body.issueQuantity;
      
      // Update the request status to 'issued'
      await db.collection('projreturnrequests').updateOne(
        { _id: new ObjectId(body.requestId) },
        { $set: { status: 'issued' } }
      );
    }

    await db.collection('projreturnmaterials').updateOne(
      { materialid: body.materialid },
      updateData
    );

    return NextResponse.json({ ...result, issueId: issueData._id }, { status: 201 });
  } catch (err) {
    console.error('Failed to create project return material issue:', err);
    return NextResponse.json(
      { error: 'Failed to create project return material issue' },
      { status: 500 }
    );
  }
}
