import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const workbook = XLSX.utils.book_new();

    const headers = [
      'Premises Type',
      'Location Name',
      'Town/City',
      'Building/Tower',
      'Latitude',
      'Longitude',
      'Landmark',
      'Remarks',
    ];

    const sampleRow = [
      'department',
      'Main office — East wing',
      'Dammam',
      'Tower A',
      '26.3927',
      '49.9777',
      '',
      'Camp / office premises',
    ];

    const sampleWarehouse = [
      'warehouse',
      'WH staging',
      'Dammam',
      'Building 2',
      '',
      '',
      '',
      '',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow, sampleWarehouse]);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 36 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Locations');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="locations_bulk_insert_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating locations template:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate template' }, { status: 500 });
  }
}
