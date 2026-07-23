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
      'Split AC unit 2 ton',
      'Facility',
      'HVAC',
      'Active',
      8500,
      '2025-01-15',
      'Building A - Floor 2',
      'Facilities'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facility Assets');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="facilityassets_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating facility assets template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate facility assets template' },
      { status: 500 }
    );
  }
}
