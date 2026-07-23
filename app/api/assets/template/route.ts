import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const workbook = XLSX.utils.book_new();

    const headers = [
      'Asset Number',
      'Asset Description',
      'Asset Category',
      'Asset Subcategory',
      'Asset Status',
      'Acquired Value',
      'Acquired Date',
      'Asset Manufacturer',
      'Asset Model',
      'Asset Serial Number'
    ];

    const sampleRow = [
      '503999',
      'Digital Multimeter',
      'Test Equipment',
      'Electrical',
      'Active',
      1250,
      '2025-01-15',
      'Fluke',
      '87V',
      'SN-EXAMPLE-001'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = [
      { wch: 16 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'MME Assets');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mme_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating MME template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate MME template' },
      { status: 500 }
    );
  }
}
