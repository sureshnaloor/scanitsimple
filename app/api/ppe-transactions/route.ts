import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPETransaction, PPEStockSummary, PPEApiResponse } from '@/types/ppe';

// GET - Fetch PPE transactions and stock summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ppeId = searchParams.get('ppeId');
    const transactionType = searchParams.get('transactionType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-transactions');

    // Build query
    let query: any = {};
    if (ppeId) {
      query.ppeId = ppeId;
    }
    if (transactionType) {
      query.transactionType = transactionType;
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const transactions = await collection
      .find(query)
      .sort({ dateTransaction: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE transactions' },
      { status: 500 }
    );
  }
}
