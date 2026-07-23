import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Custody } from '@/types/custody';

// GET all custody records
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const custodyRecords = await db.collection('equipmentcustody').find({}).toArray();
    return NextResponse.json(custodyRecords);
  } catch (err) {
    console.error('Failed to fetch custody records:', err);
    return NextResponse.json(
      { error: 'Failed to fetch custody records' },
      { status: 500 }
    );
  }
}

// POST new custody record
export async function POST(request: Request) {
  try {
    const body: Omit<Custody, '_id'> = await request.json();
    const { db } = await connectToDatabase();
    
    // Create new document without _id (MongoDB will generate it)
    const custodyData = {
      ...body,
      createdate: new Date(),
      // custodyfrom: new Date(body.custodyfrom) // Ensure date is properly formatted
      documentnumber: body.documentnumber || null, // Handle gatepass document number
    };
    
    const result = await db.collection('equipmentcustody').insertOne(custodyData);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('Failed to create custody record:', err);
    return NextResponse.json(
      { error: 'Failed to create custody record' },
      { status: 500 }
    );
  }
} 