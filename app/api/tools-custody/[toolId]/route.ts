import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const custodyRecord = await db
      .collection('tools-custody')
      .findOne({ assetnumber: params.toolId });

    if (!custodyRecord) {
      return NextResponse.json(
        { error: 'Tool custody record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(custodyRecord);
  } catch (error) {
    console.error('Failed to fetch tool custody record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool custody record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;
    const updateData = await request.json();

    const { db } = await connectToDatabase();

    // Check if custody record exists
    const existingRecord = await db.collection('tools-custody').findOne({ assetnumber: toolId });

    if (!existingRecord) {
      return NextResponse.json(
        { error: `Tool custody record ${toolId} not found` },
        { status: 404 }
      );
    }

    // Remove immutable fields
    const {
      _id,
      assetnumber: _an,
      createdAt,
      ...updateFields
    } = updateData;

    const updatedRecord = await db.collection('tools-custody').findOneAndUpdate(
      { assetnumber: toolId.toString() },
      { $set: updateFields },
      { 
        returnDocument: 'after'
      }
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'Failed to update tool custody record' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRecord);

  } catch (error) {
    console.error('Error in tool custody update:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update tool custody record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
