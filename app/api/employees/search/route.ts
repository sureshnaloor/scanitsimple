import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Employee, PPEApiResponse } from '@/types/ppe';

// GET - Search employees with minimum 3 characters for name search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Support both 'q' and 'search' query parameters for backward compatibility
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Debug logging
    console.log('Employee search API called:', { 
      search, 
      searchLength: search.length,
      isNumeric: /^\d+$/.test(search),
      limit, 
      url: request.url,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!search || search.trim() === '') {
      console.log('Validation failed: search term is empty');
      return NextResponse.json(
        { success: false, error: 'Search term is required' },
        { status: 400 }
      );
    }

    // For name search, require minimum 3 characters (reduced from 5 for better UX)
    // For numeric search, allow any length
    if (search.length < 3 && !/^\d+$/.test(search)) {
      console.log('Validation failed: search term too short', { search, length: search.length });
      return NextResponse.json(
        { success: false, error: `Minimum 3 characters required for name search. Received: "${search}" (${search.length} chars)` },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    // Build query
    let query: any = {
      active: { $ne: 'N' } // Only active employees
    };

    if (/^\d+$/.test(search)) {
      // If search is numeric, search by employee number
      query.empno = { $regex: search, $options: 'i' };
    } else {
      // If search is text, search by name (minimum 3 characters already validated)
      query.empname = { $regex: search, $options: 'i' };
    }

    // Get results
    const employees = await collection
      .find(query)
      .sort({ empname: 1 })
      .limit(limit)
      .toArray();

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: employees,
        total: employees.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching employees:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to search employees: ${errorMessage}` },
      { status: 500 }
    );
  }
}