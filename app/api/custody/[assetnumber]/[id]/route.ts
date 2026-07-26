import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { apiJson } from '@/lib/api-response';

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
      return apiJson(
        { error: 'Custody record not found' },
        { status: 404 }
      );
    }

    // Fetch and return the updated record
    const updatedRecord = await db.collection('equipmentcustody').findOne({
      _id: new ObjectId(id),
      assetnumber: assetnumber
    });

    return apiJson(updatedRecord);
  } catch (error) {
    console.error('Failed to update custody record:', error);
    return apiJson(
      { error: 'Failed to update custody record' },
      { status: 500 }
    );
  }
} 