import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Employee, PPEApiResponse } from '@/types/ppe';

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

// GET - Fetch specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: { empno: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { empno } = params;

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    const employee = await collection.findOne({ empno }) as Employee | null;

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<Employee> = {
      success: true,
      data: employee
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { empno: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { empno } = params;
    const body = await request.json();
    const { empname, department, designation, email, phone, active } = body;

    // Validate required fields
    if (!empname) {
      return NextResponse.json(
        { success: false, error: 'Employee name is required' },
        { status: 400 }
      );
    }

    const validationError = await validateDepartmentAndDesignation(department, designation);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    // Check if employee exists
    const existingEmployee = await collection.findOne({ empno }) as Employee | null;
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const updateData = {
      empname,
      department,
      designation,
      email,
      phone,
      active: active !== undefined ? active : existingEmployee.active,
      updatedAt: new Date(),
      updatedBy: session.user.email
    };

    const result = await collection.updateOne(
      { empno },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Fetch updated employee
    const updatedEmployee = await collection.findOne({ empno }) as Employee | null;

    const response: PPEApiResponse<Employee> = {
      success: true,
      data: updatedEmployee!,
      message: 'Employee updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE - Delete employee (soft delete by setting active to 'N')
export async function DELETE(
  request: NextRequest,
  { params }: { params: { empno: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { empno } = params;

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');

    // Check if employee exists
    const existingEmployee = await collection.findOne({ empno }) as Employee | null;
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active to 'N'
    const result = await collection.updateOne(
      { empno },
      { 
        $set: { 
          active: 'N',
          updatedAt: new Date(),
          updatedBy: session.user.email
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const response: PPEApiResponse<null> = {
      success: true,
      data: null,
      message: 'Employee deactivated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate employee' },
      { status: 500 }
    );
  }
}
