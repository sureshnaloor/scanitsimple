import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const { db } = await connectToDatabase();
    const collection = db.collection('non_users');

    let query: any = { active: { $ne: 'N' } };
    if (q.trim()) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { nationalId: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
        { passportNumber: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const records = await collection
      .find(query)
      .sort({ fullName: 1 })
      .limit(30)
      .toArray();

    return apiJson({
      success: true,
      data: {
        records,
      },
    });
  } catch (error) {
    console.error('Failed to search non-users:', error);
    return apiJson(
      { success: false, error: 'Failed to search non-users' },
      { status: 500 }
    );
  }
}
