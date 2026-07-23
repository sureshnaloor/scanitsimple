import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';

// GET - Fetch all unidentified MME
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const items = await db
      .collection('unidentifiedmme')
      .find({})
      .sort({ createdat: -1 })
      .toArray();

    return NextResponse.json(items);
  } catch (err) {
    console.error('Failed to fetch unidentified MME:', err);
    return NextResponse.json(
      { error: 'Failed to fetch unidentified MME' },
      { status: 500 }
    );
  }
}

// POST - Create new unidentified MME
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { db } = await connectToDatabase();

    // Validate mandatory fields
    if (!body.assetmodel || !body.assetmanufacturer || !body.assetserialnumber) {
      return NextResponse.json(
        { error: 'Model, Manufacturer, and Serial Number are required' },
        { status: 400 }
      );
    }

    const item = {
      ...body,
      locationdate: body.locationdate ? new Date(body.locationdate) : new Date(),
      createdat: new Date(),
      createdby: session.user.email,
    };

    const result = await db.collection('unidentifiedmme').insertOne(item);
    const insertedItem = await db.collection('unidentifiedmme').findOne({ _id: result.insertedId });

    return NextResponse.json(insertedItem, { status: 201 });
  } catch (err) {
    console.error('Failed to create unidentified MME:', err);
    return NextResponse.json(
      { error: 'Failed to create unidentified MME' },
      { status: 500 }
    );
  }
}

