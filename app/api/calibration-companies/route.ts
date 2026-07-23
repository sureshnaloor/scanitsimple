import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const companies = await db.collection('calibrationcompanies')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Failed to fetch calibration companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibration companies' },
      { status: 500 }
    );
  }
} 