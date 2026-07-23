import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const { db } = await connectToDatabase();
    
    const query = category ? { category } : {};
    const subcategories = await db.collection('FIXED_ASSET_SUBCATEGORIES').find(query).toArray();
    return NextResponse.json(subcategories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fixed asset subcategories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category, name } = await request.json();
    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_SUBCATEGORIES').insertOne({ category, name });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fixed asset subcategory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { _id, category, name } = await request.json();
    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_SUBCATEGORIES').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { category, name } }
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fixed asset subcategory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID is required');

    const { db } = await connectToDatabase();
    const result = await db.collection('FIXED_ASSET_SUBCATEGORIES').deleteOne({
      _id: new ObjectId(id)
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fixed asset subcategory' }, { status: 500 });
  }
} 