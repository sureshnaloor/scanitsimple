import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

const COLLECTION = 'MME_MANUFACTURERS';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const manufacturers = await db.collection(COLLECTION).find({}).sort({ name: 1 }).toArray();
    return apiJson(manufacturers);
  } catch (error) {
    return apiJson({ error: 'Failed to fetch MME manufacturers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      return apiJson({ error: 'Manufacturer name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const existing = await db.collection(COLLECTION).findOne({ name: normalizedName });
    if (existing) {
      return apiJson({ error: 'Manufacturer already exists' }, { status: 409 });
    }

    const result = await db.collection(COLLECTION).insertOne({ name: normalizedName });
    return apiJson(result, { status: 201 });
  } catch (error) {
    return apiJson({ error: 'Failed to create MME manufacturer' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { _id, name } = await request.json();
    const normalizedName = String(name || '').trim();
    if (!_id || !normalizedName) {
      return apiJson({ error: 'Manufacturer id and name are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(_id) },
      { $set: { name: normalizedName } }
    );
    return apiJson(result);
  } catch (error) {
    return apiJson({ error: 'Failed to update MME manufacturer' }, { status: 500 });
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
    return apiJson({ error: 'Failed to delete MME manufacturer' }, { status: 500 });
  }
}
