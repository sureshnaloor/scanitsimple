import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEMaster, PPEApiResponse } from '@/types/ppe';
import { ObjectId } from 'mongodb';

// GET - Fetch specific PPE master record
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
    const collection = db.collection('ppe-master');

    const ppeRecord = await collection.findOne({ ppeId }) as PPEMaster | null;

    if (!ppeRecord) {
      return NextResponse.json(
        { success: false, error: 'PPE record not found' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<PPEMaster> = {
      success: true,
      data: ppeRecord
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE master record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE master record' },
      { status: 500 }
    );
  }
}

// PUT - Update PPE master record
export async function PUT(
  request: NextRequest,
  { params }: { params: { ppeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { ppeId } = params;
    const body = await request.json();
    const { ppeName, materialCode, life, lifeUOM, description, category, isActive } = body;

    // Validate required fields
    if (!ppeName || !materialCode || !life || !lifeUOM) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const { db } = await connectToDatabase();
    const collection = db.collection('ppe-master');

    // Check if PPE record exists
    const existingPPE = await collection.findOne({ ppeId }) as PPEMaster | null;
    if (!existingPPE) {
      return NextResponse.json(
        { success: false, error: 'PPE record not found' },
        { status: 404 }
      );
    }

    const updateData = {
      ppeName,
      materialCode,
      life,
      lifeUOM,
      description,
      category,
      isActive: isActive !== undefined ? isActive : existingPPE.isActive,
      updatedAt: new Date(),
      updatedBy: session.user.email
    };

    const result = await collection.updateOne(
      { ppeId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'PPE record not found' },
        { status: 404 }
      );
    }

    // Fetch updated record
    const updatedPPE = await collection.findOne({ ppeId }) as PPEMaster | null;

    const response: PPEApiResponse<PPEMaster> = {
      success: true,
      data: updatedPPE!,
      message: 'PPE master record updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating PPE master record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update PPE master record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete PPE master record
export async function DELETE(
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
    const collection = db.collection('ppe-master');

    // Check if PPE record exists
    const existingPPE = await collection.findOne({ ppeId }) as PPEMaster | null;
    if (!existingPPE) {
      return NextResponse.json(
        { success: false, error: 'PPE record not found' },
        { status: 404 }
      );
    }

    // Check if PPE is being used in issue records
    const issueRecordsCollection = db.collection('ppe-records');
    const issueCount = await issueRecordsCollection.countDocuments({ ppeId });
    
    if (issueCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete PPE record. It is being used in issue records.' },
        { status: 400 }
      );
    }

    const result = await collection.deleteOne({ ppeId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'PPE record not found' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<null> = {
      success: true,
      data: null,
      message: 'PPE master record deleted successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting PPE master record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete PPE master record' },
      { status: 500 }
    );
  }
}
