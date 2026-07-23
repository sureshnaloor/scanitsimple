import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string; id: string } }
) {
  try {
    const { assetnumber, id } = params;
    const body = await request.json();
    
    const { _id, ...updateData } = body;
    
    const { db } = await connectToDatabase();
    
    const result = await db.collection('equipmentcustody').updateOne(
      { 
        _id: new ObjectId(id),
        assetnumber: assetnumber 
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Custody record not found' },
        { status: 404 }
      );
    }

    // Fetch and return the updated record
    const updatedRecord = await db.collection('equipmentcustody').findOne({
      _id: new ObjectId(id),
      assetnumber: assetnumber
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Failed to update custody record:', error);
    return NextResponse.json(
      { error: 'Failed to update custody record' },
      { status: 500 }
    );
  }
} 