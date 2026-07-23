import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

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
    
    // Define headers for project return materials - matching the Add Material form
    const headers = [
      'Material Code',
      'Material Description',
      'UOM',
      'Quantity',
      'Source Project',
      'Source PO Number',
      'Source Issue Number',
      'Source Unit Rate',
      'Warehouse Location',
      'Yard/Room/Rack-Bin',
      'Received in Warehouse Date',
      'Consignment Note Number',
      'Remarks'
    ];

    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 18 }, // Material Code
      { wch: 30 }, // Material Description
      { wch: 10 }, // UOM
      { wch: 12 }, // Quantity
      { wch: 20 }, // Source Project
      { wch: 18 }, // Source PO Number
      { wch: 20 }, // Source Issue Number
      { wch: 18 }, // Source Unit Rate
      { wch: 20 }, // Warehouse Location
      { wch: 20 }, // Yard/Room/Rack-Bin
      { wch: 22 }, // Received in Warehouse Date
      { wch: 22 }, // Consignment Note Number
      { wch: 30 }  // Remarks
    ];
    worksheet['!cols'] = columnWidths;

    // Add instruction row (row 2) explaining requirements
    const instructionRow = [
      'Note: Fields marked with * are required. Material ID will be auto-generated.',
      '', '', '', '', '', '', '', '', '', '', '', ''
    ];
    XLSX.utils.sheet_add_aoa(worksheet, [instructionRow], { origin: -1 });
    
    // Style the instruction row (make it stand out)
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    worksheet['!rows'][1] = { hpt: 20 }; // Set row height

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');

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
        'Content-Disposition': 'attachment; filename="project_return_materials_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Failed to generate project return materials template:', err);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

