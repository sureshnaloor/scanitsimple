import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { assetNumber, latitude, longitude, landmark, timestamp } = await request.json();

    const { db } = await connectToDatabase();
    
    const result = await db.collection('locationLogs').insertOne({
      assetNumber,
      latitude,
      longitude,
      landmark,
      timestamp: new Date(timestamp),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log location' },
      { status: 500 }
    );
  }
}