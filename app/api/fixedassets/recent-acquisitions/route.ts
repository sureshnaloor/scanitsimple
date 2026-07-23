import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeCustody = searchParams.get('excludeCustody') === 'true';

    const { db, client } = await connectToDatabase();

    const match: any = {
      acquireddate: { $exists: true, $ne: null },
    };

    if (excludeCustody) {
      // Custody may live in either the default DB or the equipment DB.
      const [defaultCustody, equipmentCustody] = await Promise.all([
        db.collection('equipmentcustody').distinct('assetnumber').catch(() => []),
        client.db('equipment').collection('equipmentcustody').distinct('assetnumber').catch(() => []),
      ]);
      const custodyAssetNumbers = Array.from(
        new Set([...(defaultCustody || []), ...(equipmentCustody || [])])
      );
      if (custodyAssetNumbers.length > 0) {
        match.assetnumber = { $nin: custodyAssetNumbers };
      }
    }

    const assets = await db
      .collection('fixedassets')
      .aggregate([
        { $match: match },
        { $sort: { acquireddate: -1 } },
        { $limit: 100 },
        {
          $project: {
            assetnumber: 1,
            assetdescription: 1,
            assetcategory: 1,
            assetsubcategory: 1,
            assetstatus: 1,
            acquiredvalue: 1,
            acquireddate: 1,
            location: 1,
            department: 1,
          },
        },
      ])
      .toArray();

    assets.sort((a, b) => {
      const valueA = typeof a.acquiredvalue === 'number' ? a.acquiredvalue : 0;
      const valueB = typeof b.acquiredvalue === 'number' ? b.acquiredvalue : 0;
      if (valueB !== valueA) return valueB - valueA;
      const dateA = a.acquireddate ? new Date(a.acquireddate).getTime() : 0;
      const dateB = b.acquireddate ? new Date(b.acquireddate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ data: assets, total: assets.length });
  } catch (error) {
    console.error('Failed to fetch recent fixed asset acquisitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent fixed asset acquisitions' },
      { status: 500 }
    );
  }
}
