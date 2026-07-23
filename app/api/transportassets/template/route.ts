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
      'Plate Number',
      'Chassis Number',
      'Engine Number',
      'Model',
      'Year'
    ];

    const sampleRow = [
      'TA-3001',
      'Light delivery van',
      'Vehicles',
      'Light commercial',
      'Active',
      85000,
      '2024-03-15',
      'Riyadh Depot',
      'Logistics',
      'ABC 1234',
      'CHS-9X8Y7Z',
      'ENG-556677',
      'Toyota Hiace',
      2023
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transport Assets');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="transportassets_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating transport assets template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate transport assets template' },
      { status: 500 }
    );
  }
}
