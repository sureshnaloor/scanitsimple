import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeCalibrationPayload(input: Record<string, unknown>) {
  const req = (input.calibrationRequired as string) || 'Required';
  if (req === 'Not Required') {
    return {
      ...input,
      calibrationRequired: 'Not Required',
      idleCalibrationDuration: '',
      idlePeriodFrom: null,
      idlePeriodTo: null,
    };
  }
  return {
    ...input,
    calibrationRequired: 'Required',
    idleCalibrationDuration: String(input.idleCalibrationDuration ?? '').trim(),
    idlePeriodFrom: parseOptionalDate(input.idlePeriodFrom),
    idlePeriodTo: parseOptionalDate(input.idlePeriodTo),
  };
}

// GET calibrations for specific asset
export async function GET(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const calibrations = await db
      .collection('equipmentcalibcertificates')
      .find({ assetnumber: params.assetnumber })
      .sort({ calibrationtodate: -1 })
      .toArray();

    console.log('Fetched calibrations:', JSON.stringify(calibrations, null, 2));

    if (!calibrations.length) {
      return NextResponse.json([]);
    }

    return NextResponse.json(calibrations);
  } catch (error) {
    console.error('Failed to fetch calibrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibrations' },
      { status: 500 }
    );
  }
}

// PUT (update) calibration
export async function PUT(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Ensure we have an _id to update the specific calibration
    if (!body._id) {
      return NextResponse.json(
        { error: 'Calibration ID is required' },
        { status: 400 }
      );
    }

    // Remove _id from the update body since MongoDB doesn't allow modifying _id
    const { _id, ...updateData } = body;
    const normalizedUpdateData = normalizeCalibrationPayload(updateData as Record<string, unknown>);
    
    const result = await db.collection('equipmentcalibcertificates').updateOne(
      { 
        _id: new ObjectId(_id),
        assetnumber: params.assetnumber // Keep this as additional validation
      },
      { $set: normalizedUpdateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Calibration not found' },
        { status: 404 }
      );
    }

    // Fetch and return the updated document
    const updatedCalibration = await db
      .collection('equipmentcalibcertificates')
      .findOne({ _id: new ObjectId(_id) });

    return NextResponse.json(updatedCalibration);
  } catch (error) {
    console.error('Failed to update calibration:', error);
    return NextResponse.json(
      { error: 'Failed to update calibration' },
      { status: 500 }
    );
  }
}

// DELETE calibration
export async function DELETE(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('equipmentcalibcertificates').deleteOne({
      assetnumber: params.assetnumber
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Calibration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to delete calibration:', error);
    return NextResponse.json(
      { error: 'Failed to delete calibration' },
      { status: 500 }
    );
  }
}

// POST new calibration
export async function POST(
  request: Request,
  { params }: { params: { assetnumber: string } }
) {
  try {
    const body = await request.json();
    console.log('Received POST body:', body);
    console.log('Asset number from params:', params.assetnumber);

    const { db } = await connectToDatabase();
    
    const newCalibration = {
      ...normalizeCalibrationPayload(body as Record<string, unknown>),
      assetnumber: params.assetnumber,
      createdat: new Date(),
    };
    console.log('Attempting to insert:', newCalibration);

    const result = await db
      .collection('equipmentcalibcertificates')
      .insertOne(newCalibration);

    console.log('Insert result:', result);

    if (!result.insertedId) {
      throw new Error('Failed to insert calibration');
    }

    // Fetch and return the newly created document
    const createdCalibration = await db
      .collection('equipmentcalibcertificates')
      .findOne({ _id: result.insertedId });

    return NextResponse.json(createdCalibration);
  } catch (error) {
    console.error('Failed to create calibration:', error);
    return NextResponse.json(
      { error: 'Failed to create calibration' },
      { status: 500 }
    );
  }
}
