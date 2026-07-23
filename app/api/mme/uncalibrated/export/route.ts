import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/auth';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    const uncalibratedEquipment = await db
      .collection('equipmentandtools')
      .aggregate([
        {
          $match: {
            assetnumber: {
              $regex: '^5',
            },
          },
        },
        {
          $lookup: {
            from: 'equipmentcalibcertificates',
            localField: 'assetnumber',
            foreignField: 'assetnumber',
            as: 'calibrations',
          },
        },
        {
          $match: {
            $expr: {
              $eq: [{ $size: '$calibrations' }, 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            assetnumber: 1,
            assetdescription: 1,
            assetcategory: 1,
            assetsubcategory: 1,
            assetstatus: 1,
            acquiredvalue: 1,
            acquireddate: 1,
            assetmanufacturer: 1,
            assetmodel: 1,
            assetserialnumber: 1,
          },
        },
      ])
      .toArray();

    const headers = [
      'Asset Number',
      'Description',
      'Category',
      'Subcategory',
      'Status',
      'Acquired Value',
      'Acquired Date',
      'Manufacturer',
      'Model',
      'Serial Number',
    ];

    const rows = uncalibratedEquipment.map((item) => [
      item.assetnumber ?? '',
      item.assetdescription ?? '',
      item.assetcategory ?? '',
      item.assetsubcategory ?? '',
      item.assetstatus ?? '',
      item.acquiredvalue ?? '',
      item.acquireddate ? new Date(item.acquireddate).toISOString().split('T')[0] : '',
      item.assetmanufacturer ?? '',
      item.assetmodel ?? '',
      item.assetserialnumber ?? '',
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    worksheet['!cols'] = [
      { wch: 16 },
      { wch: 30 },
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'MME Un-calibrated');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="mme_uncalibrated_equipment.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Failed to export un-calibrated MME:', err);
    return NextResponse.json(
      { error: 'Failed to export un-calibrated MME' },
      { status: 500 }
    );
  }
}

