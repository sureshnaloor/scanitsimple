import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEMaster, PPEMasterInsert, PPETransactionInsert, PPEStockBalanceInsert, PPEApiResponse } from '@/types/ppe';

// GET - Fetch all PPE master records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-master');

    // Build query
    let query: any = {};
    if (search) {
      query.$or = [
        { ppeName: { $regex: search, $options: 'i' } },
        { ppeId: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (active !== null && active !== undefined) {
      query.isActive = active === 'true';
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const ppeRecords = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: ppeRecords,
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
    console.error('Error fetching PPE master records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE master records' },
      { status: 500 }
    );
  }
}

// POST - Create new PPE master record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ppeId, ppeName, materialCode, life, lifeUOM, description, category, initialStock } = body;

    // Validate required fields
    if (!ppeId || !ppeName || !materialCode || !life || !lifeUOM) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate initial stock
    if (!initialStock || initialStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Initial stock is required and must be non-negative' },
        { status: 400 }
      );
    }

    // Validate life UOM
    if (!['week', 'month', 'year'].includes(lifeUOM)) {
      return NextResponse.json(
        { success: false, error: 'Invalid life UOM. Must be week, month, or year' },
        { status: 400 }
      );
    }

    const { client, db } = await connectToDatabase();
    const collection = db.collection('ppe-master');

    // Check if PPE ID already exists
    const existingPPE = await collection.findOne({ ppeId }) as PPEMaster | null;
    if (existingPPE) {
      return NextResponse.json(
        { success: false, error: 'PPE ID already exists' },
        { status: 400 }
      );
    }

    const newPPE: PPEMasterInsert = {
      ppeId,
      ppeName,
      materialCode,
      life,
      lifeUOM,
      description,
      category,
      isActive: true,
      createdAt: new Date(),
      createdBy: session.user!.email!
    };

    // Start a transaction to ensure both PPE master and transaction are created together
    const dbSession = await client.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        // Insert PPE master record
        const result = await collection.insertOne(newPPE, { session: dbSession });
        
        // Create initial stock transaction
        const transactionCollection = db.collection('ppe-transactions');
        const initialTransaction: PPETransactionInsert = {
          ppeId,
          initialQty: initialStock,
          dateInitialQty: new Date(),
          dateTransaction: new Date(),
          qtyAfterIssue: initialStock,
          transactionType: 'initial',
          remarks: 'Initial stock entry',
          createdBy: session.user!.email!,
          createdAt: new Date()
        };
        
        const transactionResult = await transactionCollection.insertOne(initialTransaction, { session: dbSession });
        
        // Create initial stock balance record
        const stockBalanceCollection = db.collection('ppe-stock-balance');
        const initialStockBalance: PPEStockBalanceInsert = {
          ppeId,
          balQty: initialStock,
          dateTimeUpdated: new Date(),
          transactionId: transactionResult.insertedId.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await stockBalanceCollection.insertOne(initialStockBalance, { session: dbSession });
      });
      
      const response: PPEApiResponse<PPEMaster> = {
        success: true,
        data: { ...newPPE, _id: 'generated' },
        message: 'PPE master record and initial stock created successfully'
      };

      return NextResponse.json(response, { status: 201 });
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error('Error creating PPE master record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create PPE master record' },
      { status: 500 }
    );
  }
}
