import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'calibrationcompanies';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const companies = await db.collection(COLLECTION)
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

export async function POST(request: Request) {
  try {
    const { code, name, address, city, country } = await request.json();
    const normalizedCode = String(code || '').trim();
    const normalizedName = String(name || '').trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedCity = String(city || '').trim();
    const normalizedCountry = String(country || '').trim();

    if (!normalizedCode || !normalizedName) {
      return apiJson({ error: 'Vendor code and name are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if code or name already exists
    const existing = await db.collection(COLLECTION).findOne({
      $or: [
        { code: normalizedCode },
        { name: normalizedName }
      ]
    });
    
    if (existing) {
      return apiJson({ error: 'Calibration company with this code or name already exists' }, { status: 409 });
    }

    const result = await db.collection(COLLECTION).insertOne({
      code: normalizedCode,
      name: normalizedName,
      address: normalizedAddress,
      city: normalizedCity,
      country: normalizedCountry,
      createdAt: new Date()
    });

    return apiJson(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create calibration company:', error);
    return apiJson({ error: 'Failed to create calibration company' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { _id, code, name, address, city, country } = await request.json();
    const normalizedCode = String(code || '').trim();
    const normalizedName = String(name || '').trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedCity = String(city || '').trim();
    const normalizedCountry = String(country || '').trim();

    if (!_id || !normalizedCode || !normalizedName) {
      return apiJson({ error: 'ID, vendor code, and name are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if another company uses the same code or name
    const existing = await db.collection(COLLECTION).findOne({
      _id: { $ne: new ObjectId(_id) },
      $or: [
        { code: normalizedCode },
        { name: normalizedName }
      ]
    });

    if (existing) {
      return apiJson({ error: 'Another calibration company with this code or name already exists' }, { status: 409 });
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          code: normalizedCode,
          name: normalizedName,
          address: normalizedAddress,
          city: normalizedCity,
          country: normalizedCountry,
          updatedAt: new Date()
        }
      }
    );

    return apiJson(result);
  } catch (error) {
    console.error('Failed to update calibration company:', error);
    return apiJson({ error: 'Failed to update calibration company' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiJson({ error: 'ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return apiJson(result);
  } catch (error) {
    console.error('Failed to delete calibration company:', error);
    return apiJson({ error: 'Failed to delete calibration company' }, { status: 500 });
  }
}