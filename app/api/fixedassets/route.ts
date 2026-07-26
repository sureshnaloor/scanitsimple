import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetNumber = searchParams.get('assetNumber');
    const assetName = searchParams.get('assetName');

    // Return empty array if both parameters are empty or null
    if (!assetNumber?.trim() && !assetName?.trim()) {
      return apiJson([]);
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

    return apiJson(fixedAssets);
  } catch (error) {
    console.error('Failed to fetch fixed assets:', error);
    return apiJson(
      { error: 'Failed to fetch fixed assets' },
      { status: 500 }
    );
  }
}