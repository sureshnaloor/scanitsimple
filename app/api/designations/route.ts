import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

function normalizeName(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const designations = await db.collection('designations').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, data: designations });
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = normalizeName(body?.name);
    if (!name) {
      return NextResponse.json({ success: false, error: 'Designation name is required' }, { status: 400 });
    }

    const nameKey = normalizeKey(name);
    const { db } = await connectToDatabase();
    const collection = db.collection('designations');

    const existing = await collection.findOne({ nameKey });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Designation already exists' }, { status: 400 });
    }

    const now = new Date();
    const newDesignation = {
      name,
      nameKey,
      createdAt: now,
      createdBy: session.user.email,
      updatedAt: now,
      updatedBy: session.user.email
    };

    const result = await collection.insertOne(newDesignation);
    return NextResponse.json(
      { success: true, data: { ...newDesignation, _id: result.insertedId }, message: 'Designation created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to create designation' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body?._id ?? '').trim();
    const name = normalizeName(body?.name);
    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'Designation ID and name are required' }, { status: 400 });
    }

    const nameKey = normalizeKey(name);
    const { db } = await connectToDatabase();
    const collection = db.collection('designations');

    const duplicate = await collection.findOne({ nameKey, _id: { $ne: new ObjectId(id) } });
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Designation already exists' }, { status: 400 });
    }

    const updateDoc = {
      name,
      nameKey,
      updatedAt: new Date(),
      updatedBy: session.user.email
    };

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Designation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Designation updated successfully' });
  } catch (error) {
    console.error('Error updating designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to update designation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Designation ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('designations');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Designation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete designation' }, { status: 500 });
  }
}
