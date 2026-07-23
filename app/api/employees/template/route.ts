import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import * as XLSX from 'xlsx';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const workbook = XLSX.utils.book_new();
    const headers = [
      'Employee Number',
      'Employee Name',
      'Department',
      'Designation',
      'Email',
      'Phone',
      'Active'
    ];

    const sampleRow = [
      '10001',
      'John Doe',
      'Operations',
      'Supervisor',
      'john.doe@example.com',
      '+966500000000',
      'Y'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employee_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating employee template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate employee template' },
      { status: 500 }
    );
  }
}
