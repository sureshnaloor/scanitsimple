import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { collection, startAsset, endAsset } = await request.json();
    console.log('Received request:', { collection, startAsset, endAsset });

    const { db } = await connectToDatabase();

    // Fetch assets in the range
    const assets = await db.collection(collection)
      .find({
        assetnumber: {
          $gte: startAsset,
          $lte: endAsset
        }
      })
      .sort({ assetnumber: 1 })
      .project({ assetnumber: 1, _id: 0 })
      .toArray();

    console.log(`Found ${assets.length} assets`);
    
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error in range API:', error);
    return NextResponse.json({ error: 'Failed to fetch assets', details: error.message }, { status: 500 });
  }
} 