import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');

    if (!model?.trim()) {
      return NextResponse.json([]);
    }

    const { client } = await connectToDatabase();
    const targetDb = client.db('equipment');

    const fieldName = 'assetmodel';
    const trimmed = model.trim();

    const query: any = {
      [fieldName]: {
        $exists: true,
        $nin: [null, ''],
        $regex: trimmed,
        $options: 'i'
      }
    };

    const assets = await targetDb.collection('fixedassets').find(query).toArray();

    const filteredAssets = assets.filter(asset => {
      const value = asset[fieldName];
      if (!value || typeof value !== 'string') return false;
      const v = value.trim();
      if (v === '') return false;
      return v.toLowerCase().includes(trimmed.toLowerCase());
    });

    return NextResponse.json(filteredAssets);
  } catch (err) {
    console.error('Failed to fetch fixed assets by model:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fixed assets' },
      { status: 500 }
    );
  }
}




