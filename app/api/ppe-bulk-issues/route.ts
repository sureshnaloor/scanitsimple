import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEBulkIssue, PPEBulkIssueInsert, PPEMaster, Employee, PPETransactionInsert, PPEStockBalanceInsert, PPEApiResponse } from '@/types/ppe';

// GET - Fetch bulk PPE issue records
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
    const departmentOrProjectName = searchParams.get('departmentOrProjectName');
    const ppeId = searchParams.get('ppeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-bulk-issues');

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { departmentOrProjectName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { receiverUserEmpName: { $regex: search, $options: 'i' } },
        { receiverUserEmpNumber: { $regex: search, $options: 'i' } },
        { ppeName: { $regex: search, $options: 'i' } },
        { ppeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (departmentOrProjectName) {
      query.departmentOrProjectName = departmentOrProjectName;
    }
    
    if (ppeId) {
      query.ppeId = ppeId;
    }
    
    if (dateFrom || dateTo) {
      query.issueDate = {};
      if (dateFrom) {
        query.issueDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.issueDate.$lte = new Date(dateTo);
      }
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const bulkIssueRecords = await collection
      .find(query)
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: bulkIssueRecords,
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
    console.error('Error fetching bulk PPE issue records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bulk PPE issue records' },
      { status: 500 }
    );
  }
}

// POST - Create new bulk PPE issue record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      departmentOrProjectName,
      location,
      ppeId,
      quantityIssued,
      receiverUserEmpNumber,
      issueDate,
      remarks
    } = body;

    // Validate required fields
    if (!departmentOrProjectName || !location || !ppeId || !quantityIssued || !receiverUserEmpNumber || !issueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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
        { status: 400 }
      );
    }

    // Verify receiver employee exists
    const employeesCollection = db.collection('employees');
    const receiverEmployee = await employeesCollection.findOne({ 
      empno: receiverUserEmpNumber,
      active: { $ne: 'N' } // Not resigned/exited
    }) as Employee | null;
    
    if (!receiverEmployee) {
      return NextResponse.json(
        { success: false, error: 'Receiver employee not found or inactive' },
        { status: 400 }
      );
    }

    // Get issuer details (assuming current user is the issuer)
    const issuerEmployee = await employeesCollection.findOne({ 
      email: session.user.email 
    }) as Employee | null;

    const newBulkIssueRecord: PPEBulkIssueInsert = {
      departmentOrProjectName,
      location,
      ppeId,
      ppeName: ppeMaster.ppeName,
      quantityIssued,
      receiverUserEmpNumber,
      receiverUserEmpName: receiverEmployee.empname,
      issueDate: new Date(issueDate),
      issuedBy: issuerEmployee?.empno || session.user.email,
      issuedByName: issuerEmployee?.empname || session.user.email,
      remarks,
      createdAt: new Date(),
      createdBy: session.user!.email!
    };

    // Start a transaction to ensure both bulk issue record and stock transaction are created together
    const dbSession = await client.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        // Check current stock balance before issuing
        const stockBalanceCollection = db.collection('ppe-stock-balance');
        const currentStockBalance = await stockBalanceCollection.findOne(
          { ppeId },
          { session: dbSession }
        ) as any;
        
        const currentStock = currentStockBalance?.balQty || 0;
        
        if (currentStock < quantityIssued) {
          throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantityIssued}`);
        }
        
        // Insert PPE bulk issue record
        const collection = db.collection('ppe-bulk-issues');
        const result = await collection.insertOne(newBulkIssueRecord, { session: dbSession });
        
        // Create stock transaction record
        const newStockAfterIssue = currentStock - quantityIssued;
        const transactionsCollection = db.collection('ppe-transactions');
        const stockTransaction: PPETransactionInsert = {
          ppeId,
          dateTransaction: new Date(issueDate),
          relatedRecordId: result.insertedId.toString(),
          relatedRecordType: 'bulk',
          qtyIssued: -quantityIssued, // Negative for issues
          qtyAfterIssue: newStockAfterIssue,
          transactionType: 'bulk_issue',
          remarks: `Bulk issued to ${departmentOrProjectName} at ${location}`,
          createdBy: session.user!.email!,
          createdAt: new Date()
        };
        
        const transactionResult = await transactionsCollection.insertOne(stockTransaction, { session: dbSession });
        
        // Update stock balance record
        const newStockBalance: PPEStockBalanceInsert = {
          ppeId,
          balQty: newStockAfterIssue,
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
      
      const response: PPEApiResponse<PPEBulkIssue> = {
        success: true,
        data: { ...newBulkIssueRecord, _id: 'generated' },
        message: 'Bulk PPE issue record and stock transaction created successfully'
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
      throw error;
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error('Error creating bulk PPE issue record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bulk PPE issue record' },
      { status: 500 }
    );
  }
}
