import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Employee, EmployeeInsert, PPEApiResponse } from '@/types/ppe';

async function validateDepartmentAndDesignation(
  department: unknown,
  designation: unknown
): Promise<string | null> {
  const departmentName = String(department ?? '').trim();
  const designationName = String(designation ?? '').trim();
  const { db } = await connectToDatabase();

  if (departmentName) {
    const existingDepartment = await db.collection('departments').findOne({ name: departmentName });
    if (!existingDepartment) {
      return 'Selected department does not exist';
    }
  }

  if (designationName) {
    const existingDesignation = await db.collection('designations').findOne({ name: designationName });
    if (!existingDesignation) {
      return 'Selected designation does not exist';
    }
  }

  return null;
}

// GET - Fetch all employees
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
    const empnoOnly = searchParams.get('empno_only') === 'true';
    const active = searchParams.get('active');

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    // Build query
    let query: any = {};
    if (search) {
      if (empnoOnly) {
        // Exact match for employee number when empno_only is true
        query.empno = search;
      } else {
        // General search across multiple fields
        query.$or = [
          { empname: { $regex: search, $options: 'i' } },
          { empno: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } }
        ];
      }
    }
    if (active !== null && active !== undefined) {
      if (active === 'true') {
        query.active = { $ne: 'N' }; // Active employees (Y or null)
      } else if (active === 'false') {
        query.active = 'N'; // Inactive employees
      }
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const employees = await collection
      .find(query)
      .sort({ empname: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const response: PPEApiResponse<any> = {
      success: true,
      data: {
        records: employees,
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
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { empno, empname, department, designation, email, phone } = body;

    // Validate required fields
    if (!empno || !empname) {
      return NextResponse.json(
        { success: false, error: 'Employee number and name are required' },
        { status: 400 }
      );
    }

    const validationError = await validateDepartmentAndDesignation(department, designation);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    // Check if employee number already exists
    const existingEmployee = await collection.findOne({ empno }) as Employee | null;
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee number already exists' },
        { status: 400 }
      );
    }

    const newEmployee: EmployeeInsert = {
      empno,
      empname,
      department,
      designation,
      email,
      phone,
      active: 'Y', // Default to active
      createdAt: new Date(),
      createdBy: session.user!.email!
    };

    const result = await collection.insertOne(newEmployee);

    const response: PPEApiResponse<Employee> = {
      success: true,
      data: { ...newEmployee, _id: result.insertedId.toString() },
      message: 'Employee created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}