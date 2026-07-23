import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEStockBalance, PPEApiResponse } from '@/types/ppe';

// GET - Fetch current stock balance for all PPE items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ppeId = searchParams.get('ppeId');

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-stock-balance');

    // Build query
    let query: any = {};
    if (ppeId) {
      query.ppeId = ppeId;
    }

    // Get current stock balance records
    const stockBalances = await collection
      .find(query)
      .sort({ dateTimeUpdated: -1 })
      .toArray() as unknown as PPEStockBalance[];

    const response: PPEApiResponse<PPEStockBalance[]> = {
      success: true,
      data: stockBalances
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE stock balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE stock balance' },
      { status: 500 }
    );
  }
}
