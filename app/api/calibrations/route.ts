import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Calibration } from '@/types/asset';
import { apiJson } from '@/lib/api-response';

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

// GET all calibrations
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const calibrations = await db.collection('equipmentcalibcertificates').find({}).toArray();
    return apiJson(calibrations);
  } catch (err) {
    console.error('Failed to fetch calibrations:', err);
    return apiJson(
      { error: 'Failed to fetch calibrations' },
      { status: 500 }
    );
  }
}

// POST new calibration
export async function POST(request: Request) {
  try {
    const body: Omit<Calibration, '_id'> = await request.json();
    const { db } = await connectToDatabase();
    
    // Create new document without _id (MongoDB will generate it)
    const calibrationData = {
      ...normalizeCalibrationPayload(body as unknown as Record<string, unknown>),
      createdat: new Date(),
    };
    
    const result = await db.collection('equipmentcalibcertificates').insertOne(calibrationData);
    return apiJson(result, { status: 201 });
  } catch (err) {
    console.error('Failed to create calibration:', err);
    return apiJson(
      { error: 'Failed to create calibration' },
      { status: 500 }
    );
  }
}
