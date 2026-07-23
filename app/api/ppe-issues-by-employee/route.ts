import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PPEIssueRecord, PPEApiResponse } from '@/types/ppe';

// GET - Fetch PPE issues by employee
export async function GET(request: NextRequest) {
  try {
    console.log('PPE Issues API called');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Unauthorized access to PPE Issues API');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userEmpNumber = searchParams.get('userEmpNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('PPE Issues API params:', { userEmpNumber, page, limit });

    if (!userEmpNumber) {
      console.log('No employee number provided');
      return NextResponse.json(
        { success: false, error: 'Employee number is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('pastppeissues');

    // Build query for specific employee
    const query = { userEmpNumber };
    console.log('PPE Issues query:', query);

    // Get total count
    const total = await collection.countDocuments(query);
    console.log('PPE Issues total count from pastppeissues collection:', total);

    // Get paginated results
    const skip = (page - 1) * limit;
    const issueRecords = await collection
      .find(query)
      .sort({ dateOfIssue: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('PPE Issues found in pastppeissues collection:', issueRecords.length, 'records');

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: issueRecords,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };

    console.log('PPE Issues API response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching PPE issues by employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PPE issues by employee' },
      { status: 500 }
    );
  }
}
