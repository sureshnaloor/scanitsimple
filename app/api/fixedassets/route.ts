import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber');
    const assetName = searchParams.get('assetName');

    // Return empty array if both parameters are empty or null
    if (!assetNumber?.trim() && !assetName?.trim()) {
      return NextResponse.json([]);
    }

    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    if (assetNumber?.trim()) {
      query.assetnumber = { $regex: assetNumber, $options: 'i' };
    }
    if (assetName?.trim()) {
      query.assetdescription = { $regex: assetName, $options: 'i' };
    }

    const fixedAssets = await db
      .collection('fixedassets')
      .find(query)
      .toArray();

    return NextResponse.json(fixedAssets);
  } catch (error) {
    console.error('Failed to fetch fixed assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fixed assets' },
      { status: 500 }
    );
  }
}