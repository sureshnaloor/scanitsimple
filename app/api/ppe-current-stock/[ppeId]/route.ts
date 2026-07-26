import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEApiResponse } from '@/types/ppe';
import { apiJson } from '@/lib/api-response';

// GET - Get current stock for a specific PPE item
export async function GET(
  request: NextRequest,
  { params }: { params: { ppeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized: sign in before using this feature' }, { status: 401 });
    }

    const { ppeId } = params;

    const { db } = await connectToDatabase();
    
    // Get current stock balance for this PPE (case-insensitive)
    const stockBalanceCollection = db.collection('ppe-stock-balance');
    const stockBalance = await stockBalanceCollection.findOne({ 
      ppeId: { $regex: new RegExp(`^${ppeId}$`, 'i') }
    }) as any;
    
    const currentStock = stockBalance?.balQty || 0;
    
    // Debug logging
    console.log(`Debug - PPE ID: ${ppeId}, Stock Balance:`, stockBalance, `Current Stock: ${currentStock}`);
    
    // Get PPE master details (case-insensitive)
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMaster = await ppeMasterCollection.findOne({ 
      ppeId: { $regex: new RegExp(`^${ppeId}$`, 'i') }
    }) as any;
    
    if (!ppeMaster) {
      return apiJson(
        { success: false, error: 'PPE not found' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        ppeId,
        ppeName: ppeMaster.ppeName,
        currentStock,
        lastTransactionDate: stockBalance?.dateTimeUpdated || null,
        isActive: ppeMaster.isActive
      }
    };

    return apiJson(response);
  } catch (error) {
    console.error('Error fetching current stock:', error);
    return apiJson(
      { success: false, error: 'Failed to fetch current stock' },
      { status: 500 }
    );
  }
}
