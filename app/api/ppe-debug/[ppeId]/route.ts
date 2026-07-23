import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

// GET - Debug endpoint to check transaction data for a specific PPE
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
    
    // Get all transactions for this PPE
    const transactionsCollection = db.collection('ppe-transactions');
    const transactions = await transactionsCollection
      .find({ ppeId })
      .sort({ dateTransaction: -1, createdAt: -1 })
      .toArray();
    
    // Get PPE master details
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMaster = await ppeMasterCollection.findOne({ ppeId });
    
    const response = {
      success: true,
      data: {
        ppeId,
        ppeMaster,
        transactions,
        latestTransaction: transactions[0] || null,
        currentStock: transactions[0]?.qtyAfterIssue || 0,
        totalTransactions: transactions.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}
