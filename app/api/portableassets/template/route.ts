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
      'Department',
      'Portable Type',
      'Installation Location'
    ];

    const sampleRow = [
      'PA-9001',
      'Site office unit',
      'Portable',
      'Container',
      'Active',
      45000,
      '2025-01-15',
      'Yard A',
      'Projects',
      'container_40',
      'Plot 12, Industrial City'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Portable Assets');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="portableassets_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating portable assets template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate portable assets template' },
      { status: 500 }
    );
  }
}
