import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return apiJson({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const doc = await db.collection('non_users').findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return apiJson({ success: false, error: 'Non-User record not found' }, { status: 404 });
    }

    return apiJson({ success: true, data: doc });
  } catch (error) {
    console.error('Failed to fetch non-user:', error);
    return apiJson({ success: false, error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return apiJson({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const body = await request.json();
    if (!body.fullName || !body.fullName.trim()) {
      return apiJson({ success: false, error: 'Full name is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const updateData = {
      fullName: body.fullName.trim(),
      nationalId: body.nationalId?.trim() || '',
      serialNumber: body.serialNumber?.trim() || '',
      passportNumber: body.passportNumber?.trim() || '',
      address: body.address?.trim() || '',
      phone: body.phone?.trim() || '',
      email: body.email?.trim() || '',
      category: body.category?.trim() || 'Visitor',
      active: body.active || 'Y',
      updatedAt: new Date(),
    };

    const result = await db.collection('non_users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return apiJson({ success: false, error: 'Non-User record not found' }, { status: 404 });
    }

    return apiJson({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Failed to update non-user:', error);
    return apiJson({ success: false, error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return apiJson({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('non_users').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return apiJson({ success: false, error: 'Non-User record not found' }, { status: 404 });
    }

    return apiJson({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Failed to delete non-user:', error);
    return apiJson({ success: false, error: 'Failed to delete record' }, { status: 500 });
  }
}
