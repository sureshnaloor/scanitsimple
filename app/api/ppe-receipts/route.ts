import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEReceipt, PPEReceiptInsert, PPEMaster, Employee, PPETransactionInsert, PPEStockBalanceInsert } from '@/types/ppe';

interface PPEApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ppeId = searchParams.get('ppeId');
    const searchTerm = searchParams.get('search');

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-receipts');

    let query: any = {};
    
    if (ppeId) {
      query.ppeId = ppeId;
    }
    
    if (searchTerm) {
      query.$or = [
        { ppeId: { $regex: searchTerm, $options: 'i' } },
        { ppeName: { $regex: searchTerm, $options: 'i' } },
        { receivedByName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const receipts = await collection
      .find(query)
      .sort({ dateOfReceipt: -1 })
      .toArray() as unknown as PPEReceipt[];

    const response: PPEApiResponse<PPEReceipt[]> = {
      success: true,
      data: receipts
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE receipts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE receipts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      ppeId, 
      ppeName, 
      dateOfReceipt, 
      quantityReceived, 
      remarks 
    } = body;

    // Validate required fields
    if (!ppeId || !ppeName || !dateOfReceipt || !quantityReceived) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantityReceived <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity received must be greater than 0' },
        { status: 400 }
      );
    }

    const { client, db } = await connectToDatabase();
    
    // Verify PPE exists and get details
    const ppeMasterCollection = db.collection('ppe-master');
    const ppeMaster = await ppeMasterCollection.findOne({ ppeId, isActive: true }) as PPEMaster | null;
    
    if (!ppeMaster) {
      return NextResponse.json(
        { success: false, error: 'PPE not found or inactive' },
        { status: 404 }
      );
    }

    // Get current user details
    const employeesCollection = db.collection('employees');
    const currentUser = await employeesCollection.findOne({ 
      empno: session.user.email 
    }) as Employee | null;

    const newReceipt: PPEReceiptInsert = {
      ppeId,
      ppeName,
      dateOfReceipt: new Date(dateOfReceipt),
      quantityReceived,
      remarks,
      receivedBy: currentUser?.empno || session.user.email,
      receivedByName: currentUser?.empname || session.user.email,
      createdAt: new Date(),
      createdBy: session.user!.email!
    };

    // Start a transaction to ensure both receipt record and stock transaction are created together
    const dbSession = await client.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        // Insert receipt record
        const collection = db.collection('ppe-receipts');
        const result = await collection.insertOne(newReceipt, { session: dbSession });
        
        // Get current stock balance
        const stockBalanceCollection = db.collection('ppe-stock-balance');
        const currentStockBalance = await stockBalanceCollection.findOne({ ppeId }, { session: dbSession }) as any;
        const currentStock = currentStockBalance?.balQty || 0;
        
        // Calculate new stock after receipt
        const newStockAfterReceipt = currentStock + quantityReceived;
        
        // Create transaction record
        const transactionsCollection = db.collection('ppe-transactions');
        const stockTransaction: PPETransactionInsert = {
          ppeId,
          dateTransaction: new Date(dateOfReceipt),
          relatedRecordId: result.insertedId.toString(),
          relatedRecordType: 'receipt',
          qtyIssued: quantityReceived, // Positive for receipts
          qtyAfterIssue: newStockAfterReceipt,
          transactionType: 'receipt',
          remarks: `Received ${quantityReceived} units${remarks ? ` - ${remarks}` : ''}`,
          createdBy: session.user!.email!,
          createdAt: new Date()
        };
        
        const transactionResult = await transactionsCollection.insertOne(stockTransaction, { session: dbSession });
        
        // Update stock balance record
        const newStockBalance: PPEStockBalanceInsert = {
          ppeId,
          balQty: newStockAfterReceipt,
          dateTimeUpdated: new Date(),
          transactionId: transactionResult.insertedId.toString(),
          createdAt: currentStockBalance?.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        await stockBalanceCollection.replaceOne(
          { ppeId }, 
          newStockBalance, 
          { session: dbSession, upsert: true }
        );
      });

      const response: PPEApiResponse<PPEReceipt> = {
        success: true,
        data: newReceipt as PPEReceipt
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
      console.error('Transaction error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create receipt' },
        { status: 500 }
      );
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error('Error creating PPE receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create PPE receipt' },
      { status: 500 }
    );
  }
}
