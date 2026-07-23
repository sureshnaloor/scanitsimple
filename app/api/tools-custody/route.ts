import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber');

    const { db } = await connectToDatabase();

    if (!assetNumber?.trim()) {
      return NextResponse.json([]);
    }

    const custodyRecords = await db
      .collection('tools-custody')
      .find({ assetnumber: assetNumber })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(custodyRecords);
  } catch (err) {
    console.error('Failed to fetch tool custody records:', err);
    return NextResponse.json(
      { error: 'Failed to fetch tool custody records' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Add metadata
    body.createdAt = new Date();
    
    const result = await db.collection('tools-custody').insertOne(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('Failed to create tool custody record:', err);
    return NextResponse.json(
      { error: 'Failed to create tool custody record' },
      { status: 500 }
    );
  }
}
