import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEStockBalance, PPEApiResponse } from '@/types/ppe';

// GET - Get current stock balance for a specific PPE item
export async function GET(
  request: NextRequest,
  { params }: { params: { ppeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { ppeId } = params;

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-stock-balance');
    
    // Get the current stock balance for this PPE
    const stockBalance = await collection.findOne({ ppeId }) as PPEStockBalance | null;
    
    if (!stockBalance) {
      return NextResponse.json(
        { success: false, error: 'Stock balance not found for this PPE' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<PPEStockBalance> = {
      success: true,
      data: stockBalance
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
