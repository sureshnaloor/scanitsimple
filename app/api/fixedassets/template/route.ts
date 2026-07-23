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
      'Location',
      'Department'
    ];

    const sampleRow = [
      'FA-1001',
      'Office Desk',
      'Furniture',
      'Office',
      'Active',
      650,
      '2025-02-10',
      'Riyadh Warehouse',
      'Admin'
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
      { wch: 24 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixed Assets');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="fixedassets_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating fixed assets template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate fixed assets template' },
      { status: 500 }
    );
  }
}
