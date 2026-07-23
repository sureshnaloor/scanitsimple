import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    if (!year?.trim()) {
      return NextResponse.json([]);
    }

    const { client } = await connectToDatabase();
    const targetDb = client.db('equipment');

    let query: any;

    // Handle "pre-2010" special case
    if (year.trim().toLowerCase() === 'pre-2010') {
      const cutoffDate = new Date(2010, 0, 1); // January 1st, 2010
      query = {
        acquireddate: {
          $exists: true,
          $lt: cutoffDate
        }
      };
    } else {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 2010 || yearNum > 2100) {
        return NextResponse.json([]);
      }

      // Create date range for the year
      const startDate = new Date(yearNum, 0, 1); // January 1st of the year
      const endDate = new Date(yearNum + 1, 0, 1); // January 1st of next year (exclusive)

      query = {
        acquireddate: {
          $exists: true,
          $gte: startDate,
          $lt: endDate
        }
      };
    }

    const assets = await targetDb.collection('fixedassets').find(query).toArray();

    return NextResponse.json(assets);
  } catch (err) {
    console.error('Failed to fetch fixed assets by year of acquisition:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fixed assets' },
      { status: 500 }
    );
  }
}




