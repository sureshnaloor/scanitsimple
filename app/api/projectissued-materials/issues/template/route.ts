import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/auth';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Define headers for material issues
    const headers = [
      'Material ID',
      'Drawing Number',
      'Equipment',
      'Room',
      'Requestor Name',
      'Quantity Requested',
      'Issuer Name',
      'Issue Quantity',
      'Remarks'
    ];

    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Material ID
      { wch: 20 }, // Drawing Number
      { wch: 20 }, // Equipment
      { wch: 15 }, // Room
      { wch: 20 }, // Requestor Name
      { wch: 18 }, // Quantity Requested
      { wch: 20 }, // Issuer Name
      { wch: 18 }, // Issue Quantity
      { wch: 30 }  // Remarks
    ];
    worksheet['!cols'] = columnWidths;

    // Add instruction row (row 2) explaining requirements
    const instructionRow = [
      'IMPORTANT: Material ID must exist in the system. This is a transaction record, not a new material.',
      '', '', '', '', '', '', '', ''
    ];
    XLSX.utils.sheet_add_aoa(worksheet, [instructionRow], { origin: -1 });
    
    // Style the instruction row (make it stand out)
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    worksheet['!rows'][1] = { hpt: 20 }; // Set row height

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Issues');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true
    });

    // Return Excel file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="material_issues_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Failed to generate material issues template:', err);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

