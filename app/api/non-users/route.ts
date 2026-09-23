import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';
import { NonUser } from '@/types/non-user';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized: sign in required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const { db } = await connectToDatabase();
    const collection = db.collection('non_users');

    const query: any = {};
    if (active) {
      query.active = active;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { passportNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await collection.countDocuments(query);
    const records = await collection
      .find(query)
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return apiJson({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch non-users:', error);
    return apiJson(
      { success: false, error: 'Failed to fetch non-users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized: sign in required' }, { status: 401 });
    }

    const body: NonUser = await request.json();

    if (!body.fullName || !body.fullName.trim()) {
      return apiJson({ success: false, error: 'Full name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('non_users');

    const now = new Date();
    const newDoc = {
      fullName: body.fullName.trim(),
      nationalId: body.nationalId?.trim() || '',
      serialNumber: body.serialNumber?.trim() || '',
      passportNumber: body.passportNumber?.trim() || '',
      address: body.address?.trim() || '',
      phone: body.phone?.trim() || '',
      email: body.email?.trim() || '',
      category: body.category?.trim() || 'Visitor',
      active: body.active || 'Y',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newDoc);
    return apiJson(
      { success: true, message: 'Non-User created successfully', data: { _id: result.insertedId, ...newDoc } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create non-user:', error);
    return apiJson(
      { success: false, error: 'Failed to create non-user' },
      { status: 500 }
    );
  }
}
