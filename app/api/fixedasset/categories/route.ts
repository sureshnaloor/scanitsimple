import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db, client } = await connectToDatabase();
    
    // Try default database first (as used in /api/fixedassets)
    let categories: string[] = [];
    
    try {
      categories = await db.collection('fixedassets')
        .distinct('assetcategory', { assetcategory: { $exists: true, $nin: [null, ''] } });
    } catch (err) {
      // If not in default db, try equipment database
      console.log('Trying equipment database for fixedassets...');
      const equipmentDb = client.db('equipment');
      categories = await equipmentDb.collection('fixedassets')
        .distinct('assetcategory', { assetcategory: { $exists: true, $nin: [null, ''] } });
    }

    // Sort categories alphabetically
    const sortedCategories = categories
      .filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '')
      .map((cat: string) => cat.trim())
      .sort();

    console.log('Found categories:', sortedCategories.length);
    return NextResponse.json(sortedCategories);
  } catch (err) {
    console.error('Failed to fetch fixed asset categories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fixed asset categories' },
      { status: 500 }
    );
  }
}

