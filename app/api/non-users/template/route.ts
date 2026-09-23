import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import * as XLSX from 'xlsx';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { apiJson } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiJson({ success: false, error: 'Unauthorized: sign in required' }, { status: 401 });
    }

    const workbook = XLSX.utils.book_new();
    const headers = [
      'Full Name',
      'National ID',
      'Company Serial Number',
      'Passport Number',
      'Address',
      'Phone',
      'Email',
      'Category',
      'Active'
    ];

    const sampleRow = [
      'Alex Smith',
      '1098765432',
      'SN-99482',
      'N9876543',
      'Building 4, King Fahd Road, Dammam',
      '+966551234567',
      'alex.smith@visitor-client.com',
      'Visitor',
      'Y'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 35 },
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Non-Users');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="non_user_bulk_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating non-user template:', error);
    return apiJson(
      { success: false, error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
