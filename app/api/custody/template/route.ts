import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workbook = XLSX.utils.book_new();
    const headers = [
      'assetnumber*',
      'employeenumber*',
      'employeename*',
      'locationType*',
      'custodyCity',
      'premisesId',
      'premisesLabel',
      'floorRoom',
      'occupant',
      'custodyRemark',
      'rackBinPallet',
      'shedRoomNumber',
      'custodianDetail',
      'containerNumberRack',
      'warehouseCity', 
      'warehouseLocation',
      'departmentLocation',
      'campOfficeLocation',
      'location',
      'project',
      'projectname',
      'custodyfrom*',
      'custodyto',
      'documentnumber',
    ];

    const sampleRow = [
      '9901142',
      '11086',
      'SHAHID HUSSAIN',
      'camp/office',
      'Jubail',
      '69e6106198e6d94b96957981',
      'RC Facility - Industrial workshop',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'RC Facility - Industrial workshop',
      '',
      '',
      '2026-04-20',
      '',
      'FW26-0063//GP.2522',
    ];

    const instructionRow = [
      'Required columns are marked with *. custodyfrom/custodyto format: YYYY-MM-DD or ISO date-time. locationType allowed: warehouse, camp/office, project_site, department',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, instructionRow, sampleRow]);
    worksheet['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CustodyBulkTemplate');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="custody_bulk_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to generate custody template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
