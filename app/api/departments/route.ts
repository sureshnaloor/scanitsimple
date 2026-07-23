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
    const departments = await db.collection('departments').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch departments' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
    }

    const nameKey = normalizeKey(name);
    const { db } = await connectToDatabase();
    const collection = db.collection('departments');

    const existing = await collection.findOne({ nameKey });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Department already exists' }, { status: 400 });
    }

    const now = new Date();
    const newDepartment = {
      name,
      nameKey,
      createdAt: now,
      createdBy: session.user.email,
      updatedAt: now,
      updatedBy: session.user.email
    };

    const result = await collection.insertOne(newDepartment);
    return NextResponse.json(
      { success: true, data: { ...newDepartment, _id: result.insertedId }, message: 'Department created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ success: false, error: 'Failed to create department' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Department ID and name are required' }, { status: 400 });
    }

    const nameKey = normalizeKey(name);
    const { db } = await connectToDatabase();
    const collection = db.collection('departments');

    const duplicate = await collection.findOne({ nameKey, _id: { $ne: new ObjectId(id) } });
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Department already exists' }, { status: 400 });
    }

    const updateDoc = {
      name,
      nameKey,
      updatedAt: new Date(),
      updatedBy: session.user.email
    };

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ success: false, error: 'Failed to update department' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('departments');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete department' }, { status: 500 });
  }
}
