import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const categories = await db.collection('FIXED_ASSET_CATEGORIES').find({}).toArray();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fixed asset categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_CATEGORIES').insertOne({ name });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fixed asset category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { _id, name } = await request.json();
    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_CATEGORIES').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { name } }
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fixed asset category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID is required');

    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_CATEGORIES').deleteOne({
      _id: new ObjectId(id)
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fixed asset category' }, { status: 500 });
  }
} 