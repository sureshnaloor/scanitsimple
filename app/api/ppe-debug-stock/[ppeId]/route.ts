import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Debug endpoint to check stock balance for a specific PPE
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
    
    // Get stock balance
    const stockBalanceCollection = db.collection('ppe-stock-balance');
    const stockBalance = await stockBalanceCollection.findOne({ ppeId });
    
    // Get PPE master
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMaster = await ppeMasterCollection.findOne({ ppeId });
    
    // Get all stock balances to see what's available
    const allStockBalances = await stockBalanceCollection.find({}).toArray();
    
    const response = {
      success: true,
      data: {
        requestedPpeId: ppeId,
        stockBalance,
        ppeMaster,
        allStockBalances: allStockBalances.map(sb => ({
          ppeId: sb.ppeId,
          balQty: sb.balQty,
          dateTimeUpdated: sb.dateTimeUpdated
        })),
        currentStock: stockBalance?.balQty || 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in debug stock endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug stock data' },
      { status: 500 }
    );
  }
}
