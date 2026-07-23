import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeInsert } from '@/types/ppe';

type BulkEmployeeRow = {
  empno: string;
  empname: string;
  department?: string;
  designation?: string;
  email?: string;
  phone?: string;
  active?: 'Y' | 'N';
  sourceRow?: number;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function normalizeActive(value: unknown): 'Y' | 'N' {
  const text = normalizeText(value).toUpperCase();
  return text === 'N' ? 'N' : 'Y';
}

function validateRows(rows: BulkEmployeeRow[]) {
  const errors: string[] = [];
  const normalizedRows: BulkEmployeeRow[] = [];
  const seenEmpnoInFile = new Set<string>();

  rows.forEach((row, index) => {
    const rowNo = row.sourceRow ?? index + 2;
    const empno = normalizeText(row.empno);
    const empname = normalizeText(row.empname);

    if (!empno) {
      errors.push(`Row ${rowNo}: Employee Number is required.`);
      return;
    }

    if (!empname) {
      errors.push(`Row ${rowNo}: Employee Name is required.`);
      return;
    }

    if (seenEmpnoInFile.has(empno)) {
      errors.push(`Row ${rowNo}: Duplicate Employee Number "${empno}" found in uploaded file.`);
      return;
    }
    seenEmpnoInFile.add(empno);

    normalizedRows.push({
      empno,
      empname,
      department: normalizeText(row.department),
      designation: normalizeText(row.designation),
      email: normalizeText(row.email),
      phone: normalizeText(row.phone),
      active: normalizeActive(row.active),
      sourceRow: rowNo
    });
  });

  return { errors, normalizedRows };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const createdBy = session.user.email;

    const body = await request.json();
    const action = body?.action;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!['validate', 'insert'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "validate" or "insert".' },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'No rows received for processing.' },
        { status: 400 }
      );
    }

    const { errors, normalizedRows } = validateRows(rows);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', errors },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('employees');
    const departmentsCollection = db.collection('departments');
    const designationsCollection = db.collection('designations');

    const [departmentDocs, designationDocs] = await Promise.all([
      departmentsCollection.find({}, { projection: { name: 1 } }).toArray(),
      designationsCollection.find({}, { projection: { name: 1 } }).toArray()
    ]);
    const validDepartments = new Set(departmentDocs.map((item: any) => String(item.name)));
    const validDesignations = new Set(designationDocs.map((item: any) => String(item.name)));

    const invalidLookupErrors: string[] = [];
    normalizedRows.forEach((row) => {
      if (row.department && !validDepartments.has(row.department)) {
        invalidLookupErrors.push(
          `Row ${row.sourceRow}: Department "${row.department}" does not exist in master list.`
        );
      }
      if (row.designation && !validDesignations.has(row.designation)) {
        invalidLookupErrors.push(
          `Row ${row.sourceRow}: Designation "${row.designation}" does not exist in master list.`
        );
      }
    });

    if (invalidLookupErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', errors: invalidLookupErrors },
        { status: 400 }
      );
    }

    const empnos = normalizedRows.map((row) => row.empno);
    const existingEmployees = await collection
      .find({ empno: { $in: empnos } }, { projection: { empno: 1 } })
      .toArray();

    const existingEmpnoSet = new Set(existingEmployees.map((emp: any) => String(emp.empno)));
    const newRows = normalizedRows.filter((row) => !existingEmpnoSet.has(row.empno));
    const skippedExisting = normalizedRows.filter((row) => existingEmpnoSet.has(row.empno));

    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        data: {
          totalUploaded: normalizedRows.length,
          validForInsert: newRows.length,
          skippedExisting: skippedExisting.map((row) => ({
            empno: row.empno,
            sourceRow: row.sourceRow
          })),
          rowsToInsert: newRows
        },
        message:
          newRows.length > 0
            ? 'Validation successful. New employee rows are ready for insertion.'
            : 'Validation successful. No new employee rows to insert.'
      });
    }

    if (newRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No new employees to insert. All uploaded employee numbers already exist.',
          data: {
            skippedExisting: skippedExisting.map((row) => ({
              empno: row.empno,
              sourceRow: row.sourceRow
            }))
          }
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const insertDocs: EmployeeInsert[] = newRows.map((row) => ({
      empno: row.empno,
      empname: row.empname,
      department: row.department || undefined,
      designation: row.designation || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      active: row.active ?? 'Y',
      createdAt: now,
      createdBy
    }));

    const result = await collection.insertMany(insertDocs);

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: result.insertedCount,
        skippedExistingCount: skippedExisting.length,
        skippedExisting: skippedExisting.map((row) => ({
          empno: row.empno,
          sourceRow: row.sourceRow
        }))
      },
      message: `Inserted ${result.insertedCount} employee(s) successfully.`
    });
  } catch (error: any) {
    console.error('Error in employee bulk import:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process bulk employee import.',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
