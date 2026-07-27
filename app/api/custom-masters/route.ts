// app/api/custom-masters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'custommasters';

// GET - List all custom master lists or get a specific one by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const { db } = await connectToDatabase();

    if (key) {
      const record = await db.collection(COLLECTION).findOne({ key });
      if (!record) {
        return apiJson({ error: 'Custom master not found' }, { status: 404 });
      }
      return apiJson(record);
    }

    const records = await db.collection(COLLECTION).find().sort({ name: 1 }).toArray();
    return apiJson(records);
  } catch (error) {
    console.error('Failed to fetch custom masters:', error);
    return apiJson({ error: 'Failed to fetch custom masters' }, { status: 500 });
  }
}

// POST - Create a new custom master list
export async function POST(request: NextRequest) {
  try {
    const { name, values } = await request.json();
    
    if (!name || !name.trim()) {
      return apiJson({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Normalize values
    const valueArray = Array.isArray(values) 
      ? values.map(v => String(v).trim()).filter(Boolean)
      : [];

    const normalizedName = String(name).trim();
    const key = `custom-${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;

    // Check if key already exists
    const existing = await db.collection(COLLECTION).findOne({ key });
    if (existing) {
      return apiJson({ error: `A master list with name similar to "${normalizedName}" already exists.` }, { status: 400 });
    }

    const doc = {
      name: normalizedName,
      key,
      values: valueArray,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(doc);
    return apiJson({ ...doc, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create custom master:', error);
    return apiJson({ error: 'Failed to create custom master' }, { status: 500 });
  }
}
