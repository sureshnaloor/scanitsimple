import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const workbook = XLSX.utils.book_new();

    const headers = [
      'WBS',
      'Project Name',
      'Status',
      'Description',
      'Project Manager Emp No',
      'Department',
      'Location City',
      'Start Date',
      'End Date',
    ];

    /** Only WBS, Project Name, and Status are required; leave other cells blank if unused. */
    const sampleRowMinimal = [
      'WBS-1001',
      'Sample project title',
      'active',
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRowMinimal]);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 36 },
      { wch: 12 },
      { wch: 28 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="projects_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating projects template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate projects template' },
      { status: 500 }
    );
  }
}
