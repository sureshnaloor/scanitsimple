import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    const minDate = searchParams.get('minDate');
    const maxDate = searchParams.get('maxDate');

    const { db, client } = await connectToDatabase();
    // Try both databases - equipment database and default database
    const equipmentDb = client.db('equipment');
    const defaultDb = db;

    // Build base match conditions for value and date filters
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
    
    // Try equipment database first
    try {
      results = await equipmentDb.collection('equipmentandtools')
        .aggregate(pipeline)
        .toArray();
    } catch (err) {
      console.log('Lookup failed in equipment database, trying alternative approach');
    }

    // If no results, try cross-database approach (equipmentandtools in equipment db, equipmentcustody in default db)
    if (results.length === 0) {
      try {
        // Get all equipmentandtools from equipment database
        const allEquipment = await equipmentDb.collection('equipmentandtools')
          .find(baseMatch)
          .toArray();
        
        // Get all assetnumbers with custody from default database
        const custodyAssetNumbers = await defaultDb.collection('equipmentcustody')
          .distinct('assetnumber');
        
        // Filter out equipment that has custody
        results = allEquipment
          .filter((eq: any) => !custodyAssetNumbers.includes(eq.assetnumber))
          .map((eq: any) => ({
            _id: eq._id,
            assetnumber: eq.assetnumber,
            assetdescription: eq.assetdescription,
            assetstatus: eq.assetstatus,
            assetmodel: eq.assetmodel,
            assetmanufacturer: eq.assetmanufacturer,
            assetserialnumber: eq.assetserialnumber,
            acquireddate: eq.acquireddate,
            acquiredvalue: eq.acquiredvalue,
            assetcategory: eq.assetcategory,
            assetsubcategory: eq.assetsubcategory,
            assetnotes: eq.assetnotes,
            accessories: eq.accessories
          }))
          .sort((a: any, b: any) => a.assetnumber.localeCompare(b.assetnumber));
      } catch (err) {
        console.error('Alternative lookup approach failed:', err);
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Failed to fetch MME without custodian:', err);
    return NextResponse.json(
      { error: 'Failed to fetch MME equipment without custodian' },
      { status: 500 }
    );
  }
}

