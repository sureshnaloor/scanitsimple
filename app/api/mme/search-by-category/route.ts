import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category?.trim()) {
      return NextResponse.json([]);
    }

    const { client } = await connectToDatabase();
    const targetDb = client.db('equipment');

    const fieldName = 'assetcategory';
    const trimmed = category.trim();

    const query: any = {
      [fieldName]: {
        $exists: true,
        $nin: [null, ''],
        $regex: trimmed,
        $options: 'i'
      }
    };

    const assets = await targetDb.collection('equipmentandtools').find(query).toArray();

    const filteredAssets = assets.filter(asset => {
      const value = asset[fieldName];
      if (!value || typeof value !== 'string') return false;
      const v = value.trim();
      if (v === '') return false;
      return v.toLowerCase().includes(trimmed.toLowerCase());
    });

    return NextResponse.json(filteredAssets);
  } catch (err) {
    console.error('Failed to fetch MME by category:', err);
    return NextResponse.json(
      { error: 'Failed to fetch MME equipment' },
      { status: 500 }
    );
  }
}




