import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const uncalibratedEquipment = await db
      .collection('equipmentandtools')
      .aggregate([
        {
          $match: {
            assetnumber: {
              $regex: '^5',
            },
          },
        },
        {
          $lookup: {
            from: 'equipmentcalibcertificates',
            localField: 'assetnumber',
            foreignField: 'assetnumber',
            as: 'calibrations',
          },
        },
        {
          $match: {
            $expr: {
              $eq: [{ $size: '$calibrations' }, 0],
            },
          },
        },
        {
          $project: {
            calibrations: 0,
          },
        },
      ])
      .toArray();

    return NextResponse.json(uncalibratedEquipment);
  } catch (err) {
    console.error('Failed to fetch un-calibrated MME:', err);
    return NextResponse.json(
      { error: 'Failed to fetch un-calibrated MME' },
      { status: 500 }
    );
  }
}

