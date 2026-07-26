import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const companies = await db.collection('calibrationcompanies')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return apiJson(companies);
  } catch (error) {
    console.error('Failed to fetch calibration companies:', error);
    return apiJson(
      { error: 'Failed to fetch calibration companies' },
      { status: 500 }
    );
  }
} 