import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    const minDate = searchParams.get('minDate');
    const maxDate = searchParams.get('maxDate');
    const category = searchParams.get('category');

    const { db, client } = await connectToDatabase();
    // Fixed assets are in the default database (as per /api/fixedassets)
    const defaultDb = db;
    const equipmentDb = client.db('equipment');

    // Build base match conditions for value, date, and category filters
    const baseMatch: any = {};
    
    if (minValue) {
      baseMatch.acquiredvalue = { $gte: parseFloat(minValue) };
    }
    if (maxValue) {
      if (baseMatch.acquiredvalue) {
        baseMatch.acquiredvalue.$lte = parseFloat(maxValue);
      } else {
        baseMatch.acquiredvalue = { $lte: parseFloat(maxValue) };
      }
    }
    
    if (minDate) {
      baseMatch.acquireddate = { $gte: new Date(minDate) };
    }
    if (maxDate) {
      if (baseMatch.acquireddate) {
        baseMatch.acquireddate.$lte = new Date(maxDate);
      } else {
        baseMatch.acquireddate = { $lte: new Date(maxDate) };
      }
    }

    if (category) {
      baseMatch.assetcategory = category;
    }

    // Try lookup in equipment database first (if equipmentcustody is there)
    let pipeline: any[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'equipmentcustody',
          localField: 'assetnumber',
          foreignField: 'assetnumber',
          as: 'custodyRecords'
        }
      },
      {
        $match: {
          custodyRecords: { $size: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          assetnumber: 1,
          assetdescription: 1,
          assetstatus: 1,
          assetmodel: 1,
          assetmanufacturer: 1,
          assetserialnumber: 1,
          acquireddate: 1,
          acquiredvalue: 1,
          assetcategory: 1,
          assetsubcategory: 1,
          assetnotes: 1,
          accessories: 1
        }
      },
      {
        $sort: {
          assetnumber: 1
        }
      }
    ];

    let results: any[] = [];
    
    // Try default database first (where fixedassets is located)
    try {
      results = await defaultDb.collection('fixedassets')
        .aggregate(pipeline)
        .toArray();
    } catch (err) {
      console.log('Lookup failed in default database, trying alternative approach');
    }

    // If no results, try cross-database approach (fixedassets in default db, equipmentcustody might be in default db too)
    if (results.length === 0) {
      try {
        // Get all fixedassets from default database
        const allAssets = await defaultDb.collection('fixedassets')
          .find(baseMatch)
          .toArray();
        
        // Get all assetnumbers with custody from default database
        const custodyAssetNumbers = await defaultDb.collection('equipmentcustody')
          .distinct('assetnumber');
        
        // Filter out assets that have custody
        results = allAssets
          .filter((asset: any) => !custodyAssetNumbers.includes(asset.assetnumber))
          .map((asset: any) => ({
            _id: asset._id,
            assetnumber: asset.assetnumber,
            assetdescription: asset.assetdescription,
            assetstatus: asset.assetstatus,
            assetmodel: asset.assetmodel,
            assetmanufacturer: asset.assetmanufacturer,
            assetserialnumber: asset.assetserialnumber,
            acquireddate: asset.acquireddate,
            acquiredvalue: asset.acquiredvalue,
            assetcategory: asset.assetcategory,
            assetsubcategory: asset.assetsubcategory,
            assetnotes: asset.assetnotes,
            accessories: asset.accessories
          }))
          .sort((a: any, b: any) => a.assetnumber.localeCompare(b.assetnumber));
      } catch (err) {
        console.error('Alternative lookup approach failed:', err);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Failed to fetch fixed assets without custodian:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fixed assets without custodian' },
      { status: 500 }
    );
  }
}

