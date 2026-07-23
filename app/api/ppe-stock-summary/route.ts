import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEStockSummary, PPEApiResponse } from '@/types/ppe';

// GET - Fetch current stock summary for all PPE items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ppeId = searchParams.get('ppeId');

    const { db } = await connectToDatabase();
    
    // Get all PPE master records
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMasterRecords = await ppeMasterCollection.find({ isActive: true }).toArray();
    
    // Get all stock balance records
    const stockBalanceCollection = db.collection('ppe-stock-balance');
    const stockBalances = await stockBalanceCollection.find({}).toArray();
    
    // Get all transactions for calculating initial stock and total issued
    const transactionsCollection = db.collection('ppe-transactions');
    
    // Calculate stock summary for each PPE
    const stockSummary: PPEStockSummary[] = [];
    
    for (const ppe of ppeMasterRecords) {
      // Get current stock balance
      const stockBalance = stockBalances.find(sb => sb.ppeId === ppe.ppeId);
      const currentStock = stockBalance?.balQty || 0;
      
      // Get transactions for this PPE to calculate initial stock and total issued
      const ppeTransactions = await transactionsCollection
        .find({ ppeId: ppe.ppeId })
        .sort({ dateTransaction: -1 })
        .toArray();
      
      // Get initial stock (first transaction with type 'initial')
      const initialTransaction = ppeTransactions.find(t => t.transactionType === 'initial');
      const initialStock = initialTransaction?.initialQty || 0;
      
      // Calculate total issued (sum of all issue transactions)
      const totalIssued = ppeTransactions
        .filter(t => t.transactionType === 'issue' || t.transactionType === 'bulk_issue')
        .reduce((sum, t) => sum + Math.abs(t.qtyIssued || 0), 0); // Use absolute value since qtyIssued is negative
      
      // Get last issue date
      const lastIssueTransaction = ppeTransactions.find(t => 
        t.transactionType === 'issue' || t.transactionType === 'bulk_issue'
      );
      
      stockSummary.push({
        ppeId: ppe.ppeId,
        ppeName: ppe.ppeName,
        currentStock,
        initialStock,
        totalIssued,
        lastTransactionDate: stockBalance?.dateTimeUpdated || new Date(),
        lastIssueDate: lastIssueTransaction?.dateTransaction
      });
    }
    
    // Filter by ppeId if specified
    const filteredSummary = ppeId 
      ? stockSummary.filter(s => s.ppeId === ppeId)
      : stockSummary;

    const response: PPEApiResponse<PPEStockSummary[]> = {
      success: true,
      data: filteredSummary
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE stock summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE stock summary' },
      { status: 500 }
    );
  }
}
